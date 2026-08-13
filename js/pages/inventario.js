// Cafe Fusiones - Inventario y Logistica V4
// Ruta: js/pages/inventario.js
// Vistas: resumen | stock | kardex | lotes | compras | proveedores
//         recetas | mermas | produccion | trazabilidad

import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState, inventoryCategories, addAuditEvent } from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { confirmAction } from "../components/confirm.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, statusClass, matchesSearch, unitOptions } from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(location.search);

const TABS = [
  ["resumen","Resumen","▦"],["stock","Stock","▤"],["kardex","Kardex","↕"],
  ["lotes","Lotes","◫"],["compras","Compras","🛒"],["proveedores","Proveedores","◎"],
  ["recetas","Recetas / BOM","◈"],["mermas","Mermas","△"],
  ["produccion","Producción","⚙"],["trazabilidad","Farm-to-Cup","⌁"]
];

const WASTE_REASONS = {
  "Insumo":["Vencimiento","Deterioro","Derrame o caída","Rotura","Error de almacenamiento","Ajuste de inventario","Otro"],
  "Preparación":["Error de preparación","Cambio solicitado por cliente","Derrame o caída","Sobreproducción","Control de calidad","Rendimiento menor al esperado","Otro"],
  "Producto terminado":["Cambio solicitado por cliente","Preparación incorrecta","Devolución del cliente","Derrame o caída","Sobreproducción","Control de calidad","Otro"]
};

const ui = {
  tab: TABS.some(([id]) => id === params.get("tab")) ? params.get("tab") : "resumen",
  search: "", stockCategory:"Todos", supplierType:"Todos", wasteType:"Todos",
  lotStatus:"Todos", recipeStation:"Todos"
};

if (session) init();

function init(){
  normalizeState();
  renderSidebar("inventario", session.role);
  renderTopbar({
    title:"Inventario y Logística", eyebrow:"Operaciones",
    searchPlaceholder:"Buscar en inventario...",
    onSearch:q => { ui.search=q||""; render(); }
  });
  render();
}

function normalizeState(){
  state.inventory ||= [];
  state.inventoryMovements ||= [];
  state.purchaseOrders ||= [];
  state.purchaseSuggestions ||= [];
  state.wasteRecords ||= [];
  state.coffeeLots ||= [];
  state.menuItems ||= [];
  if(!Array.isArray(state.suppliers)) state.suppliers = supplierSeed();
  if(!Array.isArray(state.recipes)) state.recipes = recipeSeed();
  if(!Array.isArray(state.inventoryLots)) state.inventoryLots = lotSeed();
  if(!Array.isArray(state.productionBatches)) state.productionBatches = productionSeed();
  if(!state.purchaseOrders.length) state.purchaseOrders = purchaseSeed();
  if(!state.inventoryMovements.length) state.inventoryMovements = movementSeed();

  state.inventory = state.inventory.map(i=>({
    type: inferInventoryType(i), committed:Number(i.committed||0), active:i.active!==false, ...i
  }));
  state.suppliers = state.suppliers.map(s=>({
    status:s.status||"Activo", products:Array.isArray(s.products)?s.products:[], ...s
  }));
  state.recipes = state.recipes.map(r=>({
    status:r.status||"Activa", version:r.version||"1.0",
    ingredients:Array.isArray(r.ingredients)?r.ingredients:[], variants:Array.isArray(r.variants)?r.variants:[], ...r
  }));
  state.wasteRecords = state.wasteRecords.map((r,i)=>({
    id:r.id||`MER-${String(i+1).padStart(3,"0")}`,
    type:normalizeWasteType(r.type), status:r.status||"Registrada",
    date:r.date||String(r.at||today()).slice(0,10), cost:Number(r.cost||0), ...r
  }));
  state.productionBatches = state.productionBatches.map(b=>({status:b.status||"Finalizado",...b}));
  buildSuggestions();
  saveState(state);
}

/* -------------------------- DEMO SEEDS -------------------------- */

function supplierSeed(){
  return [
    {id:"PRV-001",type:"Formal",name:"Lácteos Amazonas S.A.C.",tradeName:"Lácteos Amazonas",documentType:"RUC",document:"20608452139",phone:"942 310 188",email:"ventas@lacteosamazonas.pe",origin:"Chachapoyas, Amazonas",paymentTerms:"Crédito 15 días",voucher:"Factura",products:["Leche fresca","Quesos"],status:"Activo",notes:"Proveedor recurrente de refrigerados."},
    {id:"PRV-002",type:"Informal",name:"Don Mateo Huamán",tradeName:"Productor Huayabamba",documentType:"Sin documento",document:"",phone:"987 420 816",email:"",origin:"Valle del Huayabamba, Amazonas",paymentTerms:"Contado",voucher:"Sustento interno",products:["Café verde de especialidad"],status:"Activo",notes:"Productor local. Se registra procedencia, lote y responsable interno."},
    {id:"PRV-003",type:"Informal",name:"Rosa Pinedo",tradeName:"Chacra Pinedo",documentType:"DNI opcional",document:"43821976",phone:"956 311 742",email:"",origin:"Levanto, Amazonas",paymentTerms:"Contado",voucher:"Sustento interno",products:["Palta","Naranja","Hierbas"],status:"Activo",notes:"Abastecimiento estacional."},
    {id:"PRV-004",type:"Formal",name:"Distribuidora Andina E.I.R.L.",tradeName:"Distribuidora Andina",documentType:"RUC",document:"20487831246",phone:"945 228 071",email:"pedidos@distribuidoraandina.pe",origin:"Chachapoyas",paymentTerms:"Contado",voucher:"Factura",products:["Gaseosa","Agua mineral","Cerveza"],status:"Activo",notes:""}
  ];
}

function recipeSeed(){
  return [
    {id:"RCP-001",productId:"caf-cappuccino",name:"Cappuccino",station:"Barra",yieldQty:1,yieldUnit:"porción",targetMinutes:5,expectedWastePct:2,version:"1.1",status:"Activa",
      ingredients:[{inventoryId:"INS-01",qty:.018,unit:"kg",note:"18 g café tostado"},{inventoryId:"INS-02",qty:.18,unit:"L",note:"180 ml leche fresca"}],
      variants:[{modifier:"Leche de avena",replaceInventoryId:"INS-02",withInventoryId:"INS-03",qty:.18,unit:"L"},{modifier:"Leche de almendras",replaceInventoryId:"INS-02",withInventoryId:"INS-04",qty:.18,unit:"L"}]},
    {id:"RCP-002",productId:"caf-latte",name:"Café Latte",station:"Barra",yieldQty:1,yieldUnit:"porción",targetMinutes:5,expectedWastePct:2,version:"1.0",status:"Activa",
      ingredients:[{inventoryId:"INS-01",qty:.018,unit:"kg",note:"18 g café tostado"},{inventoryId:"INS-02",qty:.22,unit:"L",note:"220 ml leche fresca"}],
      variants:[{modifier:"Leche de avena",replaceInventoryId:"INS-02",withInventoryId:"INS-03",qty:.22,unit:"L"}]},
    {id:"RCP-003",productId:"san-acevichado",name:"Sándwich Acevichado",station:"Cocina",yieldQty:1,yieldUnit:"porción",targetMinutes:9,expectedWastePct:4,version:"1.0",status:"Activa",
      ingredients:[{inventoryId:"INS-05",qty:1,unit:"un",note:"Pan artesanal"},{inventoryId:"INS-06",qty:.08,unit:"kg",note:"Palta"}],variants:[]},
    {id:"RCP-004",productId:"des-energetico",name:"Desayuno Energético",station:"Cocina",yieldQty:1,yieldUnit:"porción",targetMinutes:12,expectedWastePct:3,version:"1.0",status:"Activa",
      ingredients:[{inventoryId:"INS-07",qty:.08,unit:"kg",note:"Quinoa"},{inventoryId:"INS-05",qty:2,unit:"un",note:"Pan"},{inventoryId:"INS-06",qty:.08,unit:"kg",note:"Palta"}],variants:[]},
    {id:"RCP-005",productId:"cho-caliente",name:"Chocolate caliente",station:"Barra",yieldQty:1,yieldUnit:"porción",targetMinutes:6,expectedWastePct:2,version:"1.0",status:"Activa",
      ingredients:[{inventoryId:"INS-08",qty:.035,unit:"kg",note:"Chocolate regional"},{inventoryId:"INS-02",qty:.20,unit:"L",note:"Leche fresca"}],variants:[]}
  ];
}

function lotSeed(){
  return state.inventory.map((i,n)=>({
    id:`LOT-${String(n+1).padStart(3,"0")}`,code:i.lot||`LOTE-${n+1}`,
    inventoryId:i.id,item:i.item,supplierId:defaultSupplier(i.id),
    receivedAt:n<4?"2026-08-08":"2026-08-10",expiry:i.expiry,
    initialQty:Number(i.stock||0)+(n%3===0?4:0),availableQty:Number(i.stock||0),
    unit:i.unit,location:i.location,rotation:i.rotation||"FIFO",
    documentation:i.category==="Cafe"?"Ficha de lote / procedencia":"Recepción / comprobante"
  }));
}

function purchaseSeed(){
  return [
    {id:"OC-0001",supplierId:"PRV-001",supplier:"Lácteos Amazonas",type:"Compra formal",createdAt:"2026-08-10",expectedAt:"2026-08-11",status:"Recibida",voucher:"Factura",total:150,receiptApplied:true,items:[{inventoryId:"INS-02",item:"Leche fresca",qty:30,unit:"L",unitCost:5}],notes:""},
    {id:"OC-0002",supplierId:"PRV-002",supplier:"Productor Huayabamba",type:"Compra directa a productor",createdAt:"2026-08-09",expectedAt:"2026-08-12",status:"Pendiente",voucher:"Sustento interno",total:504,items:[{inventoryId:"INS-01",item:"Café tostado de especialidad",qty:12,unit:"kg",unitCost:42}],notes:"Compra local con registro de procedencia; sin comprobante tributario externo."},
    {id:"OC-0003",supplierId:"PRV-003",supplier:"Chacra Pinedo",type:"Compra informal",createdAt:"2026-08-11",expectedAt:"2026-08-11",status:"Por recibir",voucher:"Sustento interno",total:126,items:[{inventoryId:"INS-06",item:"Palta",qty:8,unit:"kg",unitCost:9},{inventoryId:"INS-09",item:"Naranja",qty:12,unit:"kg",unitCost:4.5}],notes:"Compra de productos frescos de procedencia local."}
  ];
}

