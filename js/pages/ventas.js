// Cafe Fusiones - Ventas V4
// Frontend demostrativo integrado para salon, mozos, pedidos, KDS y cobro.
// Funciona sobre pages/ventas.html existente y el esquema V6 de storage.js.

import { requireAuth, demoUser } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState, nextId, addAuditEvent } from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import {
  icon,
  money,
  escapeHtml,
  statusClass,
  matchesSearch,
  emptyState,
  tableSubtotal,
  tableTotal,
  IGV_RATE,
  buildSimplePdf,
  downloadBlob
} from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(window.location.search);

const ui = {
  tab: params.get("tab") === "pedidos" || params.get("tab") === "kds" || params.get("tab") === "historial" ? params.get("tab") : "salon",
  salonMode: params.get("mode") === "list" ? "list" : "map",
  search: "",
  area: "Todos",
  tableStatus: "Todos",
  orderStatus: "Todos",
  kdsStation: "Todos",
  kdsStatus: "Todos"
};

const saleUi = {
  tableId: null,
  channel: "Local",
  area: null,
  category: "Todos",
  productSearch: "",
  cart: [],
  mode: "new",
  customerId: "",
  people: 2,
  configuringId: null,
  configSelections: {},
  configNote: ""
};

const payUi = {
  invoiceType: "Boleta",
  posPrompt: false,
  anulando: null
};

if (session) init();

function init() {
  ensureVentasV4Styles();
  normalizeOperationalState();
  renderSidebar("ventas", session.role);
  renderTopbar({
    title: "Ventas",
    eyebrow: "Restaurant",
    searchPlaceholder: "Buscar mesa, cliente o pedido",
    onSearch: (query) => {
      ui.search = query || "";
      render();
    }
  });
  render();
}

/* ========================================================================== */
/* NORMALIZACION DEMO                                                         */
/* ========================================================================== */

function normalizeOperationalState() {
  state.tables ||= [];
  state.kitchenOrders ||= [];
  state.salesHistory ||= [];
  state.customers ||= [];
  state.menuItems ||= [];
  state.menuCategories ||= ["Todos"];

  state.tables.forEach((table) => {
    table.items ||= [];
    table.customerId ||= null;
    table.openedAt ||= table.items.length ? new Date().toISOString() : null;
  });

  state.kitchenOrders.forEach((order) => {
    order.items ||= [];
    order.items.forEach((item) => {
      item.status ||= normalizeProductionStatus(order.status);
      item.modifiers ||= [];
      item.note ||= "";
    });
    order.status = deriveOrderStatus(order);
  });

  saveState(state);
}

function normalizeProductionStatus(status) {
  if (status === "Preparando") return "Preparando";
  if (status === "Listo") return "Listo";
  if (status === "Entregado") return "Entregado";
  return "Nuevo";
}

/* ========================================================================== */
/* RENDER PRINCIPAL                                                           */
/* ========================================================================== */

function render() {
  view.innerHTML = `
    <div class="view-stack ventas-v4">
      ${salesTabs()}
      ${renderActiveTab()}
    </div>`;
  wireMain();
}

function salesTabs() {
  const activeOrders = state.kitchenOrders.filter((order) => order.status !== "Entregado").length;
  const ready = state.kitchenOrders.filter((order) => order.status === "Listo").length;
  const tabs = [
    { id: "salon", label: "Salon", count: occupiedTables().length },
    { id: "pedidos", label: "Pedidos", count: activeOrders },
    { id: "kds", label: "Producción", count: ready },
    { id: "historial", label: "Historial", count: state.salesHistory.length }
  ];

  return `
    <section class="sales-toolbar panel">
      <div class="sales-tabs" role="tablist" aria-label="Vistas de ventas">
        ${tabs.map((tab) => `
          <button class="sales-tab ${ui.tab === tab.id ? "is-active" : ""}" type="button" data-sales-tab="${tab.id}">
            <span>${escapeHtml(tab.label)}</span>
            <b>${tab.count}</b>
          </button>`).join("")}
      </div>
    </section>`;
}

function renderActiveTab() {
  if (ui.tab === "pedidos") return ordersSection();
  if (ui.tab === "kds") return kdsSection();
  if (ui.tab === "historial") return historySection();
  return salonSection();
}

function wireMain() {
  view.querySelectorAll("[data-sales-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.tab = button.dataset.salesTab;
      render();
    });
  });

  if (ui.tab === "salon") wireSalon();
  if (ui.tab === "pedidos") wireOrders();
  if (ui.tab === "kds") wireKds();
  if (ui.tab === "historial") wireHistory();
}

/* ========================================================================== */
/* SALON / VISTA MOZO                                                         */
/* ========================================================================== */

