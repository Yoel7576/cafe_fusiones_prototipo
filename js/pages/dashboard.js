// Cafe Fusiones - Dashboard / Inicio (solo la logica de esta pantalla).
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { icon, trendClass } from "../core/utils.js";
import { metrics, salesByChannel, auditEvents } from "../data/data.js";

const session = requireAuth();
if (session) init(session.role);

function init(role) {
  renderSidebar("dashboard", role);
  renderTopbar({ title: "Inicio", eyebrow: "Panel", showSearch: false });

  const view = document.getElementById("view");
  const adminAuditButton = canAccess(role, "admin")
    ? '<a class="mini-button" href="admin.html">Ver registros</a>'
    : "";

  view.innerHTML = `
    <div class="view-stack">
      <section class="home-cta">
        <div>
          <p class="eyebrow">Inicio</p>
          <h2>Agregar una venta</h2>
          <p>Registra pedidos de mesa o delivery desde un flujo simple para mozos y caja.</p>
        </div>
        <a class="button button--primary button--xl" href="ventas.html?tab=salon&mode=map">${icon("receipt")}<span>Nueva venta</span></a>
      </section>
      <section class="grid grid--3" aria-label="Indicadores principales">${metrics.map(renderMetric).join("")}</section>
      <section class="grid grid--2">
        <article class="panel">
          <div class="panel__header"><h2>Ventas por canal</h2><span class="status status--ok">Hoy</span></div>
          <div class="chart-bars">${salesByChannel.map(renderBar).join("")}</div>
        </article>
        <article class="panel">
          <div class="panel__header"><h2>Auditoria</h2>${adminAuditButton}</div>
          <div class="timeline">${auditEvents.map(renderAuditItem).join("")}</div>
        </article>
      </section>
    </div>`;
}

function renderMetric(metric) {
  return `<article class="metric-card"><div class="metric-card__top"><p>${metric.label}</p><span class="${trendClass(metric.tone)}">${metric.trend}</span></div><strong>${metric.value}</strong><span class="muted">Actualizado hace 2 min</span></article>`;
}

function renderBar(item) {
  return `<div class="bar-row"><span>${item.label}</span><span class="bar-track"><span class="bar-fill" style="width:${item.value}%"></span></span><strong>${item.amount}</strong></div>`;
}

function renderAuditItem(item) {
  return `<div class="timeline-item"><time>${item.time}</time><p><strong>${item.user}</strong><br><span class="muted">${item.action} · ${item.module}</span></p></div>`;
}