function movementSeed(){
  return [
    {id:"MOV-0001",at:"2026-08-11T07:58:00-05:00",inventoryId:"INS-02",item:"Leche fresca",type:"Salida por receta",direction:"Salida",qty:.36,unit:"L",unitCost:5,cost:1.8,origin:"ORD-1042",reference:"Cappuccino x2",user:"Lucia Torres"},
    {id:"MOV-0002",at:"2026-08-11T07:55:00-05:00",inventoryId:"INS-01",item:"Café tostado de especialidad",type:"Salida por receta",direction:"Salida",qty:.036,unit:"kg",unitCost:42,cost:1.51,origin:"ORD-1042",reference:"Cappuccino x2",user:"Lucia Torres"},
    {id:"MOV-0003",at:"2026-08-11T07:02:00-05:00",inventoryId:"INS-01",item:"Café tostado de especialidad",type:"Merma",direction:"Salida",qty:.036,unit:"kg",unitCost:42,cost:1.51,origin:"MER-002",reference:"Calibración de molienda",user:"Lucia Torres"},
    {id:"MOV-0004",at:"2026-08-10T16:20:00-05:00",inventoryId:"INS-02",item:"Leche fresca",type:"Entrada por compra",direction:"Entrada",qty:30,unit:"L",unitCost:5,cost:150,origin:"OC-0001",reference:"Recepción de compra",user:"Graciela Silva"}
  ];
}

function productionSeed(){
  return [
    {id:"PROD-001",name:"Calibración espresso - apertura",station:"Barra",lotCode:"AMZ-2608-01",expectedQty:10,actualQty:9.4,unit:"porciones",yieldPct:94,wasteQty:.6,wasteCost:.72,startedAt:"2026-08-11T06:48:00-05:00",finishedAt:"2026-08-11T07:00:00-05:00",user:"Lucia Torres",status:"Finalizado",notes:"Ajuste inicial de molienda."},
    {id:"PROD-002",name:"Preparación base de quinoa",station:"Cocina",lotCode:"QUI-0726",expectedQty:20,actualQty:18.5,unit:"porciones",yieldPct:92.5,wasteQty:1.5,wasteCost:6.3,startedAt:"2026-08-11T06:30:00-05:00",finishedAt:"2026-08-11T07:05:00-05:00",user:"Diego Quino",status:"Finalizado",notes:"Reducción durante cocción."},
    {id:"PROD-003",name:"Tostado lote AMZ-2608-01",station:"Producción",lotCode:"AMZ-2608-01",expectedQty:10,actualQty:8.7,unit:"kg",yieldPct:87,wasteQty:1.3,wasteCost:0,startedAt:"2026-08-05T09:00:00-05:00",finishedAt:"2026-08-05T10:15:00-05:00",user:"Graciela Silva",status:"Finalizado",notes:"Pérdida de peso esperada por tostado."}
  ];
}

/* -------------------------- SHELL -------------------------- */

function render(){
  view.innerHTML = `<div class="inventory-v4">${header()}${tabs()}${currentView()}</div>`;
  wireCommon(); wireTab();
}
function header(){
  const m=metrics();
  return `<section class="panel inventory-module-head">
    <div><p class="eyebrow">Inventario y logística</p><h2>Abastecimiento, recetas y trazabilidad</h2>
    <p>Stock, lotes, proveedores, compras, BOM, mermas y producción conectados a la operación.</p></div>
    <div class="inventory-head-pills"><span><strong>${m.low}</strong> stock crítico</span><span><strong>${m.expiring}</strong> por vencer</span><span><strong>${state.purchaseSuggestions.length}</strong> sugerencias</span></div>
  </section>`;
}
function tabs(){
  return `<section class="panel inventory-tabs-wrap"><nav class="inventory-tabs">
    ${TABS.map(([id,label,symbol])=>`<button class="inventory-tab ${ui.tab===id?"is-active":""}" type="button" data-tab="${id}"><span>${symbol}</span><strong>${label}</strong></button>`).join("")}
  </nav></section>`;
}
function currentView(){
  return ({
    resumen:summaryView,stock:stockView,kardex:kardexView,lotes:lotsView,
    compras:purchasesView,proveedores:suppliersView,recetas:recipesView,
    mermas:wasteView,produccion:productionView,trazabilidad:traceView
  }[ui.tab]||summaryView)();
}

/* -------------------------- RESUMEN -------------------------- */

function metrics(){
  const low=state.inventory.filter(i=>Number(i.stock)<=Number(i.min)).length;
  const expiring=state.inventoryLots.filter(l=>{const d=daysUntil(l.expiry);return d>=0&&d<=7&&Number(l.availableQty)>0}).length;
  const value=state.inventory.reduce((s,i)=>s+Number(i.stock||0)*Number(i.cost||0),0);
  const month=today().slice(0,7);
  const waste=state.wasteRecords.filter(r=>String(r.date||r.at||"").startsWith(month)).reduce((s,r)=>s+Number(r.cost||0),0);
  return {low,expiring,value,waste};
}
function kpi(label,value,detail,tone="neutral"){return `<article class="panel inventory-kpi inventory-kpi--${tone}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(detail)}</small></article>`}
function summaryView(){
  const m=metrics(), alerts=alertsList().slice(0,6), moves=[...state.inventoryMovements].sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6);
  return `<div class="inventory-tab-view">
    <section class="inventory-kpis">${kpi("Valor inventario",money(m.value),"Costo valorizado")}${kpi("Stock crítico",m.low,"Bajo el mínimo",m.low?"danger":"ok")}${kpi("Lotes por vencer",m.expiring,"Próximos 7 días",m.expiring?"warn":"ok")}${kpi("Mermas del mes",money(m.waste),"Costo estimado",m.waste?"danger":"ok")}</section>
    <div class="inventory-summary-grid">
      <section class="panel inventory-summary-panel"><div class="panel__header"><div><p class="eyebrow">Atención</p><h2>Alertas prioritarias</h2></div><span class="${statusClass(alerts.length?"Atención":"Disponible")}">${alerts.length}</span></div>
        <div class="inventory-alert-list">${alerts.length?alerts.map(a=>`<button class="inventory-alert-row inventory-alert-row--${a.tone}" data-go-tab="${a.tab}"><span>${a.icon}</span><div><strong>${escapeHtml(a.title)}</strong><small>${escapeHtml(a.detail)}</small></div><b>›</b></button>`).join(""):emptyMini("✓","Sin alertas críticas","Inventario dentro de parámetros.")}</div>
      </section>
      <section class="panel inventory-summary-panel"><div class="panel__header"><div><p class="eyebrow">Reposición</p><h2>Sugerencias de compra</h2></div><button class="mini-button" data-go-tab="compras">Ver compras</button></div>
        <div class="inventory-suggestion-list">${state.purchaseSuggestions.slice(0,5).map(s=>`<article><div><strong>${escapeHtml(s.item)}</strong><small>${qty(s.stock)} ${escapeHtml(s.unit)} · mínimo ${qty(s.min)}</small></div><div><span>${qty(s.suggestedQty)} ${escapeHtml(s.unit)}</span><button class="mini-button" data-create-po-from="${s.inventoryId}">Comprar</button></div></article>`).join("")||emptyMini("✓","Sin reposiciones","No hay insumos bajo mínimo.")}</div>
      </section>
    </div>
    <section class="panel"><div class="panel__header"><div><p class="eyebrow">Trazabilidad</p><h2>Últimos movimientos</h2></div><button class="mini-button" data-go-tab="kardex">Abrir Kardex</button></div>${movementTable(moves)}</section>
  </div>`;
}
function alertsList(){
  const a=[];
  state.inventory.filter(i=>Number(i.stock)<=Number(i.min)).forEach(i=>a.push({tone:"danger",icon:"!",title:`${i.item}: stock crítico`,detail:`${i.stock} ${i.unit} disponibles · mínimo ${i.min}`,tab:"stock"}));
  state.inventoryLots.filter(l=>{const d=daysUntil(l.expiry);return d>=0&&d<=7&&Number(l.availableQty)>0}).forEach(l=>a.push({tone:"warn",icon:"◷",title:`${l.item}: lote por vencer`,detail:`${l.code} · ${shortDate(l.expiry)} · ${l.availableQty} ${l.unit}`,tab:"lotes"}));
  return a;
}

/* -------------------------- STOCK -------------------------- */

function stockView(){
  const cats=["Todos",...inventoryCategories(state)];
  const rows=state.inventory.filter(i=>ui.stockCategory==="Todos"||i.category===ui.stockCategory).filter(i=>matchesSearch(ui.search,i.item,i.category,i.location,i.lot,i.type));
  return `<div class="inventory-tab-view">
    <section class="panel inventory-toolbar"><div class="inventory-toolbar__filters"><label><span>Categoría</span><select data-stock-category>${cats.map(c=>`<option ${ui.stockCategory===c?"selected":""}>${escapeHtml(c)}</option>`).join("")}</select></label></div>
      <div class="inventory-toolbar__actions"><button class="button button--secondary" data-stock-adjust>${icon("edit")}<span>Ajustar stock</span></button><button class="button button--primary" data-new-inventory>${icon("plus")}<span>Nuevo insumo</span></button></div>
    </section>
    <section class="panel"><div class="panel__header"><div><p class="eyebrow">Existencias</p><h2>Stock actual</h2></div><span class="status status--info">${rows.length} registros</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo / producto</th><th>Tipo</th><th>Disponible</th><th>Mínimo</th><th>Ubicación</th><th>Rotación</th><th>Costo</th><th>Estado</th><th></th></tr></thead>
      <tbody>${rows.map(stockRow).join("")||tableEmpty(9,"No hay existencias con estos filtros.")}</tbody></table></div>
    </section></div>`;
}
function stockRow(i){
  const available=Math.max(0,Number(i.stock)-Number(i.committed||0)), label=available<=Number(i.min)?"Crítico":"Disponible";
  return `<tr><td><strong>${escapeHtml(i.item)}</strong><br><small class="muted">${escapeHtml(i.category)} · ${escapeHtml(i.lot||"Sin lote")}</small></td><td>${escapeHtml(i.type||"Insumo")}</td>
  <td><strong>${qty(available)} ${escapeHtml(i.unit)}</strong>${i.committed?`<br><small class="muted">${qty(i.committed)} comprometido</small>`:""}</td><td>${qty(i.min)} ${escapeHtml(i.unit)}</td><td>${escapeHtml(i.location||"-")}</td><td>${escapeHtml(i.rotation||"FIFO")}</td><td>${money(i.cost||0)}</td><td><span class="${statusClass(label)}">${label}</span></td>
  <td><div class="table-actions"><button class="mini-button" data-stock-view="${i.id}">Ver</button><button class="mini-button" data-stock-edit="${i.id}">${icon("edit")}<span>Editar</span></button></div></td></tr>`;
}