function salonSection() {
  const tables = filteredTables();
  const occupied = occupiedTables().length;
  const free = state.tables.filter((table) => table.seats > 0 && table.status === "Libre").length;
  const reserved = state.tables.filter((table) => table.seats > 0 && table.status === "Reservada").length;

  return `
    <section class="panel salon-shell">
      <div class="panel__header panel__header--wrap">
        <div>
          <p class="eyebrow">Atencion en local</p>
          <h2>Salon de Cafe Fusiones</h2>
          <p class="muted">Selecciona una mesa para tomar, revisar o cobrar un pedido.</p>
        </div>
        <div class="salon-mode-switch" role="group" aria-label="Tipo de vista">
          <button type="button" class="mini-button ${ui.salonMode === "map" ? "is-active" : ""}" data-salon-mode="map">Plano</button>
          <button type="button" class="mini-button ${ui.salonMode === "list" ? "is-active" : ""}" data-salon-mode="list">Lista</button>
        </div>
      </div>

      <div class="salon-kpis">
        ${miniKpi("Ocupadas", occupied, "Atencion activa")}
        ${miniKpi("Libres", free, "Disponibles")}
        ${miniKpi("Reservadas", reserved, "Proximas atenciones")}
      </div>

      <div class="salon-filters">
        <label>Espacio
          <select data-filter="area">
            ${["Todos", ...new Set(state.tables.filter((table) => table.seats > 0).map((table) => table.area))]
              .map((area) => `<option value="${escapeHtml(area)}" ${ui.area === area ? "selected" : ""}>${escapeHtml(area)}</option>`).join("")}
          </select>
        </label>
        <label>Estado
          <select data-filter="tableStatus">
            ${["Todos", "Libre", "Ocupada", "Reservada"].map((status) => `<option value="${status}" ${ui.tableStatus === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </label>
        <div class="legend-row" aria-label="Leyenda">
          ${legendDot("Libre", "free")}${legendDot("Ocupada", "busy")}${legendDot("Reservada", "reserved")}
        </div>
      </div>

      ${ui.salonMode === "map" ? floorPlan(tables) : tablesList(tables)}
    </section>`;
}

function miniKpi(label, value, hint) {
  return `<article class="salon-kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function legendDot(label, tone) {
  return `<span class="legend-item"><i class="legend-dot legend-dot--${tone}"></i>${escapeHtml(label)}</span>`;
}

function filteredTables() {
  return state.tables.filter((table) => {
    if (table.seats === 0) return false;
    const order = latestOrderForTable(table.id);
    const customer = customerById(table.customerId);
    return (ui.area === "Todos" || table.area === ui.area) &&
      (ui.tableStatus === "Todos" || table.status === ui.tableStatus) &&
      matchesSearch(ui.search, table.name, table.area, table.status, customer?.name, order?.id);
  });
}

function floorPlan(tables) {
  const allowed = new Set(tables.map((table) => table.id));
  const realTables = [...state.tables.filter((table) => table.seats > 0 && allowed.has(table.id))].sort((a, b) => {
    const mapA = a.map || fallbackTableMap(a.id);
    const mapB = b.map || fallbackTableMap(b.id);
    const byY = (mapA.y || 0) - (mapB.y || 0);
    return byY !== 0 ? byY : (mapA.x || 0) - (mapB.x || 0);
  });

  return `
    <div class="floorplan-wrap floorplan-wrap--map-only">
      <div class="floorplan" aria-label="Plano operativo de Cafe Fusiones">
        <div class="floor-zone floor-zone--books"><span>Intercambio<br>de libros</span></div>
        <div class="floor-zone floor-zone--art-a"><span>Artesania</span></div>
        <div class="floor-zone floor-zone--art-b"><span>Artesania</span></div>
        <div class="floor-zone floor-zone--office"><span>Oficina</span></div>
        <button class="floor-zone floor-zone--kitchen" type="button" data-open-station="Cocina"><span>Cocina</span><small>${stationPending("Cocina")} pendientes</small></button>
        <button class="floor-zone floor-zone--bar" type="button" data-open-station="Barra"><span>Barra</span><small>${stationPending("Barra")} pendientes</small></button>
        <div class="floor-zone floor-zone--wc"><span>SS.HH.</span></div>
        <span class="floor-door floor-door--a">Ingreso</span>
        <span class="floor-door floor-door--b">Ingreso</span>
        ${realTables.map(floorTableButton).join("")}
      </div>
    </div>`;
}

function floorTableButton(table) {
  const tone = table.status === "Libre" ? "free" : table.status === "Reservada" ? "reserved" : "busy";
  const map = table.map || fallbackTableMap(table.id);
  const total = table.items?.length ? tableTotal(table) : 0;
  const customer = customerById(table.customerId);
  const style = `left:${map.x || 10}%;top:${map.y || 10}%;width:${Math.max(map.w || 7, 7)}%;height:${Math.max(map.h || 7, 7)}%;`;

  return `
    <button class="floor-table floor-table--${tone} ${map.shape === "round" ? "is-round" : ""}" style="${style}" type="button" data-table-open="${table.id}" title="${escapeHtml(table.name)} - ${escapeHtml(table.status)}">
      <strong>${escapeHtml(table.name.replace("Mesa ", ""))}</strong>
      ${table.status === "Ocupada" ? `<small>${money(total)}</small>` : `<small>${escapeHtml(table.status)}</small>`}
      ${customer ? `<em>${escapeHtml(firstName(customer.name))}</em>` : ""}
    </button>`;
}

function fallbackTableMap(id) {
  const fallback = {
    M1: { x: 72, y: 44, w: 8, h: 8 }, M2: { x: 18, y: 49, w: 8, h: 8 },
    M3: { x: 55, y: 29, w: 8, h: 11 }, M4: { x: 64, y: 29, w: 15, h: 8 },
    M5: { x: 56, y: 43, w: 8, h: 8 }, M6: { x: 67, y: 36, w: 8, h: 8 },
    A1: { x: 74, y: 52, w: 8, h: 8 }, A2: { x: 45, y: 52, w: 9, h: 8 },
    A3: { x: 20, y: 36, w: 8, h: 10 }, A4: { x: 20, y: 20, w: 8, h: 10 }
  };
  return fallback[id] || { x: 10, y: 10, w: 8, h: 8 };
}

function operationSnapshot() {
  const orders = state.kitchenOrders.filter((order) => order.status !== "Entregado");
  const ready = orders.filter((order) => order.status === "Listo").slice(0, 3);
  const delayed = orders.filter((order) => elapsedMinutes(order) >= 10 && order.status !== "Listo").slice(0, 3);

  return `
    <div class="operation-box">
      <span class="operation-box__label">Listos para entregar</span>
      ${ready.length ? ready.map((order) => `<button type="button" data-order-focus="${order.id}"><strong>${escapeHtml(order.table || order.channel)}</strong><small>${escapeHtml(order.id)}</small></button>`).join("") : `<p class="muted">Sin pedidos listos.</p>`}
    </div>
    <div class="operation-box">
      <span class="operation-box__label">Atencion requerida</span>
      ${delayed.length ? delayed.map((order) => `<button type="button" data-order-focus="${order.id}" class="is-alert"><strong>${escapeHtml(order.table || order.channel)}</strong><small>${elapsedMinutes(order)} min</small></button>`).join("") : `<p class="muted">Tiempos dentro del objetivo.</p>`}
    </div>
    <button class="button button--secondary button--block" type="button" data-go-kds>${icon("chef")}<span>Ver produccion</span></button>`;
}

function tablesList(tables) {
  return `<div class="table-map salon-table-list">${tables.map(tableTile).join("") || emptyState("No hay mesas con ese filtro.")}</div>`;
}

function tableTile(table) {
  const busy = table.status === "Ocupada";
  const cls = table.status === "Libre" ? "is-free" : busy ? "is-busy" : "";
  const total = tableTotal(table);
  const customer = customerById(table.customerId);
  const actions = busy
    ? `<div class="tile-actions"><button class="mini-button" type="button" data-add-sale="${table.id}">Agregar</button><button class="mini-button mini-button--danger" type="button" data-charge="${table.id}">Cobrar</button></div>`
    : `<button class="mini-button" type="button" data-new-order="${table.id}">Tomar pedido</button>`;

  return `<article class="table-tile ${cls}" data-table-card="${table.id}">
    <div class="table-tile__head"><strong>${escapeHtml(table.name)}</strong><span class="${statusClass(table.status)}">${table.status}</span></div>
    <span class="muted">${table.seats} asientos · ${escapeHtml(table.area)}</span>
    ${customer ? `<span class="muted">${escapeHtml(customer.name)} · ${escapeHtml(customer.level || "Cliente")}</span>` : ""}
    <span class="muted">${busy ? `${table.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} items · ${money(total)}` : "Disponible"}</span>
    ${actions}
  </article>`;
}

function wireSalon() {
  view.querySelectorAll("[data-salon-mode]").forEach((button) => button.addEventListener("click", () => {
    ui.salonMode = button.dataset.salonMode;
    render();
  }));

  view.querySelectorAll("[data-filter]").forEach((select) => select.addEventListener("change", (event) => {
    ui[event.target.dataset.filter] = event.target.value;
    render();
  }));

  view.querySelectorAll("[data-table-open]").forEach((button) => button.addEventListener("click", () => openTablePanel(button.dataset.tableOpen)));
  view.querySelectorAll("[data-new-order]").forEach((button) => button.addEventListener("click", () => openSaleModal(button.dataset.newOrder, "new")));
  view.querySelectorAll("[data-add-sale]").forEach((button) => button.addEventListener("click", () => openSaleModal(button.dataset.addSale, "add")));
  view.querySelectorAll("[data-charge]").forEach((button) => button.addEventListener("click", () => openPrecuenta(button.dataset.charge)));

  view.querySelectorAll("[data-open-station]").forEach((button) => button.addEventListener("click", () => {
    ui.kdsStation = button.dataset.openStation;
    ui.tab = "kds";
    render();
  }));

  view.querySelector("[data-go-kds]")?.addEventListener("click", () => {
    ui.tab = "kds";
    render();
  });

  view.querySelectorAll("[data-order-focus]").forEach((button) => button.addEventListener("click", () => {
    ui.tab = "pedidos";
    ui.search = button.dataset.orderFocus;
    render();
  }));
}

function openTablePanel(tableId) {
  const table = state.tables.find((item) => item.id === tableId);
  if (!table) return;

  if (table.status === "Libre") {
    openSaleModal(table.id, "new");
    return;
  }

  const order = latestOrderForTable(table.id);
  const customer = customerById(table.customerId);
  const total = tableTotal(table);
  const opened = table.openedAt ? minutesSince(table.openedAt) : 0;

  const html = `
    <section class="modal table-detail-modal" role="dialog" aria-modal="true" aria-labelledby="table-detail-title">
      <div class="modal__header">
        <div><p class="eyebrow">Salon</p><h2 id="table-detail-title">${escapeHtml(table.name)}</h2></div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button>
      </div>
      <div class="table-detail-body">
        <div class="table-detail-status">
          <span class="${statusClass(order?.status || table.status)}">${escapeHtml(order?.status || table.status)}</span>
          <span>${opened ? `${opened} min de atencion` : escapeHtml(table.area)}</span>
        </div>
        <div class="table-detail-kpis">
          ${miniKpi("Personas", table.people || table.seats || 0, "Mesa")}
          ${miniKpi("Productos", table.items.reduce((sum, item) => sum + Number(item.qty || 0), 0), "En consumo")}
          ${miniKpi("Total", money(total), "Incluye IGV")}
        </div>
        <section class="table-customer-box">
          <span class="muted">Cliente asociado</span>
          ${customer ? `<strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.level || "Cliente")} · ${Number(customer.points || 0)} puntos</small>` : `<strong>Consumidor final</strong><small>Puedes asociar un cliente desde el pedido.</small>`}
        </section>
        <div class="table-current-items">
          <h3>Pedido actual</h3>
          ${table.items.length ? table.items.map((item) => `<div><span><strong>${item.qty}× ${escapeHtml(item.name)}</strong>${item.modifiers?.length ? `<small>${escapeHtml(item.modifiers.join(" · "))}</small>` : item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}</span><b>${money(item.price * item.qty)}</b></div>`).join("") : emptyState("Aun no hay productos en la mesa.")}
        </div>
        <div class="table-detail-actions">
          <button class="button button--secondary" type="button" data-table-add="${table.id}">${icon("plus")}<span>Agregar productos</span></button>
          ${order?.status === "Listo" ? `<button class="button button--secondary" type="button" data-table-delivered="${table.id}">${icon("chef")}<span>Marcar entregado</span></button>` : ""}
          <button class="button button--primary" type="button" data-table-charge="${table.id}">${icon("cash")}<span>Cobrar ${money(total)}</span></button>
        </div>
      </div>
    </section>`;

  const backdrop = openModal(html);
  backdrop.querySelector("[data-table-add]")?.addEventListener("click", () => openSaleModal(table.id, "add"));
  backdrop.querySelector("[data-table-charge]")?.addEventListener("click", () => openPrecuenta(table.id));
  backdrop.querySelector("[data-table-delivered]")?.addEventListener("click", () => {
    markOrderDelivered(order?.id);
    closeModal();
    render();
  });
}

/* ========================================================================== */
/* NUEVO PEDIDO / POS PARA MOZO                                               */
/* ========================================================================== */

function openSaleModal(tableId, mode = "new") {
  saleUi.mode = mode;
  saleUi.cart = [];
  saleUi.category = "Todos";
  saleUi.productSearch = "";
  saleUi.configuringId = null;
  saleUi.configSelections = {};
  saleUi.configNote = "";

  if (tableId) {
    const table = state.tables.find((item) => item.id === tableId);
    saleUi.tableId = table?.id || null;
    saleUi.area = table?.area || firstLocalArea();
    saleUi.channel = table?.seats === 0 ? "Delivery" : "Local";
    saleUi.customerId = table?.customerId || "";
    saleUi.people = table?.people || Math.min(table?.seats || 2, 2);
  } else {
    const first = state.tables.find((table) => table.seats > 0 && table.status === "Libre") || state.tables.find((table) => table.seats > 0);
    saleUi.tableId = first?.id || null;
    saleUi.area = first?.area || firstLocalArea();
    saleUi.channel = "Local";
    saleUi.customerId = "";
    saleUi.people = 2;
  }

  renderSaleModal();
}

function firstLocalArea() {
  return state.tables.find((table) => table.seats > 0)?.area || "Salon principal";
}

