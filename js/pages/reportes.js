// Cafe Fusiones - Reportes (solo la logica de esta pantalla).
// Mejoras del jefe: SIN campo "Periodo" (solo rango Desde/Hasta), tarjetas de
// Ingresos/Egresos/Utilidad/Margen ARRIBA, y sin el termino "CRM".
import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState } from "../core/storage.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, statusClass, trendClass, matchesSearch, formatDate, downloadBlob, xmlEscape, buildSimplePdf } from "../core/utils.js";
import { reportSalesRows, reportExpenseRows } from "../data/data.js";

const session = requireAuth();
const state = getState();
const ui = { search: "", from: "2026-07-01", to: "2026-07-06", channel: "Todos", staff: "Todos", segment: "Todos", level: "Todos" };
const view = document.getElementById("view");

if (session) {
  renderSidebar("reportes", session.role);
  renderTopbar({ title: "Reportes", eyebrow: "Modulo", searchPlaceholder: "Buscar producto o mozo", onSearch: (q) => { ui.search = q; render(); } });
  render();
}

function inRange(date) { return date >= ui.from && date <= ui.to; }

function sales() {
  return reportSalesRows.filter((r) =>
    inRange(r.date) &&
    (ui.channel === "Todos" || r.channel === ui.channel) &&
    (ui.staff === "Todos" || r.staff === ui.staff) &&
    matchesSearch(ui.search, r.product, r.category, r.staff, r.channel));
}
function expenses() { return reportExpenseRows.filter((r) => inRange(r.date)); }

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
  const customers = state.customers.filter((c) =>
    (ui.segment === "Todos" || c.segment === ui.segment) &&
    (ui.level === "Todos" || c.level === ui.level) &&
    matchesSearch(ui.search, c.name, c.segment, c.level));
  const totalVisits = customers.reduce((a, c) => a + c.visits, 0);
  const avgSat = customers.length ? Math.round(customers.reduce((a, c) => a + c.satisfaction, 0) / customers.length) : 0;
  const segments = ["Todos", ...new Set(state.customers.map((c) => c.segment))];
  const levels = ["Todos", ...new Set(state.customers.map((c) => c.level))];
  const channels = ["Todos", ...new Set(reportSalesRows.map((r) => r.channel))];
  const staff = ["Todos", ...new Set(reportSalesRows.map((r) => r.staff))];
  const lowStock = state.inventory.filter((i) => i.stock <= i.min);

  view.innerHTML = `
    <div class="view-stack reports-view">
      <section class="grid grid--4 report-kpis" aria-label="Indicadores de ventas">
        <article class="metric-card"><div class="metric-card__top"><p>Ingresos</p><span class="trend">Ventas</span></div><strong>${money(sum.income)}</strong><span class="muted">Rango filtrado</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Egresos</p><span class="trend trend--warn">Costos</span></div><strong>${money(sum.expenses)}</strong><span class="muted">Insumos y operacion</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Utilidad</p><span class="${trendClass(sum.profit >= 0 ? "ok" : "danger")}">Neta</span></div><strong>${money(sum.profit)}</strong><span class="muted">Ingresos menos egresos</span></article>
        <article class="metric-card"><div class="metric-card__top"><p>Margen</p><span class="trend">%</span></div><strong>${sum.margin}%</strong><span class="muted">Sobre ingresos</span></article>
      </section>

      <section class="panel report-filter-panel">
        <div class="panel__header panel__header--wrap"><h2>Filtros de reportes</h2><div class="report-actions"><button class="mini-button" type="button" data-export="pdf">Exportar PDF</button><button class="mini-button" type="button" data-export="excel">Exportar Excel</button></div></div>
        <div class="filter-row report-filter-row">
          <label>Desde<input type="date" data-filter="from" value="${ui.from}" max="${ui.to}"></label>
          <label>Hasta<input type="date" data-filter="to" value="${ui.to}" min="${ui.from}"></label>
          <label>Canal<select data-filter="channel">${channels.map((c) => `<option value="${c}" ${c === ui.channel ? "selected" : ""}>${c}</option>`).join("")}</select></label>
          <label>Mozo<select data-filter="staff">${staff.map((c) => `<option value="${c}" ${c === ui.staff ? "selected" : ""}>${c}</option>`).join("")}</select></label>
        </div>
      </section>

      <section class="reports-grid">
        <article class="panel">
          <div class="panel__header"><h2>Ingresos y egresos</h2><span class="status status--info">Caja</span></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Tipo</th><th>Detalle</th><th>Canal</th><th>Responsable</th><th>Monto</th></tr></thead><tbody>${financialRows(s, e)}</tbody></table></div>
        </article>
        <article class="panel">
          <div class="panel__header"><h2>Mozos con mayores ventas</h2><span class="status status--ok">Rendimiento</span></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Mozo</th><th>Ventas</th><th>Pedidos</th><th>Ticket prom.</th></tr></thead><tbody>${staffPerformance(s).map((r) => `<tr><td><strong>${r.staff}</strong></td><td>${money(r.income)}</td><td>${r.orders}</td><td>${money(r.average)}</td></tr>`).join("")}</tbody></table></div>
        </article>
      </section>

      <section class="reports-grid">
        <article class="panel">
          <div class="panel__header"><h2>Platos mas vendidos</h2><span class="status">Productos</span></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Categoria</th><th>Unidades</th><th>Ingreso</th></tr></thead><tbody>${productPerformance(s).map((r) => `<tr><td><strong>${r.product}</strong></td><td>${r.category}</td><td>${r.qty}</td><td>${money(r.income)}</td></tr>`).join("")}</tbody></table></div>
        </article>
        <article class="panel">
          <div class="panel__header"><h2>Clientes</h2><span class="status status--info">${customers.length} activos</span></div>
          <div class="grid grid--3 compact-kpis"><article><strong>${customers.length}</strong><span>Clientes</span></article><article><strong>${totalVisits}</strong><span>Visitas</span></article><article><strong>${avgSat}%</strong><span>Satisfaccion</span></article></div>
          <div class="filter-row"><label>Segmento<select data-filter="segment">${segments.map((x) => `<option value="${x}" ${x === ui.segment ? "selected" : ""}>${x}</option>`).join("")}</select></label><label>Nivel<select data-filter="level">${levels.map((x) => `<option value="${x}" ${x === ui.level ? "selected" : ""}>${x}</option>`).join("")}</select></label></div>
          <div class="table-wrap"><table class="data-table"><thead><tr><th>Cliente</th><th>Segmento</th><th>Nivel</th><th>Puntos</th><th>Visitas</th></tr></thead><tbody>${customers.map((c) => `<tr><td><strong>${escapeHtml(c.name)}</strong></td><td>${c.segment}</td><td><span class="${statusClass(c.level)}">${c.level}</span></td><td>${c.points}</td><td>${c.visits}</td></tr>`).join("") || '<tr><td colspan="5" class="muted text-center">No hay datos para mostrar</td></tr>'}</tbody></table></div>
        </article>
      </section>

      <section class="report-layout">
        <article class="panel">
          <div class="panel__header"><h2>Ventas por canal</h2><span class="status">Distribucion</span></div>
          <div class="chart-bars">${channelPerformance(s).map((i) => `<div class="bar-row"><span>${i.label}</span><span class="bar-track"><span class="bar-fill" style="width:${i.value}%"></span></span><strong>${i.amount}</strong></div>`).join("")}</div>
        </article>
        ${donutCard(customers)}
      </section>

      <section class="panel">
        <div class="panel__header panel__header--wrap"><h2>Reporte de stock actual</h2><div class="report-actions"><span class="status status--danger">${lowStock.length} en alerta</span><button class="mini-button" type="button" data-export-stock>Exportar stock (PDF)</button></div></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Categoria</th><th>Stock</th><th>Minimo</th><th>Estado</th></tr></thead><tbody>${stockRows()}</tbody></table></div>
      </section>
    </div>`;

  wire();
}