/* -------------------------- KARDEX -------------------------- */

function kardexView(){
  const rows=[...state.inventoryMovements].filter(m=>matchesSearch(ui.search,m.item,m.type,m.origin,m.reference,m.user)).sort((a,b)=>new Date(b.at)-new Date(a.at));
  const inputs=rows.filter(r=>r.direction==="Entrada").reduce((s,r)=>s+Number(r.cost||0),0), outputs=rows.filter(r=>r.direction==="Salida").reduce((s,r)=>s+Number(r.cost||0),0);
  return `<div class="inventory-tab-view"><section class="inventory-kpis inventory-kpis--3">${kpi("Movimientos",rows.length,"Registros visibles")}${kpi("Entradas valorizadas",money(inputs),"Filtro actual","ok")}${kpi("Salidas valorizadas",money(outputs),"Consumo y merma",outputs?"warn":"ok")}</section>
  <section class="panel"><div class="panel__header"><div><p class="eyebrow">Kardex</p><h2>Movimientos de inventario</h2></div><button class="button button--secondary" data-manual-movement>${icon("plus")}<span>Movimiento manual</span></button></div>${movementTable(rows)}</section></div>`;
}
function movementTable(rows){
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Insumo</th><th>Movimiento</th><th>Cantidad</th><th>Costo</th><th>Origen</th><th>Responsable</th></tr></thead><tbody>
  ${rows.map(m=>`<tr><td>${dateTime(m.at)}</td><td><strong>${escapeHtml(m.item)}</strong></td><td><span class="${statusClass(m.direction==="Entrada"?"Disponible":"Atención")}">${escapeHtml(m.type)}</span></td><td><strong>${m.direction==="Entrada"?"+":"−"}${qty(m.qty)}</strong> ${escapeHtml(m.unit||"")}</td><td>${money(m.cost||0)}</td><td>${escapeHtml(m.origin||"-")}${m.reference?`<br><small class="muted">${escapeHtml(m.reference)}</small>`:""}</td><td>${escapeHtml(m.user||"-")}</td></tr>`).join("")||tableEmpty(7,"Sin movimientos.")}</tbody></table></div>`;
}

/* -------------------------- LOTES -------------------------- */

function lotsView(){
  const statuses=["Todos","Disponible","Por vencer","Vencido","Agotado"];
  const rows=state.inventoryLots.map(l=>({...l,status:lotStatus(l)})).filter(l=>ui.lotStatus==="Todos"||l.status===ui.lotStatus).filter(l=>matchesSearch(ui.search,l.code,l.item,supplierName(l.supplierId),l.location));
  return `<div class="inventory-tab-view"><section class="panel inventory-toolbar"><div class="inventory-toolbar__filters"><label><span>Estado</span><select data-lot-status>${statuses.map(s=>`<option ${ui.lotStatus===s?"selected":""}>${s}</option>`).join("")}</select></label></div><div class="inventory-toolbar__actions"><button class="button button--primary" data-new-lot>${icon("plus")}<span>Registrar lote</span></button></div></section>
  <section class="panel"><div class="panel__header"><div><p class="eyebrow">FIFO / FEFO</p><h2>Lotes y vencimientos</h2></div><span class="status status--info">${rows.length} lotes</span></div>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>Lote</th><th>Insumo</th><th>Proveedor</th><th>Recepción</th><th>Vencimiento</th><th>Disponible</th><th>Ubicación</th><th>Rotación</th><th>Estado</th></tr></thead><tbody>
  ${rows.map(l=>`<tr><td><strong>${escapeHtml(l.code)}</strong><br><small class="muted">${escapeHtml(l.documentation||"")}</small></td><td>${escapeHtml(l.item)}</td><td>${escapeHtml(supplierName(l.supplierId)||"Sin proveedor")}</td><td>${shortDate(l.receivedAt)}</td><td>${shortDate(l.expiry)}</td><td>${qty(l.availableQty)} ${escapeHtml(l.unit)}</td><td>${escapeHtml(l.location||"-")}</td><td><strong>${escapeHtml(l.rotation||"FIFO")}</strong></td><td><span class="${statusClass(l.status)}">${l.status}</span></td></tr>`).join("")||tableEmpty(9,"Sin lotes.")}</tbody></table></div></section></div>`;
}

/* -------------------------- COMPRAS -------------------------- */

function purchasesView(){
  const orders=[...state.purchaseOrders].filter(o=>matchesSearch(ui.search,o.id,o.supplier,o.status,o.type)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  const pending=orders.filter(o=>["Pendiente","Por recibir"].includes(o.status)).length;
  const total=orders.filter(o=>String(o.createdAt).startsWith(today().slice(0,7))).reduce((s,o)=>s+Number(o.total||0),0);
  return `<div class="inventory-tab-view"><section class="inventory-kpis inventory-kpis--3">${kpi("Órdenes abiertas",pending,"Pendientes de recepción",pending?"warn":"ok")}${kpi("Compras del mes",money(total),"Órdenes registradas")}${kpi("Sugerencias",state.purchaseSuggestions.length,"Según stock mínimo",state.purchaseSuggestions.length?"danger":"ok")}</section>
  <section class="panel purchase-suggestions-panel"><div class="panel__header"><div><p class="eyebrow">Reposición</p><h2>Sugerencias de compra</h2></div><button class="button button--primary" data-new-purchase>${icon("plus")}<span>Nueva compra</span></button></div>
  <div class="purchase-suggestion-grid">${state.purchaseSuggestions.slice(0,6).map(s=>{const p=preferredSupplier(s.inventoryId);return `<article class="purchase-suggestion-card"><div><span class="status status--danger">Reposición</span><strong>${escapeHtml(s.item)}</strong><small>Actual ${qty(s.stock)} ${escapeHtml(s.unit)} · mín. ${qty(s.min)}</small></div><div><p>Sugerido</p><strong>${qty(s.suggestedQty)} ${escapeHtml(s.unit)}</strong><small>${escapeHtml(p?.tradeName||p?.name||"Proveedor por definir")}</small></div><button class="mini-button" data-create-po-from="${s.inventoryId}">Crear orden</button></article>`}).join("")||emptyMini("✓","Sin sugerencias","No hay reposiciones inmediatas.")}</div></section>
  <section class="panel"><div class="panel__header"><div><p class="eyebrow">Abastecimiento</p><h2>Órdenes de compra</h2></div><span class="status status--info">${orders.length}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Orden</th><th>Proveedor</th><th>Tipo</th><th>Emisión</th><th>Entrega</th><th>Total</th><th>Documento</th><th>Estado</th><th></th></tr></thead><tbody>
  ${orders.map(o=>`<tr><td><strong>${o.id}</strong></td><td>${escapeHtml(o.supplier)}</td><td>${escapeHtml(o.type)}</td><td>${shortDate(o.createdAt)}</td><td>${shortDate(o.expectedAt)}</td><td><strong>${money(o.total)}</strong></td><td>${escapeHtml(o.voucher||"-")}</td><td><span class="${statusClass(o.status)}">${o.status}</span></td><td><div class="table-actions"><button class="mini-button" data-po-view="${o.id}">Ver</button>${o.status!=="Recibida"?`<button class="mini-button" data-po-receive="${o.id}">Recibir</button>`:""}</div></td></tr>`).join("")||tableEmpty(9,"Sin órdenes.")}</tbody></table></div></section></div>`;
}

/* -------------------------- PROVEEDORES -------------------------- */

function suppliersView(){
  const types=["Todos","Formal","Informal"];
  const rows=state.suppliers.filter(s=>ui.supplierType==="Todos"||s.type===ui.supplierType).filter(s=>matchesSearch(ui.search,s.name,s.tradeName,s.document,s.origin,(s.products||[]).join(" ")));
  const formal=state.suppliers.filter(s=>s.type==="Formal").length, informal=state.suppliers.filter(s=>s.type==="Informal").length;
  return `<div class="inventory-tab-view"><section class="inventory-kpis inventory-kpis--3">${kpi("Proveedores activos",state.suppliers.filter(s=>s.status==="Activo").length,"Red de abastecimiento")}${kpi("Formales",formal,"RUC / comprobante","ok")}${kpi("Locales / informales",informal,"Trazabilidad interna",informal?"warn":"neutral")}</section>
  <section class="panel inventory-toolbar"><div class="inventory-toolbar__filters"><label><span>Tipo</span><select data-supplier-type>${types.map(t=>`<option ${ui.supplierType===t?"selected":""}>${t}</option>`).join("")}</select></label></div><div class="inventory-toolbar__actions"><button class="button button--secondary" data-new-supplier="Informal">${icon("plus")}<span>Productor / informal</span></button><button class="button button--primary" data-new-supplier="Formal">${icon("plus")}<span>Proveedor formal</span></button></div></section>
  <section class="supplier-grid">${rows.map(supplierCard).join("")||emptyMini("◎","Sin proveedores","No hay coincidencias.")}</section></div>`;
}
function supplierCard(s){
  const doc=s.type==="Formal"?`${s.documentType}: ${s.document||"Pendiente"}`:(s.document?`${s.documentType}: ${s.document}`:"Sin documentación tributaria");
  return `<article class="panel supplier-card"><header><div><span class="${statusClass(s.type==="Formal"?"Disponible":"Atención")}">${s.type}</span><h3>${escapeHtml(s.tradeName||s.name)}</h3><p>${escapeHtml(s.name)}</p></div><span class="${statusClass(s.status)}">${s.status}</span></header>
  <dl><div><dt>Documento</dt><dd>${escapeHtml(doc)}</dd></div><div><dt>Procedencia</dt><dd>${escapeHtml(s.origin||"-")}</dd></div><div><dt>Contacto</dt><dd>${escapeHtml(s.phone||"Sin teléfono")}</dd></div><div><dt>Pago</dt><dd>${escapeHtml(s.paymentTerms||"-")}</dd></div></dl>
  <div class="supplier-products">${(s.products||[]).map(p=>`<span>${escapeHtml(p)}</span>`).join("")}</div>
  ${s.type==="Informal"?`<div class="supplier-trace-note"><strong>Trazabilidad interna</strong><small>Puede operar sin RUC/DNI. Se conserva procedencia, responsable, sustento y lote.</small></div>`:""}
  <footer><button class="mini-button" data-supplier-view="${s.id}">Ver ficha</button><button class="mini-button" data-supplier-edit="${s.id}">Editar</button><button class="mini-button" data-purchase-supplier="${s.id}">Comprar</button></footer></article>`;
}

/* -------------------------- RECETAS -------------------------- */

function recipesView(){
  const stations=["Todos","Barra","Cocina"];
  const rows=state.recipes.filter(r=>ui.recipeStation==="Todos"||r.station===ui.recipeStation).filter(r=>matchesSearch(ui.search,r.name,r.station,r.version));
  const avgMargin=rows.length?rows.reduce((s,r)=>s+recipeMargin(r),0)/rows.length:0;
  return `<div class="inventory-tab-view"><section class="inventory-kpis inventory-kpis--3">${kpi("Recetas activas",state.recipes.filter(r=>r.status==="Activa").length,"Conectadas a la carta","ok")}${kpi("Costo promedio",money(rows.length?rows.reduce((s,r)=>s+recipeCost(r),0)/rows.length:0),"Por porción")}${kpi("Margen promedio",`${avgMargin.toFixed(1)}%`,"Precio vs costo",avgMargin>=50?"ok":"warn")}</section>
  <section class="panel inventory-toolbar"><div class="inventory-toolbar__filters"><label><span>Estación</span><select data-recipe-station>${stations.map(s=>`<option ${ui.recipeStation===s?"selected":""}>${s}</option>`).join("")}</select></label></div><div class="inventory-toolbar__actions"><button class="button button--primary" data-new-recipe>${icon("plus")}<span>Nueva receta</span></button></div></section>
  <section class="recipe-grid">${rows.map(recipeCard).join("")||emptyMini("◈","Sin recetas","No hay recetas con este filtro.")}</section></div>`;
}
function recipeCard(r){
  const product=state.menuItems.find(p=>p.id===r.productId), cost=recipeCost(r), price=Number(product?.price||0), margin=price?((price-cost)/price)*100:0;
  return `<article class="panel recipe-card"><header><div><span class="${statusClass(r.status)}">${r.status}</span><h3>${escapeHtml(r.name)}</h3><p>${escapeHtml(r.station)} · v${escapeHtml(r.version)}</p></div><div class="recipe-cost"><span>Costo</span><strong>${money(cost)}</strong></div></header>
  <div class="recipe-metrics"><div><span>Venta</span><strong>${money(price)}</strong></div><div><span>Margen</span><strong>${margin.toFixed(1)}%</strong></div><div><span>Tiempo</span><strong>${r.targetMinutes} min</strong></div><div><span>Merma técnica</span><strong>${r.expectedWastePct}%</strong></div></div>
  <div class="recipe-ingredients"><strong>Ingredientes</strong>${r.ingredients.map(ing=>{const i=inv(ing.inventoryId);return `<div><span>${escapeHtml(i?.item||ing.inventoryId)}</span><b>${qty(ing.qty)} ${escapeHtml(ing.unit)}</b></div>`}).join("")}</div>
  ${r.variants.length?`<div class="recipe-variants"><span>${r.variants.length} variante(s)</span><small>Modificadores sustituyen el insumo base.</small></div>`:""}
  <footer><button class="mini-button" data-recipe-view="${r.id}">Ver BOM</button><button class="mini-button" data-recipe-edit="${r.id}">Editar</button></footer></article>`;
}

/* -------------------------- MERMAS -------------------------- */

function wasteView(){
  const types=["Todos","Insumo","Preparación","Producto terminado"];
  const rows=[...state.wasteRecords].filter(r=>ui.wasteType==="Todos"||normalizeWasteType(r.type)===ui.wasteType).filter(r=>matchesSearch(ui.search,r.item,r.reason,r.station,r.orderId,r.user)).sort((a,b)=>new Date(b.at||b.date)-new Date(a.at||a.date));
  const totals=wasteTotals();
  return `<div class="inventory-tab-view"><section class="inventory-kpis">${kpi("Merma de insumos",money(totals.Insumo),"Vencimiento / deterioro",totals.Insumo?"warn":"ok")}${kpi("Merma preparación",money(totals["Preparación"]),"Proceso / cambios",totals["Preparación"]?"warn":"ok")}${kpi("Producto terminado",money(totals["Producto terminado"]),"Listo / devolución",totals["Producto terminado"]?"danger":"ok")}${kpi("Total registrado",money(totals.total),`${rows.length} registros`,totals.total?"danger":"ok")}</section>
  <section class="panel inventory-toolbar"><div class="inventory-toolbar__filters"><label><span>Tipo de merma</span><select data-waste-type>${types.map(t=>`<option ${ui.wasteType===t?"selected":""}>${t}</option>`).join("")}</select></label></div><div class="inventory-toolbar__actions"><button class="button button--primary" data-new-waste>${icon("plus")}<span>Registrar merma</span></button></div></section>
  <section class="panel"><div class="panel__header"><div><p class="eyebrow">Control de pérdidas</p><h2>Historial de mermas</h2></div><span class="status status--danger">${rows.length}</span></div>
  <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Insumo / producto</th><th>Cantidad</th><th>Motivo</th><th>Origen</th><th>Costo</th><th>Responsable</th></tr></thead><tbody>
  ${rows.map(r=>{const type=normalizeWasteType(r.type),origin=[r.station,r.table,r.orderId].filter(Boolean).join(" · ");return `<tr><td>${dateTime(r.at||r.date)}</td><td><span class="${statusClass(type==="Producto terminado"?"Crítico":"Atención")}">${type}</span></td><td><strong>${escapeHtml(r.item||"-")}</strong></td><td>${qty(r.qty)} ${escapeHtml(r.unit||"")}</td><td>${escapeHtml(r.reason||"-")}${r.note?`<br><small class="muted">${escapeHtml(r.note)}</small>`:""}</td><td>${escapeHtml(origin||"-")}</td><td><strong>${money(r.cost||0)}</strong></td><td>${escapeHtml(r.user||"-")}</td></tr>`}).join("")||tableEmpty(8,"Sin mermas.")}</tbody></table></div></section></div>`;
}

/* -------------------------- PRODUCCION -------------------------- */

function productionView(){
  const rows=[...state.productionBatches].filter(b=>matchesSearch(ui.search,b.name,b.station,b.lotCode,b.user)).sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt));
  const avg=rows.length?rows.reduce((s,b)=>s+Number(b.yieldPct||0),0)/rows.length:0, waste=rows.reduce((s,b)=>s+Number(b.wasteCost||0),0);
  return `<div class="inventory-tab-view"><section class="inventory-kpis inventory-kpis--3">${kpi("Producciones",rows.length,"Lotes / preparaciones")}${kpi("Rendimiento promedio",`${avg.toFixed(1)}%`,"Real vs esperado",avg>=95?"ok":"warn")}${kpi("Pérdida estimada",money(waste),"Diferencias valorizadas",waste?"danger":"ok")}</section>
  <section class="panel"><div class="panel__header"><div><p class="eyebrow">Producción</p><h2>Rendimientos y transformaciones</h2></div><button class="button button--primary" data-new-production>${icon("plus")}<span>Registrar producción</span></button></div>
  <div class="production-grid">${rows.map(productionCard).join("")||emptyMini("⚙","Sin producciones","No hay registros.")}</div></section></div>`;
}
function productionCard(b){
  const dif=Number(b.actualQty)-Number(b.expectedQty), tone=Number(b.yieldPct)>=95?"ok":Number(b.yieldPct)>=90?"warn":"danger";
  return `<article class="production-card production-card--${tone}"><header><div><span class="${statusClass(b.status)}">${b.status}</span><strong>${escapeHtml(b.name)}</strong><small>${escapeHtml(b.station)} · ${escapeHtml(b.lotCode||"Sin lote")}</small></div><div class="production-yield"><span>Rendimiento</span><strong>${Number(b.yieldPct).toFixed(1)}%</strong></div></header>
  <div class="production-values"><div><span>Esperado</span><strong>${qty(b.expectedQty)} ${escapeHtml(b.unit)}</strong></div><div><span>Real</span><strong>${qty(b.actualQty)} ${escapeHtml(b.unit)}</strong></div><div><span>Diferencia</span><strong>${dif>0?"+":""}${qty(dif)} ${escapeHtml(b.unit)}</strong></div><div><span>Merma/costo</span><strong>${qty(b.wasteQty||0)} · ${money(b.wasteCost||0)}</strong></div></div>
  <footer><span>${dateTime(b.startedAt)} · ${escapeHtml(b.user||"-")}</span>${b.notes?`<small>${escapeHtml(b.notes)}</small>`:""}</footer></article>`;
}

/* -------------------------- TRAZABILIDAD -------------------------- */

function traceView(){
  const c=state.coffeeLots[0]||{code:"AMZ-2608-01",origin:"Valle del Huayabamba, Amazonas",producer:"Productor local",altitude:"1200-1800 msnm",variety:"Caturra",roast:"Media",received:"2026-08-02",roastedAt:"2026-08-05",stock:7,unit:"kg"};
  const moves=state.inventoryMovements.filter(m=>m.inventoryId==="INS-01").slice(0,6);
  return `<div class="inventory-tab-view">
  <section class="panel trace-hero"><div><p class="eyebrow">Farm-to-Cup</p><h2>Lote ${escapeHtml(c.code)}</h2><p>Del productor amazónico a la preparación y venta.</p></div><div class="trace-hero-data"><span><b>Origen</b>${escapeHtml(c.origin)}</span><span><b>Productor</b>${escapeHtml(c.producer)}</span><span><b>Variedad</b>${escapeHtml(c.variety||"-")}</span><span><b>Altitud</b>${escapeHtml(c.altitude||"-")}</span></div></section>
  <section class="panel trace-timeline-panel"><div class="panel__header"><div><p class="eyebrow">Trazabilidad</p><h2>Del origen a la taza</h2></div><span class="status status--ok">Lote activo</span></div><div class="trace-timeline">
    ${traceStep(1,"Productor",c.producer,c.origin,"Origen registrado")}${traceStep(2,"Recepción",shortDate(c.received),`${Number(c.stock||0)+3} kg recibidos`,"Lote identificado")}${traceStep(3,"Tostado",shortDate(c.roastedAt),`Tueste ${c.roast||"medio"}`,"Rendimiento registrado")}${traceStep(4,"Inventario",`${c.stock} ${c.unit}`,"Almacén seco","FIFO")}${traceStep(5,"Recetas","Espresso / Cappuccino / Latte","Consumo por BOM","Trazabilidad de insumos")}${traceStep(6,"Venta","Pedidos asociados","Mesa / cliente / fecha","Cierre Farm-to-Cup")}
  </div></section>
  <div class="inventory-summary-grid"><section class="panel"><div class="panel__header"><h2>Transformaciones</h2></div><div class="trace-event-list">${state.productionBatches.filter(b=>b.lotCode===c.code).map(b=>`<article><span>⚙</span><div><strong>${escapeHtml(b.name)}</strong><small>${Number(b.yieldPct).toFixed(1)}% · ${escapeHtml(b.user)}</small></div></article>`).join("")||emptyMini("⚙","Sin transformaciones","No hay registros.")}</div></section>
  <section class="panel"><div class="panel__header"><h2>Movimientos asociados</h2></div><div class="trace-event-list">${moves.map(m=>`<article><span>↕</span><div><strong>${escapeHtml(m.type)}</strong><small>${qty(m.qty)} ${escapeHtml(m.unit)} · ${escapeHtml(m.origin)}</small></div></article>`).join("")||emptyMini("↕","Sin movimientos","No hay consumos.")}</div></section></div></div>`;
}
function traceStep(n,title,main,detail,foot){return `<article class="trace-step"><span>${n}</span><div><small>${title}</small><strong>${escapeHtml(String(main||"-"))}</strong><p>${escapeHtml(String(detail||""))}</p><b>${foot}</b></div></article>`}

/* -------------------------- WIRING -------------------------- */

function wireCommon(){
  view.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>goTab(b.dataset.tab));
  view.querySelectorAll("[data-go-tab]").forEach(b=>b.onclick=()=>goTab(b.dataset.goTab));
  view.querySelectorAll("[data-create-po-from]").forEach(b=>b.onclick=()=>openPurchase({inventoryId:b.dataset.createPoFrom}));
}
function wireTab(){
  if(ui.tab==="stock") wireStock();
  if(ui.tab==="kardex") view.querySelector("[data-manual-movement]")?.addEventListener("click",openAdjustment);
  if(ui.tab==="lotes") wireLots();
  if(ui.tab==="compras") wirePurchases();
  if(ui.tab==="proveedores") wireSuppliers();
  if(ui.tab==="recetas") wireRecipes();
  if(ui.tab==="mermas") wireWaste();
  if(ui.tab==="produccion") view.querySelector("[data-new-production]")?.addEventListener("click",openProduction);
}
function goTab(tab){ui.tab=tab;const u=new URL(location.href);u.searchParams.set("tab",tab);history.replaceState({},"",u);render()}

/* -------------------------- STOCK MODALS -------------------------- */

function wireStock(){
  view.querySelector("[data-stock-category]")?.addEventListener("change",e=>{ui.stockCategory=e.target.value;render()});
  view.querySelector("[data-new-inventory]")?.addEventListener("click",()=>openInventory());
  view.querySelector("[data-stock-adjust]")?.addEventListener("click",openAdjustment);
  view.querySelectorAll("[data-stock-view]").forEach(b=>b.onclick=()=>openInventoryDetail(b.dataset.stockView));
  view.querySelectorAll("[data-stock-edit]").forEach(b=>b.onclick=()=>openInventory(b.dataset.stockEdit));
}
function openInventory(id=null){
  const item=id?inv(id):null, cats=["Cafe","Lacteos","Bebidas vegetales","Panaderia","Frutas y verduras","Granos","Chocolate","Empaque","Bebidas listas","Otros"], types=["Materia prima","Insumo","Despacho directo","Retail","Preparación base","Producto terminado"];
  const html=`<section class="modal inventory-form-modal"><div class="modal__header"><div><p class="eyebrow">Stock</p><h2>${item?"Editar insumo":"Nuevo insumo / producto"}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div>
  <form class="form-grid inventory-form-modal__body" data-inventory-form><label class="span-2">Nombre *<input name="item" value="${escapeHtml(item?.item||"")}" required></label><label>Tipo<select name="type">${types.map(t=>`<option ${item?.type===t?"selected":""}>${t}</option>`).join("")}</select></label><label>Categoría<select name="category">${cats.map(c=>`<option ${item?.category===c?"selected":""}>${c}</option>`).join("")}</select></label>
  <label>Stock<input name="stock" type="number" min="0" step="0.001" value="${item?.stock??0}" required></label><label>Stock mínimo<input name="min" type="number" min="0" step="0.001" value="${item?.min??0}" required></label><label>Unidad<select name="unit">${unitOptions(item?.unit||"",true)}</select></label><label>Costo unitario<input name="cost" type="number" min="0" step="0.01" value="${item?.cost??0}" required></label>
  <label>Ubicación<input name="location" value="${escapeHtml(item?.location||"")}"></label><label>Rotación<select name="rotation"><option ${item?.rotation==="FIFO"?"selected":""}>FIFO</option><option ${item?.rotation==="FEFO"?"selected":""}>FEFO</option></select></label><label>Lote actual<input name="lot" value="${escapeHtml(item?.lot||"")}"></label><label>Vencimiento<input name="expiry" type="date" value="${escapeHtml(item?.expiry||"")}"></label>
  <div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">${item?"Guardar cambios":"Crear insumo"}</button></div></form></section>`;
  const modal=openModal(html);
  modal.querySelector("[data-inventory-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));
    if(item) Object.assign(item,{item:d.item.trim(),type:d.type,category:d.category,stock:Number(d.stock),min:Number(d.min),unit:d.unit,cost:Number(d.cost),location:d.location.trim(),rotation:d.rotation,lot:d.lot.trim(),expiry:d.expiry});
    else {const ni={id:nextInventoryId(),item:d.item.trim(),type:d.type,category:d.category,stock:Number(d.stock),committed:0,min:Number(d.min),unit:d.unit,cost:Number(d.cost),location:d.location.trim(),rotation:d.rotation,lot:d.lot.trim(),expiry:d.expiry,active:true};state.inventory.push(ni);addMovement(ni.id,ni.item,"Stock inicial","Entrada",ni.stock,ni.unit,ni.cost,"Registro de insumo","Alta inicial")}
    addAuditEvent(state,{user:session.name,action:item?"Insumo actualizado":"Insumo creado",module:"Inventario",detail:d.item});buildSuggestions();saveState(state);closeModal();showToast(item?"Insumo actualizado.":"Insumo registrado.");render()
  };
}
function openAdjustment(){
  const html=`<section class="modal modal--small"><div class="modal__header"><div><p class="eyebrow">Kardex</p><h2>Ajustar stock</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-adjust-form>
  <label class="span-2">Insumo<select name="inventoryId">${state.inventory.map(i=>`<option value="${i.id}">${escapeHtml(i.item)} · ${qty(i.stock)} ${escapeHtml(i.unit)}</option>`).join("")}</select></label><label>Movimiento<select name="direction"><option value="Entrada">Ajuste positivo</option><option value="Salida">Ajuste negativo</option></select></label><label>Cantidad<input name="qty" type="number" min=".001" step=".001" required></label><label class="span-2">Motivo<input name="reference" required></label><div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">Registrar</button></div></form></section>`;
  const modal=openModal(html);modal.querySelector("[data-adjust-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),i=inv(d.inventoryId),q=Number(d.qty);if(!i||!q)return;if(d.direction==="Salida"&&q>Number(i.stock)){showToast("La salida supera el stock.");return}i.stock=round3(Number(i.stock)+(d.direction==="Entrada"?q:-q));addMovement(i.id,i.item,d.direction==="Entrada"?"Ajuste positivo":"Ajuste negativo",d.direction,q,i.unit,i.cost,"Ajuste manual",d.reference);buildSuggestions();saveState(state);closeModal();showToast("Ajuste registrado.");render()}
}
function openInventoryDetail(id){
  const i=inv(id);if(!i)return;const lots=state.inventoryLots.filter(l=>l.inventoryId===id),moves=state.inventoryMovements.filter(m=>m.inventoryId===id).sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,6);
  openModal(`<section class="modal inventory-detail-modal"><div class="modal__header"><div><p class="eyebrow">${escapeHtml(i.category)}</p><h2>${escapeHtml(i.item)}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><div class="inventory-detail-body"><div class="inventory-detail-kpis"><div><span>Stock</span><strong>${qty(i.stock)} ${escapeHtml(i.unit)}</strong></div><div><span>Mínimo</span><strong>${qty(i.min)}</strong></div><div><span>Costo</span><strong>${money(i.cost)}</strong></div><div><span>Valor</span><strong>${money(i.stock*i.cost)}</strong></div></div><div class="inventory-detail-grid"><section><h3>Lotes</h3>${lots.map(l=>`<p><strong>${escapeHtml(l.code)}</strong> · ${qty(l.availableQty)} ${escapeHtml(l.unit)} · ${lotStatus(l)}</p>`).join("")||"<p class='muted'>Sin lotes.</p>"}</section><section><h3>Movimientos</h3>${moves.map(m=>`<p><strong>${escapeHtml(m.type)}</strong> · ${qty(m.qty)} ${escapeHtml(m.unit)} · ${dateTime(m.at)}</p>`).join("")||"<p class='muted'>Sin movimientos.</p>"}</section></div></div></section>`);
}