function renderSaleModal() {
  const table = state.tables.find((item) => item.id === saleUi.tableId);
  const areas = [...new Set(state.tables.filter((item) => item.seats > 0).map((item) => item.area))];
  const areaTables = state.tables.filter((item) => item.seats > 0 && item.area === saleUi.area);
  const existing = saleUi.mode === "add" && table ? table.items : [];

  const html = `
    <section class="modal sale-modal sale-modal--v4" role="dialog" aria-modal="true" aria-labelledby="sale-title">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Venta / Atencion</p>
          <h2 id="sale-title">${saleUi.mode === "add" ? `Agregar a ${escapeHtml(table?.name || "pedido")}` : "Tomar pedido"}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar pedido">${closeIcon}</button>
      </div>

      ${saleUi.configuringId ? modifierConfigurator() : `
        <div class="sale-v4-head">
          <div class="segmented segmented--compact" role="tablist" aria-label="Canal de venta">
            ${["Local", "Delivery"].map((channel) => `<button type="button" class="${saleUi.channel === channel ? "is-active" : ""}" data-channel="${channel}">${channel}</button>`).join("")}
          </div>
          <label>Cliente
            <select data-customer-select>
              <option value="">Consumidor final</option>
              ${state.customers.map((customer) => `<option value="${customer.id}" ${saleUi.customerId === customer.id ? "selected" : ""}>${escapeHtml(customer.name)} · ${escapeHtml(customer.level || "Cliente")} · ${Number(customer.points || 0)} pts</option>`).join("")}
            </select>
          </label>
          ${saleUi.channel === "Local" ? `<label>Personas<input type="number" min="1" max="20" value="${saleUi.people}" data-people></label>` : `<span class="delivery-pill">Pedido sin mesa</span>`}
        </div>

        <div class="sale-modal__body sale-modal__body--pos">
          <aside class="pos-context">
            <div class="pos-context__head"><h3>${saleUi.channel === "Local" ? "Mesa" : "Delivery"}</h3></div>
            ${saleUi.channel === "Local" ? `
              <label class="sale-field"><span>Salon / espacio</span>
                <select data-area>${areas.map((area) => `<option value="${escapeHtml(area)}" ${area === saleUi.area ? "selected" : ""}>${escapeHtml(area)}</option>`).join("")}</select>
              </label>
              <div class="pos-table-picker">
                ${areaTables.map((item) => `<button class="pos-table-choice ${item.id === saleUi.tableId ? "is-selected" : ""} ${item.status === "Reservada" ? "is-reserved" : ""}" type="button" data-select-table="${item.id}"><strong>${escapeHtml(item.name.replace("Mesa ", ""))}</strong><small>${escapeHtml(item.status)}</small></button>`).join("")}
              </div>
            ` : `<div class="delivery-card"><strong>Venta delivery</strong><span>Se enviara a la cola de produccion sin ocupar una mesa.</span></div>`}
            ${selectedCustomerCard()}
          </aside>

          <section class="pos-products">
            <div class="pos-products__top">
              <div><h3>Carta</h3><span class="muted">Productos reales de Cafe Fusiones</span></div>
              <input class="input" type="search" placeholder="Buscar producto" value="${escapeHtml(saleUi.productSearch)}" data-product-search>
            </div>
            ${categoryTabs()}
            <div class="product-picker product-picker--v4">
              ${filteredProducts().map(productButton).join("") || emptyState("No encontramos productos.")}
            </div>
          </section>

          <aside class="pos-ticket">
            <div class="pos-ticket__head">
              <div><h3>Pedido</h3><span>${escapeHtml(table?.name || (saleUi.channel === "Delivery" ? "Delivery" : "Nueva venta"))}</span></div>
              ${saleUi.cart.length ? `<button class="mini-button" type="button" data-clear-cart>Limpiar</button>` : ""}
            </div>
            ${existing.length ? `<div class="existing-order"><span>Ya solicitado</span><strong>${existing.reduce((sum, item) => sum + Number(item.qty || 0), 0)} items · ${money(tableTotal(table))}</strong></div>` : ""}
            <div class="cart-list cart-scroll cart-list--v4">
              ${saleUi.cart.map(cartItem).join("") || `<div class="empty-cart"><span>☕</span><strong>Pedido vacio</strong><p>Selecciona productos de la carta.</p></div>`}
            </div>
            ${cartSummary()}
            <button class="button button--primary button--block" type="button" data-send-order ${saleUi.cart.length ? "" : "disabled"}>
              ${icon("receipt")}<span>${saleUi.mode === "add" ? "Enviar productos" : "Enviar pedido"}</span>
            </button>
          </aside>
        </div>`}
    </section>`;

  wireSaleModal(openModal(html));
}

function selectedCustomerCard() {
  const customer = customerById(saleUi.customerId);
  if (!customer) return `<div class="customer-mini customer-mini--empty"><span>Cliente</span><strong>Consumidor final</strong><small>La venta tambien puede realizarse sin registro.</small></div>`;
  return `<div class="customer-mini"><span>Cliente frecuente</span><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.level || "Cliente")} · ${Number(customer.points || 0)} puntos · ${Number(customer.visits || 0)} visitas</small></div>`;
}

function categoryTabs() {
  return `<div class="category-strip" role="tablist" aria-label="Categorias">
    ${state.menuCategories.map((category) => `<button type="button" class="${category === saleUi.category ? "is-active" : ""}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}
  </div>`;
}

function filteredProducts() {
  return state.menuItems.filter((item) => {
    const categoryMatches = saleUi.category === "Todos" || item.category === saleUi.category;
    return categoryMatches && matchesSearch(saleUi.productSearch, item.name, item.category, item.description, item.station);
  });
}

function productButton(item) {
  const hasModifiers = Array.isArray(item.modifiers) && item.modifiers.length > 0;
  const soldOut = Number(item.stock) === 0;
  return `<button class="product-line product-line--v4 ${soldOut ? "is-disabled" : ""}" type="button" data-add-item="${item.id}" ${soldOut ? "disabled" : ""}>
    <span class="product-line__icon">${productEmoji(item.category)}</span>
    <span class="product-line__copy">
      <strong>${escapeHtml(item.name)}</strong>
      <small>${escapeHtml(item.station || "Produccion")} · ${Number(item.estimatedTime || 0)} min${hasModifiers ? " · Personalizable" : ""}</small>
    </span>
    <b>${money(item.price)}</b>
  </button>`;
}

function productEmoji(category) {
  if (String(category).toLowerCase().includes("cafe") || String(category).toLowerCase().includes("metodo")) return "☕";
  if (String(category).toLowerCase().includes("desay")) return "🍳";
  if (String(category).toLowerCase().includes("sand")) return "🥪";
  if (String(category).toLowerCase().includes("post")) return "🍰";
  if (String(category).toLowerCase().includes("coct")) return "🍹";
  if (String(category).toLowerCase().includes("jugo")) return "🥤";
  return "🍽️";
}

function cartItem(item) {
  const detail = [...(item.modifiers || []), item.note].filter(Boolean).join(" · ");
  return `<article class="cart-item cart-item--v4">
    <div class="cart-item__top">
      <div class="cart-item__copy"><strong>${escapeHtml(item.name)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ""}<span>${money(item.price)} c/u</span></div>
      <button class="cart-delete" type="button" data-del-cart="${item.lineId}" aria-label="Eliminar ${escapeHtml(item.name)}">×</button>
    </div>
    <div class="cart-item__bottom">
      <div class="qty-control"><button type="button" data-qty="${item.lineId}" data-delta="-1">−</button><span>${item.qty}</span><button type="button" data-qty="${item.lineId}" data-delta="1">+</button></div>
      <strong>${money(item.price * item.qty)}</strong>
    </div>
  </article>`;
}

function cartSummary() {
  const subtotal = saleUi.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const igv = subtotal * IGV_RATE;
  const total = subtotal + igv;
  return `<div class="ticket-summary">
    <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
    <div><span>IGV 18%</span><strong>${money(igv)}</strong></div>
    <div class="ticket-summary__total"><span>Total nuevo</span><strong>${money(total)}</strong></div>
  </div>`;
}

function modifierConfigurator() {
  const product = state.menuItems.find((item) => item.id === saleUi.configuringId);
  if (!product) return "";
  const groups = product.modifiers || [];
  const selectedPrice = modifierExtraPrice(product);

  return `
    <div class="modifier-screen">
      <div class="modifier-screen__product">
        <button class="mini-button" type="button" data-config-back>← Volver a la carta</button>
        <span class="modifier-product-icon">${productEmoji(product.category)}</span>
        <p class="eyebrow">Personalizar</p>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.description || "")}</p>
        <strong>${money(product.price + selectedPrice)}</strong>
      </div>
      <div class="modifier-screen__options">
        ${groups.map(modifierGroup).join("")}
        <label class="modifier-note"><span>Notas para ${escapeHtml(product.station || "produccion")}</span><textarea data-config-note placeholder="Ej. sin azucar, poco hielo...">${escapeHtml(saleUi.configNote)}</textarea></label>
      </div>
      <div class="modifier-screen__action">
        <div><span>Total producto</span><strong>${money(product.price + selectedPrice)}</strong></div>
        <button class="button button--primary" type="button" data-config-add>Agregar al pedido</button>
      </div>
    </div>`;
}

function modifierGroup(group) {
  const selected = saleUi.configSelections[group.id];
  return `<fieldset class="modifier-group">
    <legend>${escapeHtml(group.label)}${group.required ? " *" : ""}</legend>
    <div class="modifier-options">
      ${(group.options || []).map((option) => {
        const checked = group.multiple ? Array.isArray(selected) && selected.includes(option.id) : selected === option.id;
        const type = group.multiple ? "checkbox" : "radio";
        return `<label class="modifier-option ${checked ? "is-selected" : ""}">
          <input type="${type}" name="modifier-${escapeHtml(group.id)}" value="${escapeHtml(option.id)}" data-modifier-group="${escapeHtml(group.id)}" data-modifier-multiple="${group.multiple ? "1" : "0"}" ${checked ? "checked" : ""}>
          <span>${escapeHtml(option.label)}</span><b>${Number(option.price || 0) ? `+ ${money(option.price)}` : "Incluido"}</b>
        </label>`;
      }).join("")}
    </div>
  </fieldset>`;
}

function modifierExtraPrice(product) {
  let extra = 0;
  (product.modifiers || []).forEach((group) => {
    const selected = saleUi.configSelections[group.id];
    const ids = Array.isArray(selected) ? selected : selected ? [selected] : [];
    ids.forEach((id) => {
      const option = (group.options || []).find((item) => item.id === id);
      extra += Number(option?.price || 0);
    });
  });
  return extra;
}

function modifierLabels(product) {
  const labels = [];
  (product.modifiers || []).forEach((group) => {
    const selected = saleUi.configSelections[group.id];
    const ids = Array.isArray(selected) ? selected : selected ? [selected] : [];
    ids.forEach((id) => {
      const option = (group.options || []).find((item) => item.id === id);
      if (option) labels.push(option.label);
    });
  });
  return labels;
}

function wireSaleModal(backdrop) {
  backdrop.querySelectorAll("[data-channel]").forEach((button) => button.addEventListener("click", () => {
    saleUi.channel = button.dataset.channel;
    if (saleUi.channel === "Delivery") {
      saleUi.tableId = state.tables.find((table) => table.seats === 0)?.id || null;
      saleUi.area = "Delivery";
    } else {
      const first = state.tables.find((table) => table.seats > 0 && table.status === "Libre") || state.tables.find((table) => table.seats > 0);
      saleUi.tableId = first?.id || null;
      saleUi.area = first?.area || firstLocalArea();
    }
    renderSaleModal();
  }));

  backdrop.querySelector("[data-customer-select]")?.addEventListener("change", (event) => {
    saleUi.customerId = event.target.value;
    renderSaleModal();
  });

  backdrop.querySelector("[data-people]")?.addEventListener("change", (event) => {
    saleUi.people = Math.max(1, Number(event.target.value || 1));
  });

  backdrop.querySelector("[data-area]")?.addEventListener("change", (event) => {
    saleUi.area = event.target.value;
    const first = state.tables.find((table) => table.seats > 0 && table.area === saleUi.area && table.status === "Libre") || state.tables.find((table) => table.seats > 0 && table.area === saleUi.area);
    saleUi.tableId = first?.id || null;
    renderSaleModal();
  });

  backdrop.querySelectorAll("[data-select-table]").forEach((button) => button.addEventListener("click", () => {
    saleUi.tableId = button.dataset.selectTable;
    const table = state.tables.find((item) => item.id === saleUi.tableId);
    saleUi.customerId = table?.customerId || saleUi.customerId;
    renderSaleModal();
  }));

  backdrop.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    saleUi.category = button.dataset.category;
    renderSaleModal();
  }));

  backdrop.querySelector("[data-product-search]")?.addEventListener("input", (event) => {
    saleUi.productSearch = event.target.value;
    // No re-render en cada tecla: filtramos directamente para mantener foco.
    const picker = backdrop.querySelector(".product-picker--v4");
    if (picker) picker.innerHTML = filteredProducts().map(productButton).join("") || emptyState("No encontramos productos.");
    wireProductButtons(backdrop);
  });

  wireProductButtons(backdrop);

  backdrop.querySelectorAll("[data-qty]").forEach((button) => button.addEventListener("click", () => {
    const item = saleUi.cart.find((line) => line.lineId === button.dataset.qty);
    if (!item) return;
    item.qty += Number(button.dataset.delta || 0);
    if (item.qty <= 0) saleUi.cart = saleUi.cart.filter((line) => line.lineId !== item.lineId);
    renderSaleModal();
  }));

  backdrop.querySelectorAll("[data-del-cart]").forEach((button) => button.addEventListener("click", () => {
    saleUi.cart = saleUi.cart.filter((line) => line.lineId !== button.dataset.delCart);
    renderSaleModal();
  }));

  backdrop.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
    saleUi.cart = [];
    renderSaleModal();
  });

  backdrop.querySelector("[data-send-order]")?.addEventListener("click", sendOrder);

  backdrop.querySelector("[data-config-back]")?.addEventListener("click", () => {
    saleUi.configuringId = null;
    saleUi.configSelections = {};
    saleUi.configNote = "";
    renderSaleModal();
  });

  backdrop.querySelectorAll("[data-modifier-group]").forEach((input) => input.addEventListener("change", () => {
    const groupId = input.dataset.modifierGroup;
    const multiple = input.dataset.modifierMultiple === "1";
    if (multiple) {
      const values = [...backdrop.querySelectorAll(`[data-modifier-group="${cssSafe(groupId)}"]:checked`)].map((node) => node.value);
      saleUi.configSelections[groupId] = values;
    } else {
      saleUi.configSelections[groupId] = input.value;
    }
    saleUi.configNote = backdrop.querySelector("[data-config-note]")?.value || saleUi.configNote;
    renderSaleModal();
  }));

  backdrop.querySelector("[data-config-note]")?.addEventListener("input", (event) => {
    saleUi.configNote = event.target.value;
  });

  backdrop.querySelector("[data-config-add]")?.addEventListener("click", addConfiguredProduct);
}

function wireProductButtons(backdrop) {
  backdrop.querySelectorAll("[data-add-item]").forEach((button) => {
    if (button.dataset.wired === "1") return;
    button.dataset.wired = "1";
    button.addEventListener("click", () => selectProduct(button.dataset.addItem));
  });
}

function selectProduct(productId) {
  const product = state.menuItems.find((item) => item.id === productId);
  if (!product) return;

  if (Array.isArray(product.modifiers) && product.modifiers.length) {
    saleUi.configuringId = product.id;
    saleUi.configSelections = {};
    saleUi.configNote = "";
    renderSaleModal();
    return;
  }

  addLineToCart(product, [], "", Number(product.price || 0));
  renderSaleModal();
}

function addConfiguredProduct() {
  const product = state.menuItems.find((item) => item.id === saleUi.configuringId);
  if (!product) return;

  const missing = (product.modifiers || []).find((group) => group.required && !saleUi.configSelections[group.id]);
  if (missing) {
    showToast(`Selecciona ${missing.label.toLowerCase()}.`);
    return;
  }

  const labels = modifierLabels(product);
  const price = Number(product.price || 0) + modifierExtraPrice(product);
  addLineToCart(product, labels, saleUi.configNote.trim(), price);
  saleUi.configuringId = null;
  saleUi.configSelections = {};
  saleUi.configNote = "";
  renderSaleModal();
}

function addLineToCart(product, modifiers, note, price) {
  const key = `${product.id}|${modifiers.join("|")}|${note}`;
  const existing = saleUi.cart.find((item) => item.key === key);
  if (existing) {
    existing.qty += 1;
    return;
  }

  saleUi.cart.push({
    lineId: `LINE-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    key,
    id: product.id,
    productId: product.id,
    name: product.name,
    price,
    basePrice: Number(product.price || 0),
    qty: 1,
    station: product.station || "Cocina",
    estimatedTime: Number(product.estimatedTime || 0),
    modifiers: [...modifiers],
    note
  });
}

