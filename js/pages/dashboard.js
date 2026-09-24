// Cafe Fusiones - Dashboard / Inicio (solo la logica de esta pantalla).
// Todos los indicadores se calculan sobre el estado real: sin datos simulados.
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState } from "../core/storage.js";
import { icon, money, escapeHtml, trendClass } from "../core/utils.js";

const session = requireAuth();
const state = getState();

if (session) init(session.role);

function init(role) {
  renderSidebar("dashboard", role);
  // Acceso rapido a Ventas: boton normal en la cabecera, no un bloque aparte.
  renderTopbar({
    title: "Inicio",
    eyebrow: "Panel",
    showSearch: false,
    actions: canAccess(role, "ventas")
      ? `<a class="button button--primary" href="ventas.html?tab=salon&mode=map">${icon("receipt")}<span>Nueva venta</span></a>`
      : ""
  });

  const view = document.getElementById("view");
  const adminAuditButton = canAccess(role, "admin")
    ? '<a class="mini-button" href="admin.html">Ver registros</a>'
    : "";

  view.innerHTML = `
    <div class="view-stack">
      <section class="grid grid--4" aria-label="Indicadores principales">${metrics().map(renderMetric).join("")}</section>
      <section class="grid grid--2">
        <article class="panel">
          <div class="panel__header"><h2>Ventas por canal</h2><span class="status status--ok">Hoy</span></div>
          ${renderChannels()}
        </article>
        <article class="panel">
          <div class="panel__header"><h2>Auditoria</h2>${adminAuditButton}</div>
          ${renderAudit()}
        </article>
      </section>
    </div>`;
}

/* ==================== CALCULO DE INDICADORES ==================== */

function today() {
  return new Date().toISOString().slice(0, 10);
}

function salesOfToday() {
  const day = today();
  return (state.salesHistory || []).filter(
    (sale) => String(sale.closedAt || "").slice(0, 10) === day
  );
}

function activeOrders() {
  return (state.kitchenOrders || []).filter((order) => order.status !== "Entregado");
}

function lowStockItems() {
  return (state.inventory || []).filter(
    (item) => item.active !== false && Number(item.min || 0) > 0 && Number(item.stock || 0) <= Number(item.min || 0)
  );
}

function metrics() {
  const sales = salesOfToday();
  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const orders = activeOrders();
  const ready = orders.filter((order) => order.status === "Listo").length;
  const low = lowStockItems().length;
  const ticket = sales.length ? total / sales.length : 0;

  return [
    {
      label: "Ventas de hoy",
      value: money(total),
      trend: sales.length ? `${sales.length} ${sales.length === 1 ? "venta" : "ventas"}` : "Sin ventas",
      tone: sales.length ? "ok" : "neutral"
    },
    {
      label: "Pedidos activos",
      value: String(orders.length),
      trend: ready ? `${ready} listos` : "Ninguno",
      tone: ready ? "warn" : "neutral"
    },
    {
      label: "Ticket promedio",
      value: money(ticket),
      trend: sales.length ? "Promedio del dia" : "Sin datos",
      tone: "neutral"
    },
    {
      label: "Stock critico",
      value: String(low),
      trend: low ? "Revisar inventario" : "Todo en orden",
      tone: low ? "danger" : "ok"
    }
  ];
}

/* ==================== BLOQUES ==================== */

function renderMetric(metric) {
  return `<article class="metric-card"><div class="metric-card__top"><p>${escapeHtml(metric.label)}</p><span class="${trendClass(metric.tone)}">${escapeHtml(metric.trend)}</span></div><strong>${escapeHtml(metric.value)}</strong></article>`;
}

function renderChannels() {
  const sales = salesOfToday();

  if (!sales.length) {
    return '<p class="muted">Aun no hay ventas registradas hoy.</p>';
  }

  const byChannel = new Map();
  sales.forEach((sale) => {
    const channel = sale.channel || "Local";
    byChannel.set(channel, (byChannel.get(channel) || 0) + Number(sale.total || 0));
  });

  const total = [...byChannel.values()].reduce((sum, value) => sum + value, 0) || 1;

  const rows = [...byChannel.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => {
      const pct = Math.round((amount / total) * 100);
      return `<div class="bar-row"><span>${escapeHtml(label)}</span><span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span><strong>${money(amount)}</strong></div>`;
    })
    .join("");

  return `<div class="chart-bars">${rows}</div>`;
}

function renderAudit() {
  const events = (state.auditEvents || []).slice(0, 6);

  if (!events.length) {
    return '<p class="muted">Aun no hay movimientos registrados.</p>';
  }

  const rows = events
    .map((event) => {
      const time = event.time || String(event.at || "").slice(11, 16) || "--:--";
      return `<div class="timeline-item"><time>${escapeHtml(time)}</time><p><strong>${escapeHtml(event.user || "Sistema")}</strong><br><span class="muted">${escapeHtml(event.action || "")} · ${escapeHtml(event.module || "")}</span></p></div>`;
    })
    .join("");

  return `<div class="timeline">${rows}</div>`;
}