/* -------------------------- LOT MODAL -------------------------- */

function wireLots(){view.querySelector("[data-lot-status]")?.addEventListener("change",e=>{ui.lotStatus=e.target.value;render()});view.querySelector("[data-new-lot]")?.addEventListener("click",openLot)}
function openLot(){
  const html=`<section class="modal inventory-form-modal"><div class="modal__header"><div><p class="eyebrow">FIFO / FEFO</p><h2>Registrar lote</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-lot-form>
  <label class="span-2">Insumo<select name="inventoryId">${state.inventory.map(i=>`<option value="${i.id}">${escapeHtml(i.item)}</option>`).join("")}</select></label><label>Código<input name="code" required></label><label>Proveedor<select name="supplierId"><option value="">Sin proveedor</option>${state.suppliers.map(s=>`<option value="${s.id}">${escapeHtml(s.tradeName||s.name)}</option>`).join("")}</select></label><label>Recepción<input name="receivedAt" type="date" value="${today()}" required></label><label>Vencimiento<input name="expiry" type="date"></label><label>Cantidad<input name="qty" type="number" min=".001" step=".001" required></label><label>Rotación<select name="rotation"><option>FIFO</option><option>FEFO</option></select></label><label>Ubicación<input name="location" required></label><label>Documentación<input name="documentation" placeholder="Factura, ficha, sustento..."></label>
  <div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">Registrar lote</button></div></form></section>`;
  const modal=openModal(html);modal.querySelector("[data-lot-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),i=inv(d.inventoryId),q=Number(d.qty);if(!i||!q)return;state.inventoryLots.unshift({id:`LOT-${Date.now()}`,code:d.code.trim(),inventoryId:i.id,item:i.item,supplierId:d.supplierId||null,receivedAt:d.receivedAt,expiry:d.expiry,initialQty:q,availableQty:q,unit:i.unit,location:d.location.trim(),rotation:d.rotation,documentation:d.documentation.trim()});i.stock=round3(Number(i.stock)+q);i.lot=d.code.trim();if(d.expiry)i.expiry=d.expiry;addMovement(i.id,i.item,"Entrada por lote","Entrada",q,i.unit,i.cost,d.code,supplierName(d.supplierId)||"Registro manual");buildSuggestions();saveState(state);closeModal();showToast("Lote registrado.");render()}
}

/* -------------------------- PURCHASE MODALS -------------------------- */

function wirePurchases(){
  view.querySelector("[data-new-purchase]")?.addEventListener("click",()=>openPurchase());
  view.querySelectorAll("[data-po-view]").forEach(b=>b.onclick=()=>openPurchaseDetail(b.dataset.poView));
  view.querySelectorAll("[data-po-receive]").forEach(b=>b.onclick=()=>receivePurchase(b.dataset.poReceive));
}
function openPurchase({supplierId="",inventoryId=""}={}){
  const supplier=supplierId?state.suppliers.find(s=>s.id===supplierId):preferredSupplier(inventoryId), i=inventoryId?inv(inventoryId):null, suggestion=state.purchaseSuggestions.find(s=>s.inventoryId===inventoryId);
  const html=`<section class="modal purchase-form-modal"><div class="modal__header"><div><p class="eyebrow">Compras</p><h2>Nueva orden de compra</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-purchase-form>
  <label class="span-2">Proveedor *<select name="supplierId" required data-purchase-supplier><option value="">Seleccionar...</option>${state.suppliers.filter(s=>s.status==="Activo").map(s=>`<option value="${s.id}" ${supplier?.id===s.id?"selected":""}>${escapeHtml(s.tradeName||s.name)} · ${s.type}</option>`).join("")}</select></label><div class="purchase-supplier-hint span-2" data-supplier-hint></div>
  <label class="span-2">Insumo *<select name="inventoryId" required data-purchase-item><option value="">Seleccionar...</option>${state.inventory.map(x=>`<option value="${x.id}" ${inventoryId===x.id?"selected":""}>${escapeHtml(x.item)} · ${qty(x.stock)} ${escapeHtml(x.unit)}</option>`).join("")}</select></label>
  <label>Cantidad<input name="qty" type="number" min=".001" step=".001" value="${suggestion?.suggestedQty||1}" required></label><label>Costo unitario<input name="unitCost" type="number" min="0" step=".01" value="${i?.cost||0}" required></label><label>Fecha esperada<input name="expectedAt" type="date" value="${today()}" required></label><label>Estado<select name="status"><option>Pendiente</option><option>Por recibir</option><option>Recibida</option></select></label><label class="span-2">Observaciones / sustento<textarea class="textarea" name="notes" rows="3"></textarea></label>
  <div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">Crear orden</button></div></form></section>`;
  const modal=openModal(html), form=modal.querySelector("[data-purchase-form]"), ssel=modal.querySelector("[data-purchase-supplier]"), isel=modal.querySelector("[data-purchase-item]");
  const hint=()=>{const s=state.suppliers.find(x=>x.id===ssel.value),t=modal.querySelector("[data-supplier-hint]");if(!s){t.innerHTML="";return}t.innerHTML=s.type==="Informal"?`<span class="status status--warn">Compra local / informal</span><small>Guardar procedencia, responsable y sustento interno; no inventar documentos.</small>`:`<span class="status status--ok">Proveedor formal</span><small>${escapeHtml(s.documentType)} ${escapeHtml(s.document||"")} · ${escapeHtml(s.voucher||"Factura")}</small>`};
  ssel.onchange=hint; isel.onchange=()=>{const x=inv(isel.value);if(x)form.elements.unitCost.value=Number(x.cost||0).toFixed(2)};hint();
  form.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),s=state.suppliers.find(x=>x.id===d.supplierId),x=inv(d.inventoryId),q=Number(d.qty),uc=Number(d.unitCost);if(!s||!x||!q){showToast("Completa proveedor, insumo y cantidad.");return}const o={id:nextPurchaseId(),supplierId:s.id,supplier:s.tradeName||s.name,type:s.type==="Formal"?"Compra formal":"Compra informal / productor",createdAt:today(),expectedAt:d.expectedAt,status:d.status,voucher:s.type==="Formal"?(s.voucher||"Factura"):"Sustento interno",total:q*uc,items:[{inventoryId:x.id,item:x.item,qty:q,unit:x.unit,unitCost:uc}],notes:d.notes.trim(),createdBy:session.name};state.purchaseOrders.unshift(o);if(o.status==="Recibida")applyReceipt(o);addAuditEvent(state,{user:session.name,action:"Orden de compra creada",module:"Inventario",detail:`${o.id} · ${o.supplier}`});saveState(state);closeModal();showToast(`${o.id} registrada.`);render()}
}
function openPurchaseDetail(id){
  const o=state.purchaseOrders.find(x=>x.id===id),s=state.suppliers.find(x=>x.id===o?.supplierId);if(!o)return;
  openModal(`<section class="modal purchase-detail-modal"><div class="modal__header"><div><p class="eyebrow">Orden de compra</p><h2>${o.id}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><div class="purchase-detail-body"><div class="purchase-detail-head"><div><span>Proveedor</span><strong>${escapeHtml(o.supplier)}</strong></div><div><span>Tipo</span><strong>${escapeHtml(o.type)}</strong></div><div><span>Documento</span><strong>${escapeHtml(o.voucher)}</strong></div><div><span>Estado</span><strong>${o.status}</strong></div></div>${s?.type==="Informal"?`<div class="supplier-trace-note"><strong>Compra informal/productor</strong><small>Procedencia: ${escapeHtml(s.origin||"-")}. Responsable: ${escapeHtml(o.createdBy||session.name)}. Se conserva sustento interno.</small></div>`:""}<div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo unit.</th><th>Subtotal</th></tr></thead><tbody>${o.items.map(i=>`<tr><td>${escapeHtml(i.item)}</td><td>${qty(i.qty)} ${escapeHtml(i.unit)}</td><td>${money(i.unitCost)}</td><td><strong>${money(i.qty*i.unitCost)}</strong></td></tr>`).join("")}</tbody></table></div>${o.notes?`<p class="purchase-detail-notes">${escapeHtml(o.notes)}</p>`:""}</div></section>`);
}
async function receivePurchase(id){
  const o=state.purchaseOrders.find(x=>x.id===id);if(!o||o.status==="Recibida")return;const ok=await confirmAction({title:"Recibir orden",message:`Se ingresarán al inventario los productos de ${o.id}.`,label:"Sí, recibir"});if(!ok)return;applyReceipt(o);o.status="Recibida";addAuditEvent(state,{user:session.name,action:"Compra recibida",module:"Inventario",detail:`${o.id} · ${o.supplier}`});buildSuggestions();saveState(state);showToast("Compra recibida y stock actualizado.");render()
}
function applyReceipt(o){
  if(o.receiptApplied)return;o.items.forEach(line=>{const i=inv(line.inventoryId);if(!i)return;i.stock=round3(Number(i.stock)+Number(line.qty));i.cost=Number(line.unitCost||i.cost);addMovement(i.id,i.item,"Entrada por compra","Entrada",line.qty,i.unit,line.unitCost,o.id,o.supplier);state.inventoryLots.unshift({id:`LOT-${Date.now()}-${i.id}`,code:`${i.id.replace("INS-","")}-${today().replaceAll("-","")}`,inventoryId:i.id,item:i.item,supplierId:o.supplierId,receivedAt:today(),expiry:i.expiry||"",initialQty:Number(line.qty),availableQty:Number(line.qty),unit:i.unit,location:i.location,rotation:i.rotation||"FIFO",documentation:o.voucher||"Recepción"})});o.receiptApplied=true
}

