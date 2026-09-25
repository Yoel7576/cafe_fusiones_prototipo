// Cafe Fusiones - Reportes (solo la logica de esta pantalla).
// Mejoras del jefe: SIN campo "Periodo" (solo rango Desde/Hasta), tarjetas de
// Ingresos/Egresos/Utilidad/Margen ARRIBA, y sin el termino "CRM".
import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState } from "../core/storage.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, statusClass, trendClass, matchesSearch, formatDate, downloadBlob, xmlEscape, buildSimplePdf } from "../core/utils.js";

const session = requireAuth();
const state = getState();

// Rango por defecto: los ultimos 30 dias hasta hoy.
const HOY = new Date().toISOString().slice(0, 10);
const HACE_30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

// Submenu de reportes: una seccion por tarjeta (?tab=).
const TABS = [
  { id: "balance", label: "Balance" },
  { id: "desempeno", label: "Desempeño" },
  { id: "ventas", label: "Ventas" },
  { id: "clientes", label: "Clientes" },
  { id: "stock", label: "Stock" }
];
const AREAS = ["Todas", "Cocina", "Barra"];
const STOCK_PAGE_SIZE = 20;
// Barras que muestran los graficos de mozos y productos.
const CHART_TOP = 10;
// Rango maximo en dias para dibujar todas las fechas del balance aunque no tengan datos.
const BALANCE_MAX_DAYS = 62;

const params = new URLSearchParams(window.location.search);
const ui = {
  search: "", from: HACE_30, to: HOY, channel: "Todos", staff: "Todos", segment: "Todos", level: "Todos",
  tab: TABS.some((tab) => tab.id === params.get("tab")) ? params.get("tab") : "balance",
  area: "Todas",
  category: "Todas",
  stockPage: 1
};
const view = document.getElementById("view");

if (session) {
  renderSidebar("reportes", session.role);
  renderTopbar({ title: "Reportes", eyebrow: "Modulo", searchPlaceholder: "Buscar producto o mozo", onSearch: (q) => { ui.search = q; ui.stockPage = 1; render(); } });
  render();
}

function inRange(date) { return date >= ui.from && date <= ui.to; }

/* ==================== ORIGEN DE DATOS ====================
   Los reportes se arman con la operacion real guardada en el estado:
   las ventas cerradas (state.salesHistory) y los egresos de caja.
   Mientras no haya operacion registrada, las tablas quedan vacias. */

// Costo directo por unidad de un producto: sale del recetario si tiene receta,
// o del insumo asociado si es un producto de despacho directo.
function unitCost(productId) {
  const recipe = (state.recipes || []).find(
    (item) => item.productId === productId || (item.productIds || []).includes(productId)
  );
  if (recipe) return Number(recipe.referenceCost || 0);

  const product = (state.menuItems || []).find((item) => item.id === productId);
  if (product?.inventoryItemId) {
    const supply = (state.inventory || []).find((item) => item.id === product.inventoryItemId);
    if (supply) return Number(supply.cost || 0);
  }
  return 0;
}

// Una fila por producto vendido, que es el grano que consumen los reportes.
function salesRows() {
  const rows = [];

  (state.salesHistory || []).forEach((sale) => {
    const date = String(sale.closedAt || "").slice(0, 10);
    (sale.items || []).forEach((item) => {
      const product = (state.menuItems || []).find((menu) => menu.id === item.id);
      const qty = Number(item.qty || 0);
      rows.push({
        date,
        channel: sale.channel || "Local",
        staff: sale.user || "Sin responsable",
        product: item.name,
        category: product?.category || "Sin categoria",
        area: product?.station || "Sin area",
        qty,
        income: qty * Number(item.price || 0),
        cost: qty * unitCost(item.id)
      });
    });
  });

  return rows;
}

function expenseRows() {
  return (state.cashBox?.movements || [])
    .filter((movement) => movement.type === "egreso")
    .map((movement) => ({
      date: String(movement.at || "").slice(0, 10),
      type: movement.category || "Egreso",
      detail: movement.concept || movement.description || "Egreso de caja",
      amount: Number(movement.amount || 0)
    }));
}