function sendOrder() {
  if (!saleUi.cart.length) {
    showToast("Agrega al menos un producto.");
    return;
  }

  let table = state.tables.find((item) => item.id === saleUi.tableId);
  if (saleUi.channel === "Delivery") {
    table = state.tables.find((item) => item.seats === 0) || table;
  }
  if (!table) {
    showToast("Selecciona una mesa.");
    return;
  }

  const now = new Date().toISOString();
  const orderId = nextId(state, "order", "ORD", 4);
  const newLines = saleUi.cart.map((item) => ({
    id: item.productId,
    lineId: item.lineId,
    name: item.name,
    price: item.price,
    qty: item.qty,
    station: item.station,
    estimatedTime: item.estimatedTime,
    modifiers: [...item.modifiers],
    note: item.note || "",
    orderId,
    productionStatus: "Nuevo"
  }));

  table.items ||= [];
  table.items.push(...newLines);
  table.status = "Ocupada";
  table.openedAt ||= now;
  table.customerId = saleUi.customerId || table.customerId || null;
  table.people = saleUi.channel === "Local" ? saleUi.people : null;

  state.kitchenOrders.push({
    id: orderId,
    tableId: saleUi.channel === "Local" ? table.id : null,
    table: saleUi.channel === "Local" ? table.name : "Delivery",
    customerId: saleUi.customerId || null,
    channel: saleUi.channel,
    status: "Nuevo",
    createdAt: now,
    elapsed: 0,
    items: newLines.map((line) => ({
      id: line.id,
      lineId: line.lineId,
      name: line.name,
      qty: line.qty,
      station: line.station,
      estimatedTime: line.estimatedTime,
      modifiers: [...line.modifiers],
      note: line.note,
      price: line.price,
      status: "Nuevo"
    })),
    notes: "",
    user: session.name
  });

  addAuditEvent(state, {
    user: session.name,
    action: saleUi.mode === "add" ? "Productos agregados" : "Pedido creado",
    module: "Ventas",
    detail: `${orderId} · ${saleUi.channel === "Local" ? table.name : "Delivery"} · ${saleUi.cart.length} lineas`
  });

  saveState(state);
  closeModal();
  showToast(`${orderId} enviado a produccion.`);
  render();
}

/* ========================================================================== */
/* PEDIDOS ACTIVOS                                                            */
/* ========================================================================== */