/* -------------------------- SUPPLIER MODALS -------------------------- */

function wireSuppliers(){
  view.querySelector("[data-supplier-type]")?.addEventListener("change",e=>{ui.supplierType=e.target.value;render()});
  view.querySelectorAll("[data-new-supplier]").forEach(b=>b.onclick=()=>openSupplier(null,b.dataset.newSupplier));
  view.querySelectorAll("[data-supplier-view]").forEach(b=>b.onclick=()=>openSupplierDetail(b.dataset.supplierView));
  view.querySelectorAll("[data-supplier-edit]").forEach(b=>b.onclick=()=>openSupplier(b.dataset.supplierEdit));
  view.querySelectorAll("[data-purchase-supplier]").forEach(b=>b.onclick=()=>openPurchase({supplierId:b.dataset.purchaseSupplier}));
}
function openSupplier(id=null,preferredType="Formal"){
  const s=id?state.suppliers.find(x=>x.id===id):null,type=s?.type||preferredType;
  const html=`<section class="modal supplier-form-modal"><div class="modal__header"><div><p class="eyebrow">Proveedores</p><h2>${s?"Editar proveedor":type==="Formal"?"Nuevo proveedor formal":"Nuevo productor / informal"}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-supplier-form>
  <div class="supplier-form-note span-2">${type==="Formal"?`<span class="status status--ok">Formal</span><p>RUC y datos de facturación.</p>`:`<span class="status status--warn">Productor / informal</span><p>DNI/RUC opcional. Se registra procedencia, responsable y sustento interno.</p>`}</div>
  <label>${type==="Formal"?"Razón social *":"Nombre / nombre conocido *"}<input name="name" value="${escapeHtml(s?.name||"")}" required></label><label>Nombre comercial<input name="tradeName" value="${escapeHtml(s?.tradeName||"")}"></label><label>Tipo documento<select name="documentType">${type==="Formal"?`<option>RUC</option><option>DNI</option>`:`<option>Sin documento</option><option>DNI opcional</option><option>RUC</option>`}</select></label><label>Número ${type==="Formal"?"*":"(opcional)"}<input name="document" value="${escapeHtml(s?.document||"")}" ${type==="Formal"?"required":""}></label><label>Teléfono<input name="phone" value="${escapeHtml(s?.phone||"")}"></label><label>Correo<input name="email" type="email" value="${escapeHtml(s?.email||"")}"></label><label class="span-2">Comunidad / procedencia<input name="origin" value="${escapeHtml(s?.origin||"")}"></label><label>Condición de pago<select name="paymentTerms">${["Contado","Crédito 7 días","Crédito 15 días","Crédito 30 días"].map(x=>`<option ${s?.paymentTerms===x?"selected":""}>${x}</option>`).join("")}</select></label><label>Sustento<select name="voucher">${type==="Formal"?`<option>Factura</option><option>Boleta</option><option>Otro</option>`:`<option>Sustento interno</option><option>Recibo simple</option><option>Sin documento externo</option>`}</select></label><label class="span-2">Productos<input name="products" value="${escapeHtml((s?.products||[]).join(", "))}"></label><label class="span-2">Observaciones<textarea class="textarea" name="notes" rows="3">${escapeHtml(s?.notes||"")}</textarea></label>
  <div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">${s?"Guardar":"Registrar"}</button></div></form></section>`;
  const modal=openModal(html);modal.querySelector("[data-supplier-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),payload={type,name:d.name.trim(),tradeName:d.tradeName.trim(),documentType:d.documentType,document:d.document.trim(),phone:d.phone.trim(),email:d.email.trim(),origin:d.origin.trim(),paymentTerms:d.paymentTerms,voucher:d.voucher,products:d.products.split(",").map(x=>x.trim()).filter(Boolean),status:s?.status||"Activo",notes:d.notes.trim()};if(s)Object.assign(s,payload);else state.suppliers.unshift({id:nextSupplierId(),...payload});addAuditEvent(state,{user:session.name,action:s?"Proveedor actualizado":"Proveedor registrado",module:"Inventario",detail:payload.name});saveState(state);closeModal();showToast(s?"Proveedor actualizado.":"Proveedor registrado.");render()}
}
function openSupplierDetail(id){
  const s=state.suppliers.find(x=>x.id===id);if(!s)return;const purchases=state.purchaseOrders.filter(o=>o.supplierId===id),total=purchases.reduce((a,o)=>a+Number(o.total||0),0);
  openModal(`<section class="modal supplier-detail-modal"><div class="modal__header"><div><p class="eyebrow">${s.type}</p><h2>${escapeHtml(s.tradeName||s.name)}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><div class="supplier-detail-body"><div class="inventory-detail-kpis"><div><span>Compras</span><strong>${purchases.length}</strong></div><div><span>Acumulado</span><strong>${money(total)}</strong></div><div><span>Estado</span><strong>${s.status}</strong></div><div><span>Documento</span><strong>${escapeHtml(s.document||"No aplica")}</strong></div></div>${s.type==="Informal"?`<div class="supplier-trace-note"><strong>Sin documentación completa</strong><small>No bloquea el registro. Se conserva procedencia, responsable y sustento.</small></div>`:""}<dl class="supplier-detail-list"><div><dt>Nombre</dt><dd>${escapeHtml(s.name)}</dd></div><div><dt>Procedencia</dt><dd>${escapeHtml(s.origin||"-")}</dd></div><div><dt>Teléfono</dt><dd>${escapeHtml(s.phone||"-")}</dd></div><div><dt>Correo</dt><dd>${escapeHtml(s.email||"-")}</dd></div><div><dt>Pago</dt><dd>${escapeHtml(s.paymentTerms||"-")}</dd></div><div><dt>Sustento</dt><dd>${escapeHtml(s.voucher||"-")}</dd></div></dl></div></section>`);
}

/* -------------------------- RECIPE MODALS -------------------------- */

function wireRecipes(){
  view.querySelector("[data-recipe-station]")?.addEventListener("change",e=>{ui.recipeStation=e.target.value;render()});
  view.querySelector("[data-new-recipe]")?.addEventListener("click",()=>openRecipe());
  view.querySelectorAll("[data-recipe-view]").forEach(b=>b.onclick=()=>openRecipeDetail(b.dataset.recipeView));
  view.querySelectorAll("[data-recipe-edit]").forEach(b=>b.onclick=()=>openRecipe(b.dataset.recipeEdit));
}
function openRecipeDetail(id){
  const r=state.recipes.find(x=>x.id===id);if(!r)return;const p=state.menuItems.find(x=>x.id===r.productId),cost=recipeCost(r),price=Number(p?.price||0),margin=price?((price-cost)/price)*100:0;
  openModal(`<section class="modal recipe-detail-modal"><div class="modal__header"><div><p class="eyebrow">BOM · ${escapeHtml(r.station)}</p><h2>${escapeHtml(r.name)}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><div class="recipe-detail-body"><div class="inventory-detail-kpis"><div><span>Costo/porción</span><strong>${money(cost)}</strong></div><div><span>Precio</span><strong>${money(price)}</strong></div><div><span>Margen</span><strong>${margin.toFixed(1)}%</strong></div><div><span>Versión</span><strong>v${r.version}</strong></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Ingrediente</th><th>Cantidad</th><th>Costo unit.</th><th>Costo receta</th></tr></thead><tbody>${r.ingredients.map(ing=>{const i=inv(ing.inventoryId);return `<tr><td><strong>${escapeHtml(i?.item||ing.inventoryId)}</strong><br><small class="muted">${escapeHtml(ing.note||"")}</small></td><td>${qty(ing.qty)} ${escapeHtml(ing.unit)}</td><td>${money(i?.cost||0)} / ${escapeHtml(i?.unit||"-")}</td><td><strong>${money(ingredientCost(i,ing))}</strong></td></tr>`}).join("")}</tbody></table></div>${r.variants.length?`<section class="recipe-detail-variants"><h3>Variantes</h3>${r.variants.map(v=>`<article><strong>${escapeHtml(v.modifier)}</strong><small>Reemplaza ${escapeHtml(inv(v.replaceInventoryId)?.item||v.replaceInventoryId)} por ${escapeHtml(inv(v.withInventoryId)?.item||v.withInventoryId)} · ${qty(v.qty)} ${escapeHtml(v.unit)}</small></article>`).join("")}</section>`:""}</div></section>`);
}
function openRecipe(id=null){
  const r=id?state.recipes.find(x=>x.id===id):null;
  const html=`<section class="modal recipe-form-modal"><div class="modal__header"><div><p class="eyebrow">Recetas / BOM</p><h2>${r?"Editar receta":"Nueva receta"}</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-recipe-form>
  <label class="span-2">Producto de carta *<select name="productId" required><option value="">Seleccionar...</option>${state.menuItems.filter(p=>p.requiresPreparation!==false).map(p=>`<option value="${p.id}" ${r?.productId===p.id?"selected":""}>${escapeHtml(p.name)} · ${escapeHtml(p.station||"Producción")}</option>`).join("")}</select></label><label>Estación<select name="station"><option ${r?.station==="Barra"?"selected":""}>Barra</option><option ${r?.station==="Cocina"?"selected":""}>Cocina</option></select></label><label>Tiempo objetivo<input name="targetMinutes" type="number" min="1" value="${r?.targetMinutes??5}"></label><label>Rendimiento<input name="yieldQty" type="number" min=".001" step=".001" value="${r?.yieldQty??1}"></label><label>Unidad rendimiento<input name="yieldUnit" value="${escapeHtml(r?.yieldUnit||"porción")}"></label><label>Merma técnica %<input name="expectedWastePct" type="number" min="0" max="100" step=".1" value="${r?.expectedWastePct??0}"></label><label>Versión<input name="version" value="${escapeHtml(r?.version||"1.0")}"></label>
  <label class="span-2">Ingrediente principal *<select name="ingredientId">${state.inventory.map(i=>`<option value="${i.id}" ${r?.ingredients?.[0]?.inventoryId===i.id?"selected":""}>${escapeHtml(i.item)} · ${escapeHtml(i.unit)}</option>`).join("")}</select></label><label>Cantidad<input name="ingredientQty" type="number" min=".001" step=".001" value="${r?.ingredients?.[0]?.qty??1}" required></label><label>Unidad<select name="ingredientUnit">${unitOptions(r?.ingredients?.[0]?.unit||"",true)}</select></label><label class="span-2">Nota<input name="ingredientNote" value="${escapeHtml(r?.ingredients?.[0]?.note||"")}"></label><div class="recipe-form-info span-2"><strong>Alta rápida del prototipo</strong><p>El ERP final permitirá múltiples ingredientes, sustituciones y versionado detallado.</p></div>
  <div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">${r?"Guardar receta":"Crear receta"}</button></div></form></section>`;
  const modal=openModal(html);modal.querySelector("[data-recipe-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),p=state.menuItems.find(x=>x.id===d.productId),i=inv(d.ingredientId);if(!p||!i){showToast("Selecciona producto e ingrediente.");return}const payload={productId:p.id,name:p.name,station:d.station,yieldQty:Number(d.yieldQty),yieldUnit:d.yieldUnit.trim(),targetMinutes:Number(d.targetMinutes),expectedWastePct:Number(d.expectedWastePct),version:d.version.trim()||"1.0",status:"Activa",ingredients:[{inventoryId:i.id,qty:Number(d.ingredientQty),unit:d.ingredientUnit,note:d.ingredientNote.trim()},...(r?.ingredients?.slice(1)||[])],variants:r?.variants||[]};if(r)Object.assign(r,payload);else state.recipes.unshift({id:nextRecipeId(),...payload});addAuditEvent(state,{user:session.name,action:r?"Receta actualizada":"Receta creada",module:"Inventario",detail:p.name});saveState(state);closeModal();showToast(r?"Receta actualizada.":"Receta registrada.");render()}
}

/* -------------------------- WASTE MODAL -------------------------- */

function wireWaste(){view.querySelector("[data-waste-type]")?.addEventListener("change",e=>{ui.wasteType=e.target.value;render()});view.querySelector("[data-new-waste]")?.addEventListener("click",openWaste)}
function openWaste(){
  const html=`<section class="modal waste-form-modal"><div class="modal__header"><div><p class="eyebrow">Mermas</p><h2>Registrar merma</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="inventory-form-modal__body" data-waste-form><div class="waste-type-selector">${["Insumo","Preparación","Producto terminado"].map((t,n)=>`<label><input type="radio" name="type" value="${t}" ${n===0?"checked":""}><span><strong>${t}</strong><small>${t==="Insumo"?"Vencimiento, deterioro, derrame.":t==="Preparación"?"Error, cambio, rendimiento.":"Producto listo, devolución o descarte."}</small></span></label>`).join("")}</div><div class="form-grid waste-dynamic-fields" data-waste-fields></div><div class="modal__actions"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">Registrar merma</button></div></form></section>`;
  const modal=openModal(html),form=modal.querySelector("[data-waste-form]"),renderFields=()=>{const type=new FormData(form).get("type")||"Insumo";modal.querySelector("[data-waste-fields]").innerHTML=wasteFields(type)};
  form.querySelectorAll('input[name="type"]').forEach(x=>x.onchange=renderFields);renderFields();
  form.onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),type=d.type,q=Number(d.qty||1);let name="",itemId="",unit="un",cost=0;
    if(type==="Insumo"){const i=inv(d.itemId);if(!i)return;if(q>Number(i.stock)){showToast("La merma supera el stock.");return}name=i.item;itemId=i.id;unit=i.unit;cost=q*Number(i.cost);i.stock=round3(Number(i.stock)-q);addMovement(i.id,i.item,"Merma","Salida",q,i.unit,i.cost,"Merma manual",d.reason)}
    else {const p=state.menuItems.find(x=>x.id===d.itemId),r=state.recipes.find(x=>x.productId===d.itemId);name=p?.name||d.itemId;itemId=p?.id||d.itemId;cost=q*(r?recipeCost(r):Number(p?.price||0)*.4)}
    state.wasteRecords.unshift({id:nextWasteId(),type,itemId,item:name,qty:q,unit,reason:d.reason,station:d.station||"",cost:round2(cost),status:"Registrada",user:session.name,at:new Date().toISOString(),date:today(),orderId:d.orderId?.trim()||"",table:d.table?.trim()||"",note:d.note?.trim()||""});
    addAuditEvent(state,{user:session.name,action:"Merma registrada",module:"Inventario",detail:`${type} · ${name} · ${d.reason}`});buildSuggestions();saveState(state);closeModal();showToast("Merma registrada.");render()
  }
}
function wasteFields(type){
  const selector=type==="Insumo"?`<label class="span-2">Insumo *<select name="itemId">${state.inventory.map(i=>`<option value="${i.id}">${escapeHtml(i.item)} · ${qty(i.stock)} ${escapeHtml(i.unit)}</option>`).join("")}</select></label>`:`<label class="span-2">Producto / preparación *<select name="itemId">${state.menuItems.filter(p=>p.requiresPreparation!==false).map(p=>`<option value="${p.id}">${escapeHtml(p.name)} · ${escapeHtml(p.station||"Producción")}</option>`).join("")}</select></label>`;
  return `${selector}<label>Cantidad *<input name="qty" type="number" min=".001" step=".001" value="1" required></label><label>Motivo *<select name="reason">${WASTE_REASONS[type].map(r=>`<option>${escapeHtml(r)}</option>`).join("")}</select></label><label>Estación<select name="station"><option value="">No aplica</option><option>Barra</option><option>Cocina</option><option>Almacén</option></select></label>${type!=="Insumo"?`<label>Pedido<input name="orderId" placeholder="ORD-1045"></label><label>Mesa<input name="table" placeholder="Mesa A2"></label>`:`<div></div>`}<label class="span-2">Observación<textarea class="textarea" name="note" rows="3"></textarea></label><div class="waste-impact-note span-2"><strong>${type==="Insumo"?"Impacto inmediato en stock":type==="Preparación"?"Merma de proceso":"Producto terminado no vendible"}</strong><small>${type==="Insumo"?"Descuenta stock y registra Kardex.":"Conserva pedido, estación, motivo y costo estimado."}</small></div>`;
}