function sales() {
  return salesRows().filter((r) =>
    inRange(r.date) &&
    (ui.channel === "Todos" || r.channel === ui.channel) &&
    (ui.staff === "Todos" || r.staff === ui.staff) &&
    (ui.area === "Todas" || r.area === ui.area) &&
    (ui.category === "Todas" || r.category === ui.category) &&
    matchesSearch(ui.search, r.product, r.category, r.staff, r.channel));
}
function expenses() { return expenseRows().filter((r) => inRange(r.date)); }

function summary(s, e) {
  const income = s.reduce((a, r) => a + r.income, 0);
  const directCost = s.reduce((a, r) => a + r.cost, 0);
  const operating = e.reduce((a, r) => a + r.amount, 0);
  const totalExp = directCost + operating;
  const profit = income - totalExp;
  const margin = income ? Math.round((profit / income) * 100) : 0;
  return { income, expenses: totalExp, profit, margin };
}

function render() {
  const s = sales();
  const e = expenses();
  const sum = summary(s, e);
  const allRows = salesRows();
  const channels = ["Todos", ...new Set(allRows.map((r) => r.channel))];
  const staff = ["Todos", ...new Set(allRows.map((r) => r.staff))];
  // Categorias de la carta, mas las que aparezcan en ventas y ya no esten en la lista.
  const categories = ["Todas", ...new Set([
    ...(state.menuCategories || []).filter((c) => c !== "Todos"),
    ...allRows.map((r) => r.category)
  ])];

  view.innerHTML = `
    <div class="view-stack reports-view">
      <section class="grid grid--4 report-kpis" aria-label="Indicadores de ventas">
        <article class="metric-card"><div class="metric-card__top"><p>Ingresos</p><span class="trend">Ventas</span></div><strong>${money(sum.income)}</strong><span class="muted">Rango filtrado</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Egresos</p><span class="trend trend--warn">Costos</span></div><strong>${money(sum.expenses)}</strong><span class="muted">Insumos y operacion</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Utilidad</p><span class="${trendClass(sum.profit >= 0 ? "ok" : "danger")}">Neta</span></div><strong>${money(sum.profit)}</strong><span class="muted">Ingresos menos egresos</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Margen</p><span class="trend">%</span></div><strong>${sum.margin}%</strong><span class="muted">Sobre ingresos</span></article>
      </section>

      <section class="panel report-filter-panel">
        <div class="panel__header panel__header--wrap"><h2>Filtros de reportes</h2><div class="report-actions"><button class="mini-button" type="button" data-export="pdf">Exportar PDF</button><button class="mini-button" type="button" data-export="excel">Exportar Excel</button><button class="mini-button" type="button" data-export="csv">Exportar CSV</button></div></div>
        <div class="filter-row report-filter-row">
          <label>Desde<input type="date" data-filter="from" value="${ui.from}" max="${ui.to}"></label>
          <label>Hasta<input type="date" data-filter="to" value="${ui.to}" min="${ui.from}"></label>
          <label>Canal<select data-filter="channel">${channels.map((c) => `<option value="${escapeHtml(c)}" ${c === ui.channel ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
          <label>Mozo<select data-filter="staff">${staff.map((c) => `<option value="${escapeHtml(c)}" ${c === ui.staff ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
          <label>Área<select data-filter="area">${AREAS.map((a) => `<option value="${a}" ${a === ui.area ? "selected" : ""}>${a}</option>`).join("")}</select></label>
          <label>Categoría<select data-filter="category">${categories.map((c) => `<option value="${escapeHtml(c)}" ${c === ui.category ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
        </div>
      </section>

      <nav class="panel report-subtabs" aria-label="Secciones de reportes">
        ${TABS.map((tab) => `
          <button class="report-subtab ${ui.tab === tab.id ? "is-active" : ""}" type="button" data-report-tab="${tab.id}" aria-current="${ui.tab === tab.id ? "page" : "false"}">${tab.label}</button>
        `).join("")}
      </nav>

      ${renderTab(s, e)}
    </div>`;

  wire();
}

function renderTab(s, e) {
  if (ui.tab === "desempeno") return renderDesempeno(s);
  if (ui.tab === "ventas") return renderVentas(s);
  if (ui.tab === "clientes") return renderClientes();
  if (ui.tab === "stock") return renderStock();
  return renderBalance(s, e);
}

function renderBalance(s, e) {
  return `
    ${balanceChart(s, e)}
    <section class="panel report-section">
      <div class="panel__header"><h2>Ingresos y egresos</h2><span class="status status--info">Caja</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Tipo</th><th>Detalle</th><th>Canal</th><th>Responsable</th><th>Monto</th></tr></thead><tbody>${financialRows(s, e)}</tbody></table></div>
    </section>`;
}

function renderDesempeno(s) {
  return `
    ${staffChart(s)}
    <section class="panel report-section">
      <div class="panel__header"><h2>Mozos con mayores ventas</h2><span class="status status--ok">Rendimiento</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Mozo</th><th>Ventas</th><th>Pedidos</th><th>Ticket prom.</th></tr></thead><tbody>${staffPerformance(s).map((r) => `<tr><td><strong>${escapeHtml(r.staff)}</strong></td><td>${money(r.income)}</td><td>${r.orders}</td><td>${money(r.average)}</td></tr>`).join("") || '<tr><td colspan="4" class="muted text-center">Aun no hay ventas registradas.</td></tr>'}</tbody></table></div>
    </section>`;
}

function renderVentas(s) {
  // El area y la categoria ya vienen filtradas desde la caja de filtros.
  return `
    ${productsChart(s)}
    <section class="panel report-section">
      <div class="panel__header"><h2>Productos más vendidos</h2><span class="status">${ui.area === "Todas" ? "Cocina y barra" : escapeHtml(ui.area)}</span></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Área</th><th>Categoria</th><th>Unidades</th><th>Ingreso</th></tr></thead><tbody>${productPerformance(s).map((r) => `<tr><td><strong>${escapeHtml(r.product)}</strong></td><td>${escapeHtml(r.area)}</td><td>${escapeHtml(r.category)}</td><td>${r.qty}</td><td>${money(r.income)}</td></tr>`).join("") || '<tr><td colspan="5" class="muted text-center">Aun no hay ventas registradas.</td></tr>'}</tbody></table></div>
    </section>

    <section class="panel report-section">
      <div class="panel__header"><h2>Ventas por canal</h2><span class="status">${ui.area === "Todas" ? "Distribucion" : escapeHtml(ui.area)}</span></div>
      <div class="chart-bars">${channelPerformance(s).map((i) => `<div class="bar-row"><span>${escapeHtml(i.label)}</span><span class="bar-track"><span class="bar-fill" style="width:${i.value}%"></span></span><strong>${i.amount}</strong></div>`).join("") || '<p class="muted">Aun no hay ventas registradas.</p>'}</div>
    </section>`;
}

function renderClientes() {
  const customers = state.customers.filter((c) =>
    (ui.segment === "Todos" || c.segment === ui.segment) &&
    (ui.level === "Todos" || c.level === ui.level) &&
    matchesSearch(ui.search, c.name, c.segment, c.level));
  const totalVisits = customers.reduce((a, c) => a + c.visits, 0);
  const avgSat = customers.length ? Math.round(customers.reduce((a, c) => a + c.satisfaction, 0) / customers.length) : 0;
  const segments = ["Todos", ...new Set(state.customers.map((c) => c.segment))];
  const levels = ["Todos", ...new Set(state.customers.map((c) => c.level))];

  return `
    <section class="report-layout">
      <article class="panel report-section">
        <div class="panel__header"><h2>Clientes</h2><span class="status status--info">${customers.length} activos</span></div>
        <div class="grid grid--3 compact-kpis"><article><strong>${customers.length}</strong><span>Clientes</span></article><article><strong>${totalVisits}</strong><span>Visitas</span></article><article><strong>${avgSat}%</strong><span>Satisfaccion</span></article></div>
        <div class="filter-row"><label>Segmento<select data-filter="segment">${segments.map((x) => `<option value="${escapeHtml(x)}" ${x === ui.segment ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}</select></label><label>Nivel<select data-filter="level">${levels.map((x) => `<option value="${escapeHtml(x)}" ${x === ui.level ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}</select></label></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Cliente</th><th>Segmento</th><th>Nivel</th><th>Puntos</th><th>Visitas</th></tr></thead><tbody>${customers.map((c) => `<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${escapeHtml(c.segment)}</td><td><span class="${statusClass(c.level)}">${escapeHtml(c.level)}</span></td><td>${c.points}</td><td>${c.visits}</td></tr>`).join("") || '<tr><td colspan="5" class="muted text-center">No hay datos para mostrar</td></tr>'}</tbody></table></div>
      </article>
      ${donutCard(customers)}
    </section>`;
}

/* ---- Stock: tabla paginada de STOCK_PAGE_SIZE filas para no hacer un scroll infinito ---- */

function stockLabel(i) {
  const stock = Number(i.stock || 0);
  const min = Number(i.min || 0);
  if (stock < 0) return "Negativo";
  if (min > 0 && stock <= min) return "Bajo";
  return "Disponible";
}

function stockList() {
  return [...state.inventory]
    .filter((i) => i.active !== false)
    .filter((i) => matchesSearch(ui.search, i.item, i.category))
    .sort((a, b) => {
      const alerta = (x) => (stockLabel(x) === "Disponible" ? 1 : 0);
      return alerta(a) - alerta(b) || String(a.item).localeCompare(String(b.item));
    });
}

function renderStock() {
  const list = stockList();
  const enAlerta = list.filter((i) => stockLabel(i) !== "Disponible").length;
  const pages = Math.max(1, Math.ceil(list.length / STOCK_PAGE_SIZE));
  ui.stockPage = Math.min(Math.max(1, ui.stockPage), pages);
  const start = (ui.stockPage - 1) * STOCK_PAGE_SIZE;
  const pageRows = list.slice(start, start + STOCK_PAGE_SIZE);

  return `
    <section class="panel report-section">
      <div class="panel__header panel__header--wrap"><h2>Reporte de stock actual</h2><div class="report-actions"><span class="status status--danger">${enAlerta} en alerta</span><button class="mini-button" type="button" data-export-stock>Exportar stock (PDF)</button></div></div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Categoria</th><th>Stock</th><th>Minimo</th><th>Estado</th></tr></thead><tbody>${
        pageRows.map((i) => {
          const label = stockLabel(i);
          return `<tr><td><strong>${escapeHtml(i.item)}</strong></td><td>${escapeHtml(i.category)}</td><td>${i.stock} ${escapeHtml(i.unit)}</td><td>${i.min} ${escapeHtml(i.unit)}</td><td><span class="${statusClass(label)}">${label}</span></td></tr>`;
        }).join("") || '<tr><td colspan="5" class="muted text-center">Sin insumos.</td></tr>'
      }</tbody></table></div>
      ${list.length ? pager(list.length, pages, start, pageRows.length) : ""}
    </section>`;
}

// Numeros de pagina visibles: primera, ultima y las vecinas de la actual.
function pageNumbers(current, pages) {
  const set = new Set([1, pages, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, index) => {
    if (index && n - nums[index - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function pager(total, pages, start, shown) {
  return `
    <nav class="report-pager" aria-label="Paginación del stock">
      <span class="report-pager__info">Mostrando ${start + 1}–${start + shown} de ${total}</span>
      <div class="report-pager__buttons">
        <button type="button" data-stock-page="${ui.stockPage - 1}" ${ui.stockPage === 1 ? "disabled" : ""} aria-label="Página anterior">‹ Anterior</button>
        ${pageNumbers(ui.stockPage, pages).map((n) => n === "…"
          ? '<span class="report-pager__gap">…</span>'
          : `<button type="button" class="${n === ui.stockPage ? "is-active" : ""}" data-stock-page="${n}" ${n === ui.stockPage ? 'aria-current="page"' : ""}>${n}</button>`).join("")}
        <button type="button" data-stock-page="${ui.stockPage + 1}" ${ui.stockPage === pages ? "disabled" : ""} aria-label="Página siguiente">Siguiente ›</button>
      </div>
    </nav>`;
}

function exportStock() {
  const lines = [
    "Cafe Fusiones - Reporte de stock actual",
    `Generado: ${new Date().toLocaleString("es-PE")}`,
    "",
    ...stockList().map((i) => `${i.item} (${i.category}): ${i.stock} ${i.unit} | minimo ${i.min} ${i.unit} | ${stockLabel(i).toUpperCase()}`)
  ];
  downloadBlob(buildSimplePdf(lines), "Cafe_Fusiones_Stock.pdf", "application/pdf");
  showToast("Reporte de stock generado.");
}

function wire() {
  view.querySelectorAll("[data-filter]").forEach((el) => {
    el.addEventListener("change", (event) => {
      const key = event.target.dataset.filter;
      ui[key] = event.target.value;
      if (ui.to < ui.from) { if (key === "from") ui.to = ui.from; else ui.from = ui.to; }
      render();
    });
  });
  view.querySelectorAll("[data-report-tab]").forEach((b) => b.addEventListener("click", () => {
    ui.tab = b.dataset.reportTab;
    const url = new URL(location.href);
    url.searchParams.set("tab", ui.tab);
    history.replaceState({}, "", url);
    render();
  }));
  view.querySelectorAll("[data-stock-page]").forEach((b) => b.addEventListener("click", () => {
    ui.stockPage = Number(b.dataset.stockPage);
    render();
    view.querySelector(".report-subtabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  view.querySelectorAll("[data-export]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.export === "csv") exportCsv();
    else exportReport(b.dataset.export);
  }));
  wireChartTooltips();
  view.querySelector("[data-export-stock]")?.addEventListener("click", exportStock);
}

function financialRows(s, e) {
  const rows = [
    ...s.map((r) => `<tr><td><span class="status status--ok">Ingreso</span></td><td>${r.product}</td><td>${r.channel}</td><td>${r.staff}</td><td><strong>${money(r.income)}</strong></td></tr>`),
    ...e.map((r) => `<tr><td><span class="status status--busy">Egreso</span></td><td>${r.detail}</td><td>${r.type}</td><td>Administracion</td><td><strong>${money(r.amount)}</strong></td></tr>`)
  ];
  return rows.join("") || '<tr><td colspan="5" class="muted text-center">No hay movimientos para el filtro.</td></tr>';
}

function staffPerformance(s) {
  const grouped = s.reduce((acc, r) => { (acc[r.staff] ??= { staff: r.staff, income: 0, orders: 0 }); acc[r.staff].income += r.income; acc[r.staff].orders += r.qty; return acc; }, {});
  return Object.values(grouped).map((r) => ({ ...r, average: r.orders ? r.income / r.orders : 0 })).sort((a, b) => b.income - a.income);
}
function productPerformance(s) {
  const grouped = s.reduce((acc, r) => { (acc[r.product] ??= { product: r.product, area: r.area, category: r.category, qty: 0, income: 0 }); acc[r.product].qty += r.qty; acc[r.product].income += r.income; return acc; }, {});
  return Object.values(grouped).sort((a, b) => b.qty - a.qty);
}
function channelPerformance(s) {
  const total = s.reduce((a, r) => a + r.income, 0) || 1;
  const grouped = s.reduce((acc, r) => { acc[r.channel] = (acc[r.channel] || 0) + r.income; return acc; }, {});
  return Object.entries(grouped).map(([label, amount]) => ({ label, value: Math.round((amount / total) * 100), amount: money(amount) }));
}
function distribution(list) {
  const colors = ["#b81e2d", "#d4a017", "#2f6b4f", "#3d6f8e"];
  const totals = list.reduce((acc, c) => { acc[c.segment] = (acc[c.segment] || 0) + 1; return acc; }, {});
  const entries = Object.entries(totals);
  if (!entries.length) return [{ label: "Sin datos", count: 1, color: "#e7d9cb" }];
  return entries.map(([label, count], i) => ({ label, count, color: colors[i % colors.length] }));
}
function donutCard(list) {
  const dist = distribution(list);
  const total = dist.reduce((a, i) => a + i.count, 0) || 1;
  let cursor = 0;
  const stops = dist.map((i) => { const start = cursor; const end = cursor + (i.count / total) * 100; cursor = end; return `${i.color} ${start}% ${end}%`; });
  return `<article class="panel report-card"><div class="panel__header"><h2>Distribucion de cartera</h2><span class="status status--info">Donut</span></div><div class="donut" style="background:conic-gradient(${stops.join(", ")})"><span>${list.length}</span></div><div class="donut-legend">${dist.map((i) => `<span><i style="background:${i.color}"></i>${i.label}: ${i.count}</span>`).join("")}</div></article>`;
}

/* ==========================================================================
   GRAFICOS (Balance, Desempeno y Ventas)
   Barras en HTML/CSS: columnas pareadas por dia para el balance y barras
   horizontales para mozos y productos. Ingresos en azul y egresos en rojo
   (excepcion cromatica del sistema); una sola serie va en el color de marca.
   Cada barra lleva data-tip para el tooltip; la tabla de abajo es la vista
   completa de los mismos datos.
   ========================================================================== */

function chartCard(title, subtitle, body, legend = "") {
  return `
    <section class="panel report-chart">
      <div class="report-chart__head">
        <div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        ${legend}
      </div>
      ${body}
    </section>`;
}

// Aviso bajo un grafico vacio: el grafico se dibuja igual, en 0.
function chartZeroNote() {
  return '<p class="report-chart__note">Sin datos en el rango filtrado: el gráfico se completará con las ventas.</p>';
}

function isoDay(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Todos los dias del filtro Desde/Hasta (en fecha local).
function rangeDays() {
  const [fy, fm, fd] = ui.from.split("-").map(Number);
  const [ty, tm, td] = ui.to.split("-").map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const days = [];
  for (const d = new Date(start); d <= end && days.length < BALANCE_MAX_DAYS; d.setDate(d.getDate() + 1)) {
    days.push(isoDay(d));
  }
  return days;
}

// Ingresos y egresos por dia. Egresos = costo de insumos de lo vendido + egresos de caja,
// el mismo criterio de los indicadores de arriba. Incluye los dias sin movimiento
// (en 0) para que el eje de fechas se vea completo aunque no haya ventas.
function balanceByDay(s, e) {
  const days = new Map(rangeDays().map((date) => [date, { date, income: 0, expense: 0 }]));
  const day = (date) => {
    if (!days.has(date)) days.set(date, { date, income: 0, expense: 0 });
    return days.get(date);
  };
  s.forEach((r) => { const d = day(r.date); d.income += r.income; d.expense += r.cost; });
  e.forEach((r) => { day(r.date).expense += r.amount; });
  return [...days.values()].filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date));
}

function balanceChart(s, e) {
  const data = balanceByDay(s, e);
  const legend = `
    <div class="report-chart__legend">
      <span><i class="is-income"></i>Ingresos</span>
      <span><i class="is-expense"></i>Egresos</span>
    </div>`;

  const peak = Math.max(0, ...data.map((d) => Math.max(d.income, d.expense)));
  const empty = peak === 0;
  // Sin datos, el eje solo marca el 0 (no se inventa una escala).
  const max = empty ? 1 : peak;
  const ticks = empty ? ["", "", money(0)] : [money(max), money(max / 2), money(0)];
  const pct = (v) => `${v > 0 ? Math.max(1, (v / max) * 100) : 0}%`;

  const body = `
    <div class="report-columns ${empty ? "is-empty" : ""}">
      <div class="report-columns__axis">${ticks.map((t) => `<span>${t}</span>`).join("")}</div>
      <div class="report-columns__plot">
        <div class="report-columns__grid" aria-hidden="true"><i></i><i></i><i></i></div>
        ${data.map((d) => `
          <div class="report-columns__group" data-tip="${escapeHtml(formatDate(d.date))} · Ingresos ${escapeHtml(money(d.income))} · Egresos ${escapeHtml(money(d.expense))}">
            <div class="report-columns__bars">
              <span class="is-income" style="height:${pct(d.income)}"></span>
              <span class="is-expense" style="height:${pct(d.expense)}"></span>
            </div>
            <small>${escapeHtml(formatDate(d.date).slice(0, 5))}</small>
          </div>
        `).join("")}
      </div>
    </div>
    ${empty ? chartZeroNote() : ""}`;

  return chartCard("Balance diario", "Ingresos y egresos por día", body, legend);
}

// Barras horizontales de una sola serie, ordenadas de mayor a menor.
// Sin datos se dibujan las filas de `placeholder` en 0, para que se vea el grafico.
function hbarChart(title, subtitle, rows, placeholder = []) {
  const empty = !rows.length;
  const list = empty ? placeholder : rows;
  const max = Math.max(...list.map((r) => r.value), 1);
  const body = `
    <div class="report-hbars ${empty ? "is-empty" : ""}">
      ${list.map((r) => `
        <div class="report-hbars__row" data-tip="${escapeHtml(r.label)} · ${escapeHtml(r.tip)}">
          <span class="report-hbars__label" title="${escapeHtml(r.label)}">${escapeHtml(r.label)}</span>
          <span class="report-hbars__track"><span class="report-hbars__bar" style="width:${r.value > 0 ? Math.max(1, (r.value / max) * 100) : 0}%"></span></span>
          <strong class="report-hbars__value">${escapeHtml(r.display)}</strong>
        </div>
      `).join("")}
    </div>
    ${empty ? chartZeroNote() : ""}`;
  return chartCard(title, subtitle, body);
}

// Filas en 0 con nombres reales cuando existen; si no, guiones.
function zeroRows(labels, display, tip) {
  const names = labels.length ? labels : ["—", "—", "—"];
  return names.slice(0, CHART_TOP).map((label) => ({ label, value: 0, display, tip }));
}

function staffChart(s) {
  const rows = staffPerformance(s).slice(0, CHART_TOP).map((r) => ({
    label: r.staff,
    value: r.income,
    display: money(r.income),
    tip: `${money(r.income)} · ${r.orders} pedidos · ticket ${money(r.average)}`
  }));
  // Quienes registran ventas: mozos y caja activos.
  const sellers = (state.users || [])
    .filter((user) => user.status !== "Inactivo" && ["Mozo", "Cajero"].includes(user.role))
    .map((user) => user.name);
  return hbarChart("Ventas por mozo", `Los ${CHART_TOP} con mayores ventas`, rows,
    zeroRows(sellers, money(0), "Sin ventas en el rango"));
}

function productsChart(s) {
  const rows = productPerformance(s).slice(0, CHART_TOP).map((r) => ({
    label: r.product,
    value: r.qty,
    display: `${r.qty} u.`,
    tip: `${r.qty} unidades · ${money(r.income)} · ${r.area}`
  }));
  // Platos de la carta que respetan los filtros de area y categoria.
  const carta = (state.menuItems || [])
    .filter((item) => item.status !== "Inactivo")
    .filter((item) => ui.area === "Todas" || item.station === ui.area)
    .filter((item) => ui.category === "Todas" || item.category === ui.category)
    .map((item) => item.name);
  return hbarChart("Productos más vendidos", `Top ${CHART_TOP} por unidades${ui.area === "Todas" ? "" : ` · ${ui.area}`}`, rows,
    zeroRows(carta, "0 u.", "Sin ventas en el rango"));
}

// Un solo tooltip flotante para todas las barras con data-tip.
function wireChartTooltips() {
  let tip = document.querySelector(".report-tooltip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "report-tooltip";
    tip.setAttribute("role", "status");
    document.body.appendChild(tip);
  }
  tip.hidden = true;

  view.querySelectorAll("[data-tip]").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      tip.textContent = el.dataset.tip;
      tip.hidden = false;
    });
    el.addEventListener("pointermove", (event) => {
      const x = Math.min(event.clientX + 14, window.innerWidth - tip.offsetWidth - 8);
      tip.style.left = `${Math.max(8, x)}px`;
      tip.style.top = `${event.clientY + 16}px`;
    });
    el.addEventListener("pointerleave", () => { tip.hidden = true; });
  });
}

/* ==========================================================================
   EXPORTAR CSV
   Descarga la seccion activa del submenu con los filtros aplicados. Va con
   separador ";" y BOM UTF-8 para que Excel en espanol lo abra con columnas
   y tildes correctas.
   ========================================================================== */

function csvCell(value) {
  const text = String(value ?? "");
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvSection(s, e) {
  const num = (v) => Number(v || 0).toFixed(2);
  if (ui.tab === "desempeno") {
    return [["Mozo", "Ventas (S/)", "Pedidos", "Ticket promedio (S/)"],
      ...staffPerformance(s).map((r) => [r.staff, num(r.income), r.orders, num(r.average)])];
  }
  if (ui.tab === "ventas") {
    return [["Producto", "Area", "Categoria", "Unidades", "Ingreso (S/)"],
      ...productPerformance(s).map((r) => [r.product, r.area, r.category, r.qty, num(r.income)])];
  }
  if (ui.tab === "clientes") {
    return [["Cliente", "Segmento", "Nivel", "Puntos", "Visitas"],
      ...state.customers.map((c) => [c.name, c.segment, c.level, c.points, c.visits])];
  }
  if (ui.tab === "stock") {
    return [["Insumo", "Categoria", "Stock", "Minimo", "Unidad", "Estado"],
      ...stockList().map((i) => [i.item, i.category, i.stock, i.min, i.unit, stockLabel(i)])];
  }
  return [["Fecha", "Tipo", "Detalle", "Canal / tipo", "Responsable", "Monto (S/)"],
    ...s.map((r) => [formatDate(r.date), "Ingreso", r.product, r.channel, r.staff, num(r.income)]),
    ...e.map((r) => [formatDate(r.date), "Egreso", r.detail, r.type, "Administracion", num(r.amount)])];
}

function exportCsv() {
  const s = sales();
  const e = expenses();
  const tab = TABS.find((item) => item.id === ui.tab)?.label || "Reporte";
  const rows = [
    [`Cafe Fusiones - ${tab}`],
    [`Rango: ${formatDate(ui.from)} al ${formatDate(ui.to)}`, `Canal: ${ui.channel}`, `Mozo: ${ui.staff}`, `Area: ${ui.area}`, `Categoria: ${ui.category}`],
    [],
    ...csvSection(s, e)
  ];
  const csv = "﻿" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const slug = tab.normalize("NFD").replace(/[̀-ͯ]/g, "");
  downloadBlob(csv, `Cafe_Fusiones_${slug}_${ui.from}_${ui.to}.csv`, "text/csv;charset=utf-8");
  showToast("Archivo CSV generado correctamente.");
}

/* ---- Exportacion ---- */
function exportReport(type) {
  const s = sales(); const e = expenses(); const sum = summary(s, e);
  const filters = { Desde: formatDate(ui.from), Hasta: formatDate(ui.to), Canal: ui.channel, Mozo: ui.staff, Area: ui.area, Categoria: ui.category };
  const base = `Cafe_Fusiones_Reportes_${ui.from}_${ui.to}`;
  const sheets = [
    { name: "Resumen", rows: [["Indicador", "Valor"], ["Desde", filters.Desde], ["Hasta", filters.Hasta], ["Canal", filters.Canal], ["Mozo", filters.Mozo], ["Area", filters.Area], ["Categoria", filters.Categoria], ["Ingresos", money(sum.income)], ["Egresos", money(sum.expenses)], ["Utilidad", money(sum.profit)], ["Margen", `${sum.margin}%`]] },
    { name: "Ingresos y egresos", rows: [["Tipo", "Detalle", "Canal/Tipo", "Responsable", "Monto"], ...s.map((r) => ["Ingreso", r.product, r.channel, r.staff, money(r.income)]), ...e.map((r) => ["Egreso", r.detail, r.type, "Administracion", money(r.amount)])] },
    { name: "Mozos", rows: [["Mozo", "Ventas", "Pedidos", "Ticket promedio"], ...staffPerformance(s).map((r) => [r.staff, money(r.income), r.orders, money(r.average)])] },
    { name: "Productos", rows: [["Producto", "Area", "Categoria", "Unidades", "Ingreso"], ...productPerformance(s).map((r) => [r.product, r.area, r.category, r.qty, money(r.income)])] }
  ];
  if (type === "excel") {
    const ws = sheets.map((sh) => `<Worksheet ss:Name="${xmlEscape(sh.name.slice(0, 31))}"><Table>${sh.rows.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${xmlEscape(cell)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet>`).join("");
    const wb = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${ws}</Workbook>`;
    downloadBlob(wb, `${base}.xls`, "application/vnd.ms-excel;charset=utf-8");
    showToast("Archivo Excel generado correctamente.");
    return;
  }
  const lines = [
    "Cafe Fusiones - Reporte de gestion",
    `Rango: ${filters.Desde} al ${filters.Hasta} | Canal: ${filters.Canal} | Mozo: ${filters.Mozo} | Area: ${filters.Area} | Categoria: ${filters.Categoria}`,
    "",
    `Ingresos: ${money(sum.income)}`, `Egresos: ${money(sum.expenses)}`, `Utilidad: ${money(sum.profit)}`, `Margen: ${sum.margin}%`,
    "",
    ...sheets.flatMap((sh) => [sh.name.toUpperCase(), ...sh.rows.slice(0, 14).map((row) => row.join(" | ")), ""])
  ];
  downloadBlob(buildSimplePdf(lines), `${base}.pdf`, "application/pdf");
  showToast("Archivo PDF generado correctamente.");
}