function ordersSection() {
  const statuses = ["Todos", "Nuevo", "Preparando", "Listo", "Entregado"];
  const orders = [...state.kitchenOrders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .filter((order) => (ui.orderStatus === "Todos" || order.status === ui.orderStatus) && matchesSearch(ui.search, order.id, order.table, order.channel, customerById(order.customerId)?.name, ...(order.items || []).map((item) => item.name)));

  return `<section class="panel orders-panel">
    <div class="panel__header panel__header--wrap">
      <div><p class="eyebrow">Seguimiento</p><h2>Pedidos</h2><p class="muted">El mozo puede revisar el estado sin entrar a la pantalla de produccion.</p></div>
      <div class="segmented segmented--compact">${statuses.map((status) => `<button type="button" class="${ui.orderStatus === status ? "is-active" : ""}" data-order-status="${status}">${status}</button>`).join("")}</div>
    </div>
    <div class="orders-list">
      ${orders.map(orderRow).join("") || emptyState("No hay pedidos con este filtro.")}
    </div>
  </section>`;
}

function orderRow(order) {
  const customer = customerById(order.customerId);
  const elapsed = elapsedMinutes(order);
  const delayed = elapsed >= 10 && !["Listo", "Entregado"].includes(order.status);
  const items = order.items || [];
  return `<article class="order-row ${delayed ? "is-delayed" : ""}">
    <div class="order-row__main">
      <div class="order-row__id"><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.table || order.channel)}</span></div>
      <div class="order-row__copy"><strong>${items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} productos</strong><span>${escapeHtml(items.slice(0, 3).map((item) => item.name).join(" · "))}${items.length > 3 ? "…" : ""}</span>${customer ? `<small>${escapeHtml(customer.name)} · ${escapeHtml(customer.level || "Cliente")}</small>` : ""}</div>
      <div class="order-row__time"><strong>${elapsed} min</strong><span>${delayed ? "Atencion requerida" : "Tiempo transcurrido"}</span></div>
      <span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span>
    </div>
    <div class="order-row__actions">
      <button class="mini-button" type="button" data-order-detail="${order.id}">Ver detalle</button>
      ${order.tableId ? `<button class="mini-button" type="button" data-order-table="${order.tableId}">Abrir mesa</button>` : ""}
      ${order.status === "Listo" ? `<button class="mini-button mini-button--primary" type="button" data-order-deliver="${order.id}">Marcar entregado</button>` : ""}
    </div>
  </article>`;
}

function wireOrders() {
  view.querySelectorAll("[data-order-status]").forEach((button) => button.addEventListener("click", () => {
    ui.orderStatus = button.dataset.orderStatus;
    render();
  }));
  view.querySelectorAll("[data-order-detail]").forEach((button) => button.addEventListener("click", () => openOrderDetail(button.dataset.orderDetail)));
  view.querySelectorAll("[data-order-table]").forEach((button) => button.addEventListener("click", () => openTablePanel(button.dataset.orderTable)));
  view.querySelectorAll("[data-order-deliver]").forEach((button) => button.addEventListener("click", () => {
    markOrderDelivered(button.dataset.orderDeliver);
    render();
  }));
}

function openOrderDetail(orderId) {
  const order = state.kitchenOrders.find((item) => item.id === orderId);
  if (!order) return;
  const customer = customerById(order.customerId);
  const html = `<section class="modal order-detail-modal" role="dialog" aria-modal="true">
    <div class="modal__header"><div><p class="eyebrow">Pedido</p><h2>${escapeHtml(order.id)} · ${escapeHtml(order.table || order.channel)}</h2></div><button class="icon-button" type="button" data-close-modal>${closeIcon}</button></div>
    <div class="order-detail-body">
      <div class="order-detail-meta"><span class="${statusClass(order.status)}">${escapeHtml(order.status)}</span><span>${elapsedMinutes(order)} min</span>${customer ? `<span>${escapeHtml(customer.name)}</span>` : ""}</div>
      ${(order.items || []).map((item) => `<article class="order-detail-item"><div><strong>${item.qty}× ${escapeHtml(item.name)}</strong><small>${escapeHtml(item.station || "Produccion")}${item.modifiers?.length ? ` · ${escapeHtml(item.modifiers.join(" · "))}` : ""}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</small></div><span class="${statusClass(item.status || order.status)}">${escapeHtml(item.status || order.status)}</span></article>`).join("")}
    </div>
  </section>`;
  openModal(html);
}

function markOrderDelivered(orderId) {
  const order = state.kitchenOrders.find((item) => item.id === orderId);
  if (!order) return;
  order.items.forEach((item) => { item.status = "Entregado"; });
  order.status = "Entregado";
  order.deliveredAt = new Date().toISOString();
  saveState(state);
  showToast(`${order.id} marcado como entregado.`);
}

/* ========================================================================== */
/* KDS - BARRA / COCINA                                                       */
/* ========================================================================== */

function kdsSection() {
  const stations = ["Todos", ...new Set(state.stations?.map((station) => station.name) || ["Barra", "Cocina"])]
    .filter((station, index, list) => station && list.indexOf(station) === index)
    .filter((station) => station !== "Despacho" || stationPending("Despacho") > 0);
  const statuses = ["Todos", "Nuevo", "Preparando", "Listo"];

  return `<section class="panel kds-panel">
    <div class="panel__header panel__header--wrap">
      <div><p class="eyebrow">Kitchen Display System</p><h2>Produccion</h2><p class="muted">Barra y cocina reciben solamente los productos asignados a su estacion.</p></div>
      <div class="kds-live"><i></i><span>Operacion en vivo</span></div>
    </div>
    <div class="kds-controls">
      <div class="segmented">${stations.map((station) => `<button type="button" class="${ui.kdsStation === station ? "is-active" : ""}" data-kds-station="${escapeHtml(station)}">${escapeHtml(station)}</button>`).join("")}</div>
      <div class="segmented segmented--compact">${statuses.map((status) => `<button type="button" class="${ui.kdsStatus === status ? "is-active" : ""}" data-kds-status="${status}">${status}</button>`).join("")}</div>
    </div>
    <div class="kds-board">
      ${["Nuevo", "Preparando", "Listo"].map((status) => kdsColumn(status)).join("")}
    </div>
  </section>`;
}

function kdsColumn(status) {
  if (ui.kdsStatus !== "Todos" && ui.kdsStatus !== status) return "";
  const cards = kdsCards(status);
  return `<section class="kds-column kds-column--${status.toLowerCase()}">
    <header><span>${status}</span><b>${cards.length}</b></header>
    <div class="kds-column__cards">${cards.map(kdsCard).join("") || `<p class="kds-empty">Sin pedidos</p>`}</div>
  </section>`;
}

function kdsCards(status) {
  const result = [];
  state.kitchenOrders.forEach((order) => {
    if (order.status === "Entregado") return;
    const items = (order.items || []).filter((item) => {
      const itemStatus = item.status || normalizeProductionStatus(order.status);
      return itemStatus === status && (ui.kdsStation === "Todos" || item.station === ui.kdsStation);
    });
    if (!items.length) return;
    if (!matchesSearch(ui.search, order.id, order.table, order.channel, ...items.map((item) => item.name))) return;
    result.push({ order, items, station: ui.kdsStation === "Todos" ? null : ui.kdsStation });
  });
  return result.sort((a, b) => new Date(a.order.createdAt || 0) - new Date(b.order.createdAt || 0));
}

function kdsCard(payload) {
  const { order, items } = payload;
  const elapsed = elapsedMinutes(order);
  const target = Math.max(...items.map((item) => Number(item.estimatedTime || 8)), 8);
  const delayed = elapsed > target;
  const currentStatus = items[0]?.status || "Nuevo";
  const stations = [...new Set(items.map((item) => item.station))].join(" / ");

  return `<article class="kds-card ${delayed && currentStatus !== "Listo" ? "is-delayed" : ""}">
    <div class="kds-card__head">
      <div><strong>${escapeHtml(order.table || order.channel)}</strong><span>${escapeHtml(order.id)}</span></div>
      <div class="kds-timer ${delayed ? "is-delayed" : ""}"><strong>${elapsed}</strong><span>min</span></div>
    </div>
    <div class="kds-card__station">${escapeHtml(stations)}</div>
    <div class="kds-card__items">
      ${items.map((item) => `<div><strong>${item.qty}× ${escapeHtml(item.name)}</strong>${item.modifiers?.length ? `<small>${escapeHtml(item.modifiers.join(" · "))}</small>` : ""}${item.note ? `<small class="is-note">${escapeHtml(item.note)}</small>` : ""}</div>`).join("")}
    </div>
    ${currentStatus === "Nuevo" ? `<button class="button button--secondary button--block" type="button" data-kds-action="start" data-kds-order="${order.id}" data-kds-station-target="${escapeHtml(ui.kdsStation)}">Iniciar preparacion</button>` : ""}
    ${currentStatus === "Preparando" ? `<button class="button button--primary button--block" type="button" data-kds-action="ready" data-kds-order="${order.id}" data-kds-station-target="${escapeHtml(ui.kdsStation)}">Marcar listo</button>` : ""}
    ${currentStatus === "Listo" ? `<div class="kds-ready-message">✓ Listo para entregar</div>` : ""}
  </article>`;
}

function wireKds() {
  view.querySelectorAll("[data-kds-station]").forEach((button) => button.addEventListener("click", () => {
    ui.kdsStation = button.dataset.kdsStation;
    render();
  }));
  view.querySelectorAll("[data-kds-status]").forEach((button) => button.addEventListener("click", () => {
    ui.kdsStatus = button.dataset.kdsStatus;
    render();
  }));
  view.querySelectorAll("[data-kds-action]").forEach((button) => button.addEventListener("click", () => {
    updateKdsItems(button.dataset.kdsOrder, button.dataset.kdsStationTarget, button.dataset.kdsAction);
  }));
}

function updateKdsItems(orderId, stationTarget, action) {
  const order = state.kitchenOrders.find((item) => item.id === orderId);
  if (!order) return;
  const from = action === "start" ? "Nuevo" : "Preparando";
  const to = action === "start" ? "Preparando" : "Listo";

  order.items.forEach((item) => {
    const stationMatches = stationTarget === "Todos" || item.station === stationTarget;
    if (stationMatches && (item.status || "Nuevo") === from) item.status = to;
  });
  order.status = deriveOrderStatus(order);
  if (to === "Listo" && order.status === "Listo") order.readyAt = new Date().toISOString();
  saveState(state);
  showToast(to === "Preparando" ? `${order.id}: preparacion iniciada.` : `${order.id}: producto listo.`);
  render();
}

function deriveOrderStatus(order) {
  const statuses = (order.items || []).map((item) => item.status || normalizeProductionStatus(order.status));
  if (!statuses.length) return order.status || "Nuevo";
  if (statuses.every((status) => status === "Entregado")) return "Entregado";
  if (statuses.every((status) => ["Listo", "Entregado"].includes(status))) return "Listo";
  if (statuses.some((status) => status === "Preparando" || status === "Listo")) return "Preparando";
  return "Nuevo";
}

/* ========================================================================== */
/* HISTORIAL                                                                  */
/* ========================================================================== */

function historySection() {
  const rows = [...state.salesHistory]
    .sort((a, b) => new Date(b.closedAt || b.at || 0) - new Date(a.closedAt || a.at || 0))
    .filter((sale) => matchesSearch(ui.search, sale.id, sale.table, sale.channel, sale.customerName, sale.method, sale.invoiceType));

  return `<section class="panel history-panel">
    <div class="panel__header panel__header--wrap">
      <div><p class="eyebrow">Ventas cerradas</p><h2>Historial</h2><p class="muted">Consulta las ventas procesadas durante la demostracion.</p></div>
      <span class="status status--info">${rows.length} registros</span>
    </div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>Venta</th><th>Fecha</th><th>Mesa / Canal</th><th>Cliente</th><th>Pago</th><th>Total</th><th></th></tr></thead>
      <tbody>${rows.map((sale) => `<tr><td><strong>${escapeHtml(sale.id)}</strong></td><td>${formatDateTime(sale.closedAt || sale.at)}</td><td>${escapeHtml(sale.table || sale.channel || "Local")}</td><td>${escapeHtml(sale.customerName || "Consumidor final")}</td><td>${escapeHtml(sale.method || "-")}<br><span class="muted">${escapeHtml(sale.invoiceType || "")}</span></td><td><strong>${money(sale.total)}</strong></td><td><button class="mini-button" type="button" data-history-detail="${sale.id}">Ver</button></td></tr>`).join("") || `<tr><td colspan="7">${emptyState("Aun no se han cerrado ventas en esta sesion.")}</td></tr>`}</tbody>
    </table></div>
  </section>`;
}

function wireHistory() {
  view.querySelectorAll("[data-history-detail]").forEach((button) => button.addEventListener("click", () => openHistoryDetail(button.dataset.historyDetail)));
}

function openHistoryDetail(saleId) {
  const sale = state.salesHistory.find((item) => item.id === saleId);
  if (!sale) return;
  const html = `<section class="modal order-detail-modal" role="dialog" aria-modal="true">
    <div class="modal__header"><div><p class="eyebrow">Venta cerrada</p><h2>${escapeHtml(sale.id)}</h2></div><button class="icon-button" type="button" data-close-modal>${closeIcon}</button></div>
    <div class="order-detail-body">
      <div class="order-detail-meta"><span>${formatDateTime(sale.closedAt || sale.at)}</span><span>${escapeHtml(sale.table || sale.channel || "Local")}</span><span>${escapeHtml(sale.customerName || "Consumidor final")}</span></div>
      ${(sale.items || []).map((item) => `<article class="order-detail-item"><div><strong>${item.qty}× ${escapeHtml(item.name)}</strong>${item.modifiers?.length ? `<small>${escapeHtml(item.modifiers.join(" · "))}</small>` : ""}</div><strong>${money(item.price * item.qty)}</strong></article>`).join("")}
      <div class="summary-row summary-row--total"><span>Total</span><strong>${money(sale.total)}</strong></div>
    </div>
  </section>`;
  openModal(html);
}

/* ========================================================================== */
/* COBRO / PRECUENTA / FIDELIZACION                                           */
/* ========================================================================== */

function openPrecuenta(tableId) {
  payUi.posPrompt = false;
  payUi.anulando = null;
  const table = state.tables.find((item) => item.id === tableId);
  if (!table || !table.items?.length) {
    showToast("La mesa no tiene productos por cobrar.");
    return;
  }
  renderPrecuenta(table);
}

function renderPrecuenta(table) {
  const sub = tableSubtotal(table);
  const igv = sub * IGV_RATE;
  const total = tableTotal(table);
  const customer = customerById(table.customerId);
  const estimatedPoints = customer && state.settings?.loyaltyEnabled !== false ? Math.floor(total * Number(state.loyaltyConfig?.pointsPerSol || 1)) : 0;

  const rows = table.items.map((item) => {
    const detail = [...(item.modifiers || []), item.note].filter(Boolean).join(" · ");
    const anulForm = payUi.anulando === item.lineId || payUi.anulando === item.id
      ? `<div class="void-inline"><input data-anular-motivo placeholder="Motivo de anulacion"><input type="password" data-anular-pass placeholder="Clave de administrador"><button class="mini-button mini-button--danger" type="button" data-anular-confirm="${item.lineId || item.id}">Confirmar</button><button class="mini-button" type="button" data-anular-cancel>Cancelar</button></div>`
      : "";
    return `<tr><td><strong>${escapeHtml(item.name)}</strong>${detail ? `<br><span class="muted">${escapeHtml(detail)}</span>` : ""}${anulForm}</td><td>${item.qty}</td><td>${money(item.price * item.qty)}</td><td><button class="mini-button mini-button--danger" type="button" data-anular="${item.lineId || item.id}">Anular</button></td></tr>`;
  }).join("");

  const posBlock = payUi.posPrompt ? `<div class="pos-prompt"><label class="sale-field"><span>Codigo de operacion POS</span><input data-pos-code placeholder="Ej. 004521"></label><button class="button button--primary button--block" type="button" data-pos-confirm>Confirmar pago POS</button></div>` : "";

  const html = `<section class="modal precuenta-modal" role="dialog" aria-modal="true" aria-labelledby="pc-title">
    <div class="modal__header"><div><p class="eyebrow">Cobro</p><h2 id="pc-title">${escapeHtml(table.name)}</h2></div><button class="icon-button" type="button" data-close-modal>${closeIcon}</button></div>
    <div class="precuenta-body">
      ${customer ? `<div class="checkout-customer"><div><span>Cliente</span><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.level || "Cliente")} · ${Number(customer.points || 0)} puntos actuales</small></div><div><span>Esta compra</span><strong>+${estimatedPoints} pts</strong><small>Estimado segun configuracion</small></div></div>` : `<div class="checkout-customer"><div><span>Cliente</span><strong>Consumidor final</strong><small>Sin acumulacion de puntos.</small></div></div>`}
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Importe</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="summary-row"><span>Subtotal</span><strong>${money(sub)}</strong></div>
      <div class="summary-row"><span>IGV 18%</span><strong>${money(igv)}</strong></div>
      <div class="summary-row summary-row--total"><span>Total a cobrar</span><strong>${money(total)}</strong></div>
      <label class="sale-field"><span>Comprobante</span><select data-invoice-type><option ${payUi.invoiceType === "Boleta" ? "selected" : ""}>Boleta</option><option ${payUi.invoiceType === "Factura" ? "selected" : ""}>Factura</option></select></label>
      <div class="precuenta-actions"><button class="button button--secondary" type="button" data-emit-precuenta>Emitir precuenta</button><button class="button button--secondary" type="button" data-emit-comprobante>Comprobante SUNAT</button><button class="button button--primary" type="button" data-pay-cash>Efectivo</button><button class="button button--primary" type="button" data-pay-pos>POS</button></div>
      ${posBlock}
    </div>
  </section>`;

  const backdrop = openModal(html);
  wirePrecuenta(backdrop, table, total);
}