/* -------------------------- PRODUCTION MODAL -------------------------- */

function openProduction(){
  const html=`<section class="modal production-form-modal"><div class="modal__header"><div><p class="eyebrow">Producción</p><h2>Registrar rendimiento</h2></div><button class="icon-button" data-close-modal>${closeIcon}</button></div><form class="form-grid inventory-form-modal__body" data-production-form><label class="span-2">Preparación / transformación *<input name="name" required></label><label>Estación<select name="station"><option>Barra</option><option>Cocina</option><option>Producción</option></select></label><label>Lote relacionado<input name="lotCode"></label><label>Cantidad esperada<input name="expectedQty" type="number" min=".001" step=".001" required></label><label>Cantidad real<input name="actualQty" type="number" min="0" step=".001" required></label><label>Unidad<select name="unit">${unitOptions("",true)}</select></label><label>Costo pérdida<input name="wasteCost" type="number" min="0" step=".01" value="0"></label><label class="span-2">Observaciones<textarea class="textarea" name="notes" rows="3"></textarea></label><div class="modal__actions span-2"><button class="button button--secondary" type="button" data-close-modal>Cancelar</button><button class="button button--primary">Registrar</button></div></form></section>`;
  const modal=openModal(html);modal.querySelector("[data-production-form]").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget)),expected=Number(d.expectedQty),actual=Number(d.actualQty),waste=Math.max(0,expected-actual),yieldPct=expected?actual/expected*100:0,b={id:nextProductionId(),name:d.name.trim(),station:d.station,lotCode:d.lotCode.trim(),expectedQty:expected,actualQty:actual,unit:d.unit,yieldPct:round2(yieldPct),wasteQty:round3(waste),wasteCost:Number(d.wasteCost||0),startedAt:new Date().toISOString(),finishedAt:new Date().toISOString(),user:session.name,status:"Finalizado",notes:d.notes.trim()};state.productionBatches.unshift(b);if(waste>0)state.wasteRecords.unshift({id:nextWasteId(),type:"Preparación",itemId:b.id,item:b.name,qty:waste,unit:b.unit,reason:"Rendimiento menor al esperado",station:b.station,cost:b.wasteCost,status:"Registrada",user:session.name,at:new Date().toISOString(),date:today(),note:`Esperado ${expected}; real ${actual}.`});addAuditEvent(state,{user:session.name,action:"Rendimiento registrado",module:"Inventario",detail:`${b.name} · ${b.yieldPct}%`});saveState(state);closeModal();showToast("Rendimiento registrado.");render()}
}