function stockRows() {
  return state.inventory.map((i) => {
    const label = i.stock <= i.min ? "Bajo" : "Disponible";
    return `<tr><td><strong>${escapeHtml(i.item)}</strong></td><td>${i.category}</td><td>${i.stock} ${i.unit}</td><td>${i.min} ${i.unit}</td><td><span class="${statusClass(label)}">${label}</span></td></tr>`;
  }).join("") || '<tr><td colspan="5" class="muted text-center">Sin insumos.</td></tr>';
}

function exportStock() {
  const lines = [
    "Cafe Fusiones - Reporte de stock actual",
    `Generado: ${new Date().toLocaleString("es-PE")}`,
    "",
    ...state.inventory.map((i) => `${i.item} (${i.category}): ${i.stock} ${i.unit} | minimo ${i.min} ${i.unit} | ${i.stock <= i.min ? "BAJO" : "OK"}`)
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
  view.querySelectorAll("[data-export]").forEach((b) => b.addEventListener("click", () => exportReport(b.dataset.export)));
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
  const grouped = s.reduce((acc, r) => { (acc[r.product] ??= { product: r.product, category: r.category, qty: 0, income: 0 }); acc[r.product].qty += r.qty; acc[r.product].income += r.income; return acc; }, {});
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

/* ---- Exportacion ---- */
function exportReport(type) {
  const s = sales(); const e = expenses(); const sum = summary(s, e);
  const filters = { Desde: formatDate(ui.from), Hasta: formatDate(ui.to), Canal: ui.channel, Mozo: ui.staff };
  const base = `Cafe_Fusiones_Reportes_${ui.from}_${ui.to}`;
  const sheets = [
    { name: "Resumen", rows: [["Indicador", "Valor"], ["Desde", filters.Desde], ["Hasta", filters.Hasta], ["Canal", filters.Canal], ["Mozo", filters.Mozo], ["Ingresos", money(sum.income)], ["Egresos", money(sum.expenses)], ["Utilidad", money(sum.profit)], ["Margen", `${sum.margin}%`]] },
    { name: "Ingresos y egresos", rows: [["Tipo", "Detalle", "Canal/Tipo", "Responsable", "Monto"], ...s.map((r) => ["Ingreso", r.product, r.channel, r.staff, money(r.income)]), ...e.map((r) => ["Egreso", r.detail, r.type, "Administracion", money(r.amount)])] },
    { name: "Mozos", rows: [["Mozo", "Ventas", "Pedidos", "Ticket promedio"], ...staffPerformance(s).map((r) => [r.staff, money(r.income), r.orders, money(r.average)])] },
    { name: "Productos", rows: [["Producto", "Categoria", "Unidades", "Ingreso"], ...productPerformance(s).map((r) => [r.product, r.category, r.qty, money(r.income)])] }
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
    `Rango: ${filters.Desde} al ${filters.Hasta} | Canal: ${filters.Canal} | Mozo: ${filters.Mozo}`,
    "",
    `Ingresos: ${money(sum.income)}`, `Egresos: ${money(sum.expenses)}`, `Utilidad: ${money(sum.profit)}`, `Margen: ${sum.margin}%`,
    "",
    ...sheets.flatMap((sh) => [sh.name.toUpperCase(), ...sh.rows.slice(0, 14).map((row) => row.join(" | ")), ""])
  ];
  downloadBlob(buildSimplePdf(lines), `${base}.pdf`, "application/pdf");
  showToast("Archivo PDF generado correctamente.");
}