function wirePrecuenta(backdrop, table, total) {
  backdrop.querySelector("[data-invoice-type]")?.addEventListener("change", (event) => { payUi.invoiceType = event.target.value; });

  backdrop.addEventListener("click", (event) => {
    const voidButton = event.target.closest("[data-anular]");
    if (voidButton) {
      payUi.anulando = voidButton.dataset.anular;
      renderPrecuenta(table);
      return;
    }
    if (event.target.closest("[data-anular-cancel]")) {
      payUi.anulando = null;
      renderPrecuenta(table);
      return;
    }
    const confirmVoid = event.target.closest("[data-anular-confirm]");
    if (confirmVoid) {
      voidSaleItem(table, confirmVoid.dataset.anularConfirm);
      return;
    }
    if (event.target.closest("[data-emit-precuenta]")) {
      emitPrecuenta(table);
      return;
    }
    if (event.target.closest("[data-emit-comprobante]")) {
      showToast(`${payUi.invoiceType} electronica SUNAT emitida (simulado).`);
      return;
    }
    if (event.target.closest("[data-pay-cash]")) {
      finalizeSale(table, total, "Efectivo", null);
      return;
    }
    if (event.target.closest("[data-pay-pos]")) {
      payUi.posPrompt = true;
      renderPrecuenta(table);
      return;
    }
    if (event.target.closest("[data-pos-confirm]")) {
      const code = backdrop.querySelector("[data-pos-code]")?.value.trim();
      if (!code) {
        showToast("Ingresa el codigo de operacion del POS.");
        return;
      }
      finalizeSale(table, total, "POS", code);
    }
  });
}

function voidSaleItem(table, itemKey) {
  const backdrop = document.querySelector(".modal-backdrop[data-modal-root]");
  const reason = backdrop?.querySelector("[data-anular-motivo]")?.value.trim();
  const password = backdrop?.querySelector("[data-anular-pass]")?.value;
  if (!reason) {
    showToast("Ingresa el motivo de anulacion.");
    return;
  }
  if (password !== demoUser.password) {
    showToast("Clave de administrador incorrecta.");
    return;
  }

  const item = table.items.find((line) => (line.lineId || line.id) === itemKey);
  if (!item) return;
  state.cashBox ||= { open: false, movements: [], voids: [] };
  state.cashBox.voids ||= [];
  state.cashBox.voids.push({ item: item.name, qty: item.qty, reason, table: table.name, user: session.name, at: new Date().toISOString() });
  table.items = table.items.filter((line) => (line.lineId || line.id) !== itemKey);

  state.kitchenOrders.forEach((order) => {
    if (order.tableId !== table.id) return;
    order.items = (order.items || []).filter((line) => (line.lineId || line.id) !== itemKey);
    order.status = deriveOrderStatus(order);
  });

  if (!table.items.length) {
    table.status = "Libre";
    table.customerId = null;
    table.openedAt = null;
  }
  payUi.anulando = null;
  saveState(state);
  showToast("Producto anulado y registrado en auditoria.");
  if (table.items.length) renderPrecuenta(table);
  else {
    closeModal();
    render();
  }
}

function emitPrecuenta(table) {
  const detailLines = table.items.flatMap((item) => {
    const detail = [...(item.modifiers || []), item.note].filter(Boolean).join(" / ");
    return [`${item.qty} x ${item.name}  ${money(item.price * item.qty)}`, ...(detail ? [`  ${detail}`] : [])];
  });
  const lines = [
    "Cafe Fusiones - Precuenta",
    `Mesa: ${table.name}`,
    `Fecha: ${new Date().toLocaleString("es-PE")}`,
    "",
    ...detailLines,
    "",
    `Subtotal: ${money(tableSubtotal(table))}`,
    `IGV 18%: ${money(tableSubtotal(table) * IGV_RATE)}`,
    `TOTAL: ${money(tableTotal(table))}`,
    "",
    "Documento no valido como comprobante de pago."
  ];
  downloadBlob(buildSimplePdf(lines), `Precuenta_${table.name.replace(/\s+/g, "_")}.pdf`, "application/pdf");
  showToast("Precuenta emitida.");
}

function finalizeSale(table, total, method, opCode) {
  if (!state.cashBox?.open) {
    showToast("Abre la caja desde el modulo Caja antes de cobrar.");
    return;
  }

  const customer = customerById(table.customerId);
  const saleId = nextId(state, "sale", "V", 4);
  const now = new Date().toISOString();
  const itemsSnapshot = table.items.map((item) => ({
    id: item.id,
    name: item.name,
    qty: item.qty,
    price: item.price,
    modifiers: [...(item.modifiers || [])],
    note: item.note || ""
  }));

  state.cashBox.movements ||= [];
  state.cashBox.movements.push({
    type: "venta",
    id: saleId,
    concept: `${table.name} · ${payUi.invoiceType}`,
    method,
    amount: total,
    items: itemsSnapshot,
    opCode: opCode || null,
    user: session.name,
    at: now
  });

  state.salesHistory ||= [];
  state.salesHistory.unshift({
    id: saleId,
    tableId: table.id,
    table: table.name,
    channel: table.seats === 0 ? "Delivery" : "Local",
    customerId: customer?.id || null,
    customerName: customer?.name || "Consumidor final",
    items: itemsSnapshot,
    subtotal: tableSubtotal(table),
    total,
    method,
    invoiceType: payUi.invoiceType,
    opCode: opCode || null,
    user: session.name,
    closedAt: now
  });

  if (customer && state.settings?.loyaltyEnabled !== false) updateCustomerAfterSale(customer, total, saleId);

  state.kitchenOrders.forEach((order) => {
    if (order.tableId === table.id && order.status !== "Entregado") {
      order.items.forEach((item) => { item.status = "Entregado"; });
      order.status = "Entregado";
      order.deliveredAt ||= now;
    }
  });

  table.items = [];
  table.status = "Libre";
  table.customerId = null;
  table.openedAt = null;
  table.people = null;

  addAuditEvent(state, {
    user: session.name,
    action: "Venta cerrada",
    module: "Ventas",
    detail: `${saleId} · ${method} · ${money(total)}`
  });

  saveState(state);
  closeModal();
  showToast(customer ? `Venta ${saleId} cerrada. ${customer.name} acumulo puntos.` : `Venta ${saleId} cerrada con ${method}.`);
  render();
}