/* -------------------------- HELPERS -------------------------- */

function buildSuggestions(){state.purchaseSuggestions=state.inventory.filter(i=>Number(i.stock)<=Number(i.min)).map(i=>({id:`SGR-${i.id}`,inventoryId:i.id,item:i.item,stock:Number(i.stock),min:Number(i.min),unit:i.unit,suggestedQty:round3(Math.max(0,Math.max(i.min*2,i.min+1)-i.stock)),reason:"Stock por debajo del mínimo",supplierId:preferredSupplier(i.id)?.id||null}))}
function inv(id){return state.inventory.find(i=>i.id===id)||null}
function defaultSupplier(id){if(id==="INS-01")return"PRV-002";if(id==="INS-02")return"PRV-001";if(["INS-06","INS-09"].includes(id))return"PRV-003";if(["INS-11","INS-12","INS-13","INS-14","INS-15","INS-16","INS-17"].includes(id))return"PRV-004";return null}
function preferredSupplier(id){const direct=defaultSupplier(id);if(direct)return state.suppliers.find(s=>s.id===direct)||null;const i=inv(id);return state.suppliers.find(s=>(s.products||[]).some(p=>norm(i?.item).includes(norm(p))||norm(p).includes(norm(i?.item))))||null}
function supplierName(id){const s=state.suppliers.find(x=>x.id===id);return s?.tradeName||s?.name||""}
function inferInventoryType(i){if(i.category==="Bebidas listas")return"Despacho directo";if(i.category==="Cafe")return"Materia prima";return"Insumo"}
function lotStatus(l){if(Number(l.availableQty)<=0)return"Agotado";const d=daysUntil(l.expiry);if(l.expiry&&d<0)return"Vencido";if(l.expiry&&d<=7)return"Por vencer";return"Disponible"}
function daysUntil(date){if(!date)return 99999;return Math.ceil((new Date(`${date}T00:00:00`)-new Date(`${today()}T00:00:00`))/86400000)}
function ingredientCost(i,ing){if(!i)return 0;let q=Number(ing.qty),iu=String(i.unit).toLowerCase(),gu=String(ing.unit).toLowerCase();if(iu==="kg"&&gu==="g")q/=1000;if(iu==="l"&&gu==="ml")q/=1000;if(iu==="g"&&gu==="kg")q*=1000;if(iu==="ml"&&gu==="l")q*=1000;return q*Number(i.cost||0)}
function recipeCost(r){return round2(r.ingredients.reduce((s,ing)=>s+ingredientCost(inv(ing.inventoryId),ing),0))}
function recipeMargin(r){const p=state.menuItems.find(x=>x.id===r.productId),price=Number(p?.price||0),cost=recipeCost(r);return price?((price-cost)/price)*100:0}
function wasteTotals(){const x={Insumo:0,"Preparación":0,"Producto terminado":0,total:0};state.wasteRecords.forEach(r=>{const t=normalizeWasteType(r.type),c=Number(r.cost||0);x[t]+=c;x.total+=c});return x}
function normalizeWasteType(type){const v=String(type||"").toLowerCase();if(v.includes("terminado"))return"Producto terminado";if(v.includes("prepar"))return"Preparación";return"Insumo"}
function addMovement(inventoryId,item,type,direction,q,u,cost,origin,reference){state.inventoryMovements.unshift({id:`MOV-${Date.now()}-${Math.random().toString(16).slice(2,6)}`,at:new Date().toISOString(),inventoryId,item,type,direction,qty:Number(q),unit:u,unitCost:Number(cost||0),cost:round2(Number(q)*Number(cost||0)),origin,reference,user:session.name})}
function nextInventoryId(){return seqId(state.inventory,"INS",2)}
function nextSupplierId(){return seqId(state.suppliers,"PRV",3)}
function nextPurchaseId(){return seqId(state.purchaseOrders,"OC",4)}
function nextRecipeId(){return seqId(state.recipes,"RCP",3)}
function nextWasteId(){return seqId(state.wasteRecords,"MER",3)}
function nextProductionId(){return seqId(state.productionBatches,"PROD",3)}
function seqId(arr,prefix,pad){let max=0;arr.forEach(x=>{const m=String(x.id||"").match(new RegExp(`^${prefix}-(\\d+)$`));if(m)max=Math.max(max,Number(m[1]))});return `${prefix}-${String(max+1).padStart(pad,"0")}`}
function qty(v){const n=Number(v||0);return Number.isInteger(n)?String(n):n.toFixed(3).replace(/0+$/,"").replace(/\.$/,"")}
function today(){const d=new Date(),l=new Date(d.getTime()-d.getTimezoneOffset()*60000);return l.toISOString().slice(0,10)}
function shortDate(v){if(!v)return"-";try{return new Intl.DateTimeFormat("es-PE",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(`${String(v).slice(0,10)}T12:00:00`))}catch{return String(v)}}
function dateTime(v){if(!v)return"-";try{const d=new Date(v);if(Number.isNaN(d.getTime()))return shortDate(v);return new Intl.DateTimeFormat("es-PE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(d)}catch{return String(v)}}
function round2(v){return Math.round((Number(v||0)+Number.EPSILON)*100)/100}
function round3(v){return Math.round((Number(v||0)+Number.EPSILON)*1000)/1000}
function norm(v){return String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()}
function tableEmpty(n,msg){return `<tr><td colspan="${n}" class="text-center muted">${escapeHtml(msg)}</td></tr>`}
function emptyMini(sym,title,detail){return `<div class="inventory-empty-mini"><span>${sym}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div>`}