function updateCustomerAfterSale(customer, total, saleId) {
  const points = Math.floor(total * Number(state.loyaltyConfig?.pointsPerSol || 1));
  customer.points = Number(customer.points || 0) + points;
  customer.visits = Number(customer.visits || 0) + 1;
  customer.lifetimeSpend = Number(customer.lifetimeSpend || 0) + total;
  customer.avgTicket = customer.visits ? Math.round((customer.lifetimeSpend / customer.visits) * 100) / 100 : total;
  customer.last = new Date().toISOString().slice(0, 10);
  customer.level = loyaltyLevelForPoints(customer.points);

  state.loyaltyMovements ||= [];
  state.loyaltyMovements.unshift({
    id: `PTS-${Date.now()}`,
    customerId: customer.id,
    type: "earn",
    points,
    detail: `Compra #${saleId}`,
    at: new Date().toISOString()
  });
}

function loyaltyLevelForPoints(points) {
  const levels = [...(state.loyaltyConfig?.levels || [])].sort((a, b) => Number(a.minPoints || 0) - Number(b.minPoints || 0));
  let current = levels[0]?.name || "Bronce";
  levels.forEach((level) => {
    if (Number(points || 0) >= Number(level.minPoints || 0)) current = level.name;
  });
  return current;
}

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function occupiedTables() {
  return state.tables.filter((table) => table.seats > 0 && table.status === "Ocupada");
}

function countTablesWithReadyItems() {
  return new Set(state.kitchenOrders.filter((order) => order.status === "Listo" && order.tableId).map((order) => order.tableId)).size;
}

function stationPending(station) {
  return state.kitchenOrders.reduce((count, order) => count + (order.items || []).filter((item) => item.station === station && !["Listo", "Entregado"].includes(item.status || order.status)).length, 0);
}

function latestOrderForTable(tableId) {
  return [...state.kitchenOrders]
    .filter((order) => order.tableId === tableId && order.status !== "Entregado")
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
}

function customerById(customerId) {
  if (!customerId) return null;
  return state.customers.find((customer) => customer.id === customerId) || null;
}

function elapsedMinutes(order) {
  if (!order) return 0;
  if (order.createdAt) {
    const diff = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    // Los seeds son demostrativos. Evitamos mostrar miles de minutos si se abre otro dia.
    if (Number.isFinite(diff) && diff >= 0 && diff <= 180) return diff;
  }
  return Number(order.elapsed || 0);
}

function minutesSince(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return Number.isFinite(diff) && diff >= 0 && diff <= 720 ? diff : 0;
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}

function formatDateTime(iso) {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function cssSafe(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

/* ========================================================================== */
/* ESTILOS TEMPORALES V4                                                      */
/* Se dejan aqui para que este JS sea visible al reemplazarlo de inmediato.   */
/* Luego pueden moverse a css/pages/ventas.css sin cambiar el JS.              */
/* ========================================================================== */

function ensureVentasV4Styles() {
  if (document.getElementById("ventas-v4-inline-styles")) return;
  const style = document.createElement("style");
  style.id = "ventas-v4-inline-styles";
  style.textContent = `
    .ventas-v4{gap:16px}.sales-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 12px}.sales-tabs{display:flex;gap:6px;overflow:auto}.sales-tab{border:0;background:transparent;border-radius:12px;padding:10px 13px;display:flex;align-items:center;gap:8px;font-weight:800;color:var(--muted);white-space:nowrap}.sales-tab b{min-width:22px;height:22px;padding:0 6px;border-radius:999px;display:grid;place-items:center;background:var(--cream);color:var(--brown);font-size:.72rem}.sales-tab.is-active{background:var(--brown);color:#fff}.sales-tab.is-active b{background:rgba(255,255,255,.16);color:#fff}
    .salon-shell{overflow:hidden}.salon-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 0 14px}.salon-kpi{border:1px solid var(--line);border-radius:14px;padding:12px;background:#fff;display:grid;gap:3px}.salon-kpi span{font-size:.74rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}.salon-kpi strong{font-size:1.35rem;color:var(--brown)}.salon-kpi small{color:var(--muted)}.salon-mode-switch{display:flex;gap:6px}.salon-mode-switch .is-active{background:var(--brown);color:#fff}.salon-filters{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-bottom:14px}.salon-filters label{display:grid;gap:6px;font-size:.75rem;font-weight:800;color:var(--muted)}.salon-filters select,.sale-v4-head select,.sale-v4-head input{min-height:40px;border:1px solid var(--line);border-radius:10px;background:#fff;padding:0 10px}.legend-row{display:flex;gap:12px;flex-wrap:wrap;margin-left:auto;padding-bottom:8px}.legend-item{display:flex;align-items:center;gap:6px;font-size:.75rem;color:var(--muted)}.legend-dot{width:9px;height:9px;border-radius:999px}.legend-dot--free{background:#62a675}.legend-dot--busy{background:#d39a34}.legend-dot--reserved{background:#6589c9}.legend-dot--ready{background:#b82a35}
    .floorplan-wrap{display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:14px}.floorplan{position:relative;min-height:560px;border:1px solid #b9ada4;border-radius:18px;overflow:hidden;background:linear-gradient(90deg,rgba(86,47,31,.03) 1px,transparent 1px),linear-gradient(rgba(86,47,31,.03) 1px,transparent 1px),#f7f2e9;background-size:24px 24px}.floorplan:after{content:"";position:absolute;left:31%;top:8%;right:10%;bottom:12%;border:2px solid rgba(90,46,27,.23);border-radius:4px;pointer-events:none}.floor-zone{position:absolute;border:1px solid rgba(90,46,27,.25);background:rgba(255,255,255,.78);color:var(--brown);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.05em;z-index:2}.floor-zone small{font-size:.6rem;font-weight:700;color:var(--muted);margin-top:3px}.floor-zone--books{left:4%;top:13%;width:12%;height:15%}.floor-zone--art-a{left:4%;top:34%;width:12%;height:17%}.floor-zone--art-b{left:82%;top:48%;width:12%;height:15%}.floor-zone--office{left:35%;top:8%;width:16%;height:12%}.floor-zone--kitchen{left:35%;top:22%;width:18%;height:24%;background:#efe4d7;cursor:pointer}.floor-zone--bar{left:36%;top:49%;width:17%;height:9%;background:#f3e7cc;cursor:pointer}.floor-zone--wc{left:4%;bottom:12%;width:12%;height:13%}.floor-door{position:absolute;font-size:.63rem;font-weight:900;color:var(--muted);text-transform:uppercase}.floor-door--a{left:18%;bottom:5%}.floor-door--b{right:18%;bottom:5%}.floor-table{position:absolute;min-width:58px;min-height:46px;border-radius:10px;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:4px;z-index:4;box-shadow:0 5px 12px rgba(64,37,24,.09);transition:transform .15s ease,box-shadow .15s ease;cursor:pointer}.floor-table:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(64,37,24,.16)}.floor-table strong{font-size:1rem}.floor-table small{font-size:.61rem}.floor-table em{font-size:.55rem;font-style:normal;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.floor-table--free{background:#edf7ef;border-color:#72a47c;color:#2f6b40}.floor-table--busy{background:#fff4dc;border-color:#d6a044;color:#785014}.floor-table--reserved{background:#edf3fc;border-color:#7394c7;color:#3f6194}.floor-table--ready{background:#fde9ea;border-color:#b82a35;color:#8e1e28;animation:readyPulse 1.8s infinite}.floor-table.is-round{border-radius:999px}.floor-table__ready{font-size:.52rem;font-weight:900;letter-spacing:.08em}.floorplan-side{border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff;height:max-content;display:grid;gap:12px}.floorplan-side h3{color:var(--brown)}.operation-box{display:grid;gap:7px}.operation-box__label{font-size:.7rem;font-weight:900;text-transform:uppercase;color:var(--muted)}.operation-box button{border:1px solid var(--line);border-radius:10px;background:#fff;padding:8px;text-align:left;display:flex;justify-content:space-between;gap:8px;color:var(--ink)}.operation-box button.is-alert{border-color:#e4a7a7;background:#fff5f5}.operation-box small{color:var(--muted)}@keyframes readyPulse{50%{box-shadow:0 0 0 6px rgba(184,42,53,.08)}}
    .table-tile__head{display:flex;justify-content:space-between;gap:8px;align-items:center}.table-tile--ready{outline:2px solid rgba(184,42,53,.2)}
    .sale-modal--v4{width:min(1460px,96vw);max-width:none}.sale-v4-head{display:grid;grid-template-columns:auto minmax(220px,1fr) 100px;gap:12px;align-items:end;padding:12px 18px;border-bottom:1px solid var(--line);background:#fbfaf8}.sale-v4-head label{display:grid;gap:5px;font-size:.72rem;font-weight:800;color:var(--muted)}.delivery-pill{display:flex;align-items:center;justify-content:center;min-height:40px;border-radius:10px;background:var(--cream);font-size:.75rem;font-weight:800;color:var(--brown)}.sale-modal__body--pos{display:grid;grid-template-columns:210px minmax(420px,1fr) 340px;gap:0;padding:0;min-height:min(680px,74vh);max-height:74vh}.pos-context,.pos-products,.pos-ticket{padding:14px;overflow:auto}.pos-context{border-right:1px solid var(--line);background:#fbfaf8}.pos-products{border-right:1px solid var(--line)}.pos-ticket{display:flex;flex-direction:column;background:#fff}.pos-context__head,.pos-ticket__head,.pos-products__top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.pos-products__top .input{width:min(260px,48%)}.pos-table-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.pos-table-choice{min-height:58px;border:1px solid var(--line);border-radius:10px;background:#fff;display:grid;place-items:center;color:var(--brown)}.pos-table-choice small{font-size:.6rem;color:var(--muted)}.pos-table-choice.is-selected{background:var(--brown);color:#fff;border-color:var(--brown)}.pos-table-choice.is-selected small{color:#fff}.pos-table-choice.is-reserved:not(.is-selected){background:#eef4ff}.customer-mini,.delivery-card{margin-top:14px;border:1px solid var(--line);border-radius:12px;padding:10px;display:grid;gap:3px;background:#fff}.customer-mini span{font-size:.65rem;text-transform:uppercase;font-weight:900;color:var(--muted)}.customer-mini strong{color:var(--brown)}.customer-mini small,.delivery-card span{color:var(--muted);font-size:.72rem}.category-strip{display:flex;gap:6px;overflow:auto;padding:4px 0 10px}.category-strip button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 10px;white-space:nowrap;font-size:.72rem;font-weight:800;color:var(--muted)}.category-strip button.is-active{background:var(--brown);border-color:var(--brown);color:#fff}.product-picker--v4{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.product-line--v4{border:1px solid var(--line);border-radius:12px;background:#fff;padding:10px;display:grid;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;text-align:left;gap:9px;color:var(--ink)}.product-line--v4:hover{border-color:rgba(90,46,27,.45);background:#fffdf9}.product-line__icon{width:38px;height:38px;border-radius:10px;background:var(--cream);display:grid;place-items:center}.product-line__copy{display:grid;gap:2px}.product-line__copy small{color:var(--muted);font-size:.65rem}.product-line--v4 b{color:var(--brown)}.product-line--v4.is-disabled{opacity:.45}.existing-order{display:flex;justify-content:space-between;background:var(--cream);border-radius:10px;padding:8px;margin-bottom:8px;font-size:.7rem}.cart-list--v4{flex:1;overflow:auto;display:grid;align-content:start;gap:7px}.empty-cart{min-height:180px;display:grid;place-items:center;align-content:center;text-align:center;color:var(--muted);gap:5px}.empty-cart span{font-size:2rem}.cart-item--v4{border:1px solid var(--line);border-radius:11px;padding:9px;background:#fff}.cart-item__copy{display:grid;gap:2px}.cart-item__copy small,.cart-item__copy span{font-size:.65rem;color:var(--muted)}.cart-delete{border:0;background:transparent;color:#a52d35;font-size:1.35rem}.cart-item__bottom{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.ticket-summary{border-top:1px solid var(--line);padding:10px 0;display:grid;gap:5px}.ticket-summary div{display:flex;justify-content:space-between;font-size:.76rem}.ticket-summary__total{font-size:.95rem!important;color:var(--brown);padding-top:5px}.modifier-screen{display:grid;grid-template-columns:280px 1fr;gap:24px;padding:22px;min-height:520px}.modifier-screen__product{display:grid;align-content:start;gap:8px}.modifier-product-icon{width:78px;height:78px;display:grid;place-items:center;background:var(--cream);border-radius:20px;font-size:2.4rem;margin-top:18px}.modifier-screen__product h3{font-size:1.6rem;color:var(--brown)}.modifier-screen__product p{color:var(--muted)}.modifier-screen__product>strong{font-size:1.25rem;color:var(--brown)}.modifier-screen__options{display:grid;align-content:start;gap:16px}.modifier-group{border:1px solid var(--line);border-radius:14px;padding:12px}.modifier-group legend{font-weight:900;color:var(--brown);padding:0 5px}.modifier-options{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.modifier-option{border:1px solid var(--line);border-radius:10px;padding:10px;display:flex;align-items:center;gap:8px}.modifier-option span{flex:1}.modifier-option b{font-size:.7rem;color:var(--muted)}.modifier-option.is-selected{background:#fff8e9;border-color:#cf9b38}.modifier-note{display:grid;gap:6px;font-weight:800;color:var(--muted)}.modifier-note textarea{min-height:90px;border:1px solid var(--line);border-radius:12px;padding:10px}.modifier-screen__action{grid-column:2;display:flex;align-items:center;justify-content:flex-end;gap:16px}.modifier-screen__action div{display:grid;text-align:right}.modifier-screen__action span{font-size:.7rem;color:var(--muted)}.modifier-screen__action strong{font-size:1.25rem;color:var(--brown)}
    .table-detail-modal,.order-detail-modal{width:min(760px,94vw)}.table-detail-body,.order-detail-body{padding:18px;display:grid;gap:14px}.table-detail-status,.order-detail-meta{display:flex;align-items:center;gap:10px;color:var(--muted)}.table-detail-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.table-customer-box{border:1px solid var(--line);border-radius:12px;padding:12px;display:grid;gap:2px}.table-current-items{display:grid;gap:7px}.table-current-items>div{display:flex;justify-content:space-between;gap:14px;border-bottom:1px solid var(--line);padding:7px 0}.table-current-items span{display:grid}.table-current-items small{color:var(--muted)}.table-detail-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.order-detail-item{display:flex;justify-content:space-between;gap:14px;border:1px solid var(--line);border-radius:11px;padding:10px}.order-detail-item div{display:grid;gap:3px}.order-detail-item small{color:var(--muted)}
    .orders-list{display:grid;gap:8px}.order-row{border:1px solid var(--line);border-radius:14px;padding:11px}.order-row.is-delayed{border-color:#e5a8a8;background:#fffafa}.order-row__main{display:grid;grid-template-columns:120px 1fr 120px auto;gap:12px;align-items:center}.order-row__id,.order-row__copy,.order-row__time{display:grid;gap:2px}.order-row__id span,.order-row__copy span,.order-row__copy small,.order-row__time span{color:var(--muted);font-size:.7rem}.order-row__actions{display:flex;gap:6px;justify-content:flex-end;border-top:1px solid var(--line);padding-top:8px;margin-top:8px}.mini-button--primary{background:var(--brown)!important;color:#fff!important}
    .kds-controls{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}.kds-live{display:flex;align-items:center;gap:7px;font-size:.72rem;font-weight:800;color:#3e7f52}.kds-live i{width:8px;height:8px;background:#49a465;border-radius:999px;box-shadow:0 0 0 5px rgba(73,164,101,.1)}.kds-board{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:start}.kds-column{border-radius:14px;background:#f7f5f1;min-height:420px;padding:9px}.kds-column>header{display:flex;justify-content:space-between;align-items:center;padding:4px 3px 9px;font-size:.75rem;font-weight:900;text-transform:uppercase;color:var(--brown)}.kds-column>header b{width:24px;height:24px;border-radius:999px;background:#fff;display:grid;place-items:center}.kds-column__cards{display:grid;gap:8px}.kds-card{background:#fff;border:1px solid var(--line);border-radius:13px;padding:10px;display:grid;gap:9px}.kds-card.is-delayed{border:2px solid #c85158}.kds-card__head{display:flex;justify-content:space-between;gap:10px}.kds-card__head>div:first-child{display:grid}.kds-card__head span{font-size:.68rem;color:var(--muted)}.kds-timer{display:flex;align-items:baseline;gap:2px;color:var(--brown)}.kds-timer strong{font-size:1.35rem}.kds-timer.is-delayed{color:#ad2530}.kds-card__station{font-size:.65rem;font-weight:900;text-transform:uppercase;color:#8a633d;background:var(--cream);border-radius:7px;padding:4px 7px;width:max-content}.kds-card__items{display:grid;gap:7px}.kds-card__items>div{display:grid;border-top:1px solid var(--line);padding-top:7px}.kds-card__items small{font-size:.67rem;color:var(--muted)}.kds-card__items small.is-note{color:#a63a42;font-weight:800}.kds-ready-message{border-radius:9px;background:#e9f5ec;color:#397849;text-align:center;padding:9px;font-weight:900}.kds-empty{color:var(--muted);text-align:center;padding:30px 8px}.checkout-customer{display:flex;justify-content:space-between;gap:16px;background:#fbf6ea;border:1px solid #ead9b5;border-radius:12px;padding:10px;margin-bottom:10px}.checkout-customer>div{display:grid;gap:2px}.checkout-customer span,.checkout-customer small{font-size:.68rem;color:var(--muted)}.checkout-customer strong{color:var(--brown)}.void-inline{display:grid;grid-template-columns:1fr 1fr auto auto;gap:5px;margin-top:6px}.void-inline input{border:1px solid var(--line);border-radius:8px;padding:7px}
    @media(max-width:1100px){.floorplan-wrap{grid-template-columns:1fr}.floorplan-side{grid-template-columns:repeat(2,1fr)}.sale-modal__body--pos{grid-template-columns:190px 1fr 300px}.product-picker--v4{grid-template-columns:1fr}.kds-board{grid-template-columns:1fr}.kds-column{min-height:0}.order-row__main{grid-template-columns:100px 1fr auto}.order-row__time{display:none}}
    @media(max-width:820px){.sales-toolbar{align-items:stretch;flex-direction:column}.sales-toolbar>.button{width:100%}.salon-kpis{grid-template-columns:repeat(2,1fr)}.floorplan{min-height:470px}.floorplan-side{grid-template-columns:1fr}.sale-v4-head{grid-template-columns:1fr}.sale-modal__body--pos{display:block;max-height:74vh;overflow:auto}.pos-context,.pos-products,.pos-ticket{border-right:0;border-bottom:1px solid var(--line);overflow:visible}.pos-ticket{min-height:420px}.modifier-screen{grid-template-columns:1fr}.modifier-screen__action{grid-column:1}.modifier-options{grid-template-columns:1fr}.order-row__main{grid-template-columns:1fr auto}.order-row__copy{grid-column:1/-1}.table-detail-kpis{grid-template-columns:1fr 1fr}.void-inline{grid-template-columns:1fr}}
    @media(max-width:520px){.floorplan{min-height:410px}.floor-zone{font-size:.5rem}.floor-table{min-width:42px;min-height:40px}.floor-table strong{font-size:.8rem}.floor-table small,.floor-table em{display:none}.salon-kpis{grid-template-columns:1fr 1fr}.legend-row{margin-left:0}.product-picker--v4{grid-template-columns:1fr}.table-detail-kpis{grid-template-columns:1fr}.precuenta-actions,.table-detail-actions{display:grid}.checkout-customer{display:grid}.sales-tab{padding:8px 10px}}
  `;
  document.head.appendChild(style);
}
