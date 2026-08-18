// Cafe Fusiones - Produccion KDS V4
// Ruta esperada: js/pages/ventas-kds.js
//
// Modos:
//   ventas-kds.html?station=Todas
//   ventas-kds.html?station=Barra
//   ventas-kds.html?station=Cocina
//
// Flujos:
//   Preparacion: Nuevo -> Preparando -> Listo -> Entregado
//   Despacho directo: Pendiente de entrega -> Entregado
//
// La pantalla sincroniza cada cambio con la mesa/pedido del mozo para que
// Ventas conozca en todo momento el estado real de cada producto.

import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState, nextId, addAuditEvent } from "../core/storage.js";
import { openModal, closeModal, closeIcon, isModalOpen } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { icon, escapeHtml, matchesSearch, statusClass } from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(window.location.search);

const STATIONS = ["Todas", "Barra", "Cocina"];
const FILTERS = ["Todos", "Nuevos", "Preparando", "Listos", "Demorados"];

const ui = {
  station: "Todas",
  filter: "Todos",
  search: "",
  now: Date.now()
};

let timer = null;

if (session) init();

/* ==========================================================================
   INICIO / NORMALIZACION
   ========================================================================== */

function init() {
  normalizeState();
  ui.station = resolveInitialStation();

  renderSidebar("ventas", session.role);
  renderTopbar({
    title: "Producción",
    eyebrow: stationEyebrow(),
    searchPlaceholder: "Buscar mesa, pedido o producto...",
    onSearch: (query) => {
      ui.search = query || "";
      render();
    }
  });

  render();

  // Los contadores de tiempo se refrescan sin necesidad de recargar.
  timer = window.setInterval(() => {
    ui.now = Date.now();
    if (!isModalOpen()) render();
  }, 30000);

  window.addEventListener("beforeunload", () => {
    if (timer) window.clearInterval(timer);
  });
}

function normalizeState() {
  state.tables ||= [];
  state.menuItems ||= [];
  state.kitchenOrders ||= [];
  state.dispatchOrders ||= [];
  state.wasteRecords ||= [];
  state.inventory ||= [];
  state.inventoryMovements ||= [];
  state.auditEvents ||= [];
  state.stations ||= [];
  state.changeRequests ||= [];

  state.kitchenOrders.forEach((order) => {
    order.flow = "preparation";
    order.items ||= [];

    order.items = order.items.map((item, index) => {
      const product = productById(item.productId || item.id);
      return {
        ...item,
        productId: item.productId || item.id,
        lineId: item.lineId || `KDS-${order.id}-${index + 1}`,
        station: item.station || product?.station || "Cocina",
        operationType: "preparation",
        requiresPreparation: true,
        estimatedTime: Number(item.estimatedTime || product?.estimatedTime || stationTarget(item.station || product?.station)),
        modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
        note: item.note || "",
        status: normalizePreparationStatus(item.status || "Nuevo")
      };
    });

    order.status = aggregatePreparationStatus(order.items);
  });

  // El storage V6 inicial no trae una cola de despacho directo; la generamos
  // desde las lineas existentes de las mesas para no perder gaseosas/agua/etc.
  ensureDispatchQueuesFromTables();

  state.dispatchOrders.forEach((order) => {
    order.flow = "dispatch";
    order.items ||= [];

    order.items = order.items.map((item, index) => {
      const product = productById(item.productId || item.id);
      return {
        ...item,
        productId: item.productId || item.id,
        lineId: item.lineId || `DSP-${order.id}-${index + 1}`,
        station: item.station || product?.dispatchStation || product?.station || "Despacho",
        operationType: item.operationType || product?.operationType || "direct_dispatch",
        requiresPreparation: false,
        inventoryMode: item.inventoryMode || product?.inventoryMode || "direct",
        inventoryItemId: item.inventoryItemId || product?.inventoryItemId || null,
        estimatedCost: item.estimatedCost ?? product?.estimatedCost ?? null,
        modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
        note: item.note || "",
        status: normalizeDispatchStatus(item.status || "Pendiente de entrega")
      };
    });

    order.status = aggregateDispatchStatus(order.items);
  });

  syncAllQueuesToTables();
  saveState(state);
}

function resolveInitialStation() {
  const query = String(params.get("station") || "").trim().toLowerCase();
  const role = String(session.role || "").toLowerCase();
  const ownStation = String(session.station || "").toLowerCase();

  if (role.includes("barista") || ownStation === "barra") return "Barra";
  if (role.includes("cocina") || ownStation === "cocina") return "Cocina";

  if (query === "barra") return "Barra";
  if (query === "cocina") return "Cocina";
  return "Todas";
}

function stationEyebrow() {
  return ui.station === "Todas" ? "Ventas · Todas las estaciones" : `Ventas · ${ui.station}`;
}

function allowedStations() {
  const role = String(session.role || "").toLowerCase();
  const ownStation = String(session.station || "").toLowerCase();

  if (role.includes("barista") || ownStation === "barra") return ["Barra"];
  if (role.includes("cocina") || ownStation === "cocina") return ["Cocina"];
  return STATIONS;
}

/* ==========================================================================
   RENDER PRINCIPAL
   ========================================================================== */

function render() {
  const preparation = preparationEntries();
  const dispatch = dispatchEntries();
  const metrics = calculateMetrics(preparation, dispatch);

  view.innerHTML = `
    <div class="kds-v4">
      ${kdsHeader(metrics)}
      ${metricStrip(metrics)}
      ${filterBar()}
      ${preparationBoard(preparation)}
      ${directDispatchSection(dispatch)}
      ${recentChangesSection()}
    </div>`;

  wire();
}

function kdsHeader(metrics) {
  const available = allowedStations();
  const stationTitle = ui.station === "Todas" ? "Produccion general" : ui.station;
  const target = ui.station === "Todas" ? null : stationTarget(ui.station);

  return `
    <section class="panel kds-header-panel">
      <div class="kds-header-main">
        <div class="kds-header-title">
          <p class="eyebrow">KDS · Pantalla de produccion</p>
          <div>
            <h2>${escapeHtml(stationTitle)}</h2>
            <span class="kds-live-dot"><i></i> En vivo</span>
          </div>
          <p>
            ${target
              ? `Objetivo de estacion: ${target} min. Los pedidos demorados se resaltan automaticamente.`
              : "Supervision conjunta de Barra y Cocina. Cada estacion ve solamente los productos que le corresponden."}
          </p>
        </div>

        <div class="kds-header-actions">
          <div class="kds-clock">
            <span>${formatClock(ui.now)}</span>
            <small>${formatDay(ui.now)}</small>
          </div>
          <button class="mini-button" type="button" data-refresh-kds>
            ↻ Actualizar
          </button>
          <button class="mini-button" type="button" data-fullscreen>
            ⛶ Pantalla completa
          </button>
        </div>
      </div>

      <div class="kds-station-tabs" role="tablist" aria-label="Estaciones de produccion">
        ${available.map((station) => `
          <button
            type="button"
            class="kds-station-tab ${ui.station === station ? "is-active" : ""}"
            data-station="${station}"
            role="tab"
            aria-selected="${ui.station === station ? "true" : "false"}"
          >
            <span>${stationIcon(station)}</span>
            <strong>${escapeHtml(station)}</strong>
            <small>${stationCount(station)}</small>
          </button>
        `).join("")}
      </div>
    </section>`;
}

function metricStrip(metrics) {
  return `
    <section class="kds-metrics" aria-label="Indicadores operativos">
      ${metricCard("Nuevos", metrics.newCount, "Esperando inicio", "new")}
      ${metricCard("Preparando", metrics.preparingCount, "En trabajo", "preparing")}
      ${metricCard("Listos", metrics.readyCount, "Pendientes de entrega", "ready")}
      ${metricCard("Demorados", metrics.delayedCount, metrics.delayedCount ? "Requieren atencion" : "Dentro del objetivo", "delay")}
    </section>`;
}

function metricCard(label, value, detail, tone) {
  return `
    <article class="panel kds-metric kds-metric--${tone}">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${Number(value || 0)}</strong>
      </div>
      <small>${escapeHtml(detail)}</small>
    </article>`;
}

function filterBar() {
  return `
    <section class="panel kds-filter-bar">
      <div class="kds-filter-buttons">
        ${FILTERS.map((filter) => `
          <button
            type="button"
            class="kds-filter-button ${ui.filter === filter ? "is-active" : ""}"
            data-kds-filter="${filter}"
          >${escapeHtml(filter)}</button>
        `).join("")}
      </div>

      <div class="kds-filter-legend">
        <span><i class="kds-dot kds-dot--normal"></i> Normal</span>
        <span><i class="kds-dot kds-dot--warning"></i> Proximo al limite</span>
        <span><i class="kds-dot kds-dot--danger"></i> Demorado</span>
      </div>
    </section>`;
}

/* ==========================================================================
   TABLERO DE PREPARACION
   ========================================================================== */

function preparationBoard(entries) {
  const columns = [
    { key: "Nuevo", label: "Nuevos", helper: "Esperando inicio" },
    { key: "Preparando", label: "En preparacion", helper: "Produccion activa" },
    { key: "Listo", label: "Listos", helper: "Esperando entrega" }
  ];

  return `
    <section class="kds-board-wrap">
      <div class="kds-board">
        ${columns.map((column) => {
          const items = entries.filter((entry) => entry.status === column.key);
          return `
            <section class="kds-column kds-column--${statusSlug(column.key)}">
              <header class="kds-column-head">
                <div>
                  <span>${escapeHtml(column.label)}</span>
                  <small>${escapeHtml(column.helper)}</small>
                </div>
                <strong>${items.length}</strong>
              </header>

              <div class="kds-column-body">
                ${items.map(kdsOrderCard).join("") || kdsColumnEmpty(column.key)}
              </div>
            </section>`;
        }).join("")}
      </div>
    </section>`;
}

function kdsOrderCard(entry) {
  const order = entry.order;
  const items = entry.items;
  const elapsed = entry.elapsed;
  const timing = entry.timing;
  const replacement = items.some((item) => item.replacementOfLineId);
  const modified = items.some((item) => item.updatedAt && entry.status === "Nuevo");
  const changeRequested = items.some(hasPendingChangeRequest);

  return `
    <article class="kds-order-card kds-order-card--${timing.tone} ${changeRequested ? "has-change-request" : ""}">
      <header class="kds-order-card__head">
        <div>
          <div class="kds-order-id-row">
            <strong>${escapeHtml(order.table || order.channel || "Pedido")}</strong>
            <span>${escapeHtml(order.id)}</span>
          </div>
          <small>${escapeHtml(order.channel || "Local")} · ${formatOrderTime(order.createdAt)}</small>
        </div>

        <div class="kds-time kds-time--${timing.tone}">
          <strong>${formatElapsed(elapsed)}</strong>
          <small>${timing.label}</small>
        </div>
      </header>

      ${(replacement || modified || changeRequested) ? `
        <div class="kds-alert-row">
          ${replacement ? `<span class="kds-mini-alert kds-mini-alert--change">↻ Reemplazo</span>` : ""}
          ${modified ? `<span class="kds-mini-alert kds-mini-alert--edit">✎ Modificado</span>` : ""}
          ${changeRequested ? `<span class="kds-mini-alert kds-mini-alert--danger">! Cambio solicitado</span>` : ""}
        </div>
      ` : ""}

      <div class="kds-order-items">
        ${items.map((item) => kdsItemRow(item, order)).join("")}
      </div>

      ${order.notes ? `<p class="kds-order-note">${escapeHtml(order.notes)}</p>` : ""}

      <footer class="kds-order-card__footer">
        <span>${stationIcon(entry.station)} ${escapeHtml(entry.station)}</span>
        ${cardPrimaryAction(entry)}
      </footer>
    </article>`;
}

function kdsItemRow(item, order) {
  const details = [
    ...(item.modifiers || []),
    item.note
  ].filter(Boolean);

  return `
    <div class="kds-item-row ${item.replacementOfLineId ? "is-replacement" : ""}">
      <div class="kds-item-qty">${Number(item.qty || 1)}×</div>
      <div class="kds-item-main">
        <strong>${escapeHtml(item.name)}</strong>
        ${details.length ? `<small>${escapeHtml(details.join(" · "))}</small>` : ""}
        ${item.replacementOfLineId ? `<span>Reemplazo por cambio del cliente</span>` : ""}
        ${item.updatedAt && normalizePreparationStatus(item.status) === "Nuevo" ? `<span>Actualizado antes de iniciar</span>` : ""}
      </div>
      ${hasPendingChangeRequest(item) ? `
        <button
          class="kds-item-change-button"
          type="button"
          data-review-change="${escapeHtml(item.lineId)}"
          data-order-id="${escapeHtml(order.id)}"
        >Revisar</button>
      ` : ""}
    </div>`;
}

function cardPrimaryAction(entry) {
  const lineIds = entry.items.map((item) => item.lineId).join(",");

  if (entry.status === "Nuevo") {
    return `
      <button
        class="button button--primary kds-action-button"
        type="button"
        data-kds-action="start"
        data-order-id="${entry.order.id}"
        data-line-ids="${escapeHtml(lineIds)}"
      >Iniciar preparacion</button>`;
  }

  if (entry.status === "Preparando") {
    return `
      <button
        class="button button--primary kds-action-button"
        type="button"
        data-kds-action="ready"
        data-order-id="${entry.order.id}"
        data-line-ids="${escapeHtml(lineIds)}"
      >Marcar listo</button>`;
  }

  return `
    <button
      class="button button--secondary kds-action-button kds-action-button--deliver"
      type="button"
      data-kds-action="deliver"
      data-order-id="${entry.order.id}"
      data-line-ids="${escapeHtml(lineIds)}"
    >Confirmar entrega</button>`;
}

function kdsColumnEmpty(status) {
  const copy = {
    Nuevo: ["✓", "Sin pedidos nuevos", "Los pedidos enviados por el mozo apareceran aqui."],
    Preparando: ["☕", "Sin preparaciones activas", "Inicia un pedido nuevo para comenzar."],
    Listo: ["✓", "Nada esperando entrega", "Los productos terminados apareceran aqui."]
  }[status];

  return `
    <div class="kds-column-empty">
      <span>${copy[0]}</span>
      <strong>${copy[1]}</strong>
      <p>${copy[2]}</p>
    </div>`;
}

/* ==========================================================================
   DESPACHO DIRECTO
   ========================================================================== */

function directDispatchSection(entries) {
  const visible = entries.filter((entry) => entry.status === "Pendiente de entrega");

  // Cuando se filtra especificamente por estados de preparacion no cargamos
  // la pantalla con un bloque que no aporta a ese filtro.
  const hiddenByFilter = ["Nuevos", "Preparando", "Listos", "Demorados"].includes(ui.filter);
  if (hiddenByFilter && !visible.some((entry) => ui.filter === "Demorados" && entry.timing.tone === "danger")) {
    return "";
  }

  return `
    <section class="panel kds-dispatch-section">
      <header class="kds-dispatch-head">
        <div>
          <p class="eyebrow">Sin preparacion</p>
          <h2>Despacho directo</h2>
          <p>Gaseosas, agua, cerveza y otros productos listos para entregar.</p>
        </div>
        <span class="kds-dispatch-count">${visible.length} pendiente${visible.length === 1 ? "" : "s"}</span>
      </header>

      <div class="kds-dispatch-grid">
        ${visible.map(dispatchCard).join("") || `
          <div class="kds-dispatch-empty">
            <span>✓</span>
            <strong>Sin productos por despachar</strong>
            <p>Los productos de venta directa no pasan por “En preparacion”.</p>
          </div>
        `}
      </div>
    </section>`;
}

function dispatchCard(entry) {
  const order = entry.order;
  const timing = entry.timing;

  return `
    <article class="kds-dispatch-card kds-dispatch-card--${timing.tone}">
      <div class="kds-dispatch-card__top">
        <div>
          <strong>${escapeHtml(order.table || "Pedido")}</strong>
          <small>${escapeHtml(order.orderId || order.id)} · ${escapeHtml(entry.station)}</small>
        </div>
        <span class="kds-time kds-time--${timing.tone}">
          <strong>${formatElapsed(entry.elapsed)}</strong>
        </span>
      </div>

      <div class="kds-dispatch-items">
        ${entry.items.map((item) => `
          <div>
            <span>${Number(item.qty || 1)}×</span>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
          </div>
        `).join("")}
      </div>

      <button
        class="button button--primary kds-dispatch-button"
        type="button"
        data-dispatch-deliver
        data-dispatch-id="${order.id}"
        data-line-ids="${escapeHtml(entry.items.map((item) => item.lineId).join(","))}"
      >Entregar producto${entry.items.reduce((n, item) => n + Number(item.qty || 1), 0) === 1 ? "" : "s"}</button>
    </article>`;
}

/* ==========================================================================
   CAMBIOS / MERMAS RECIENTES
   ========================================================================== */

function recentChangesSection() {
  const records = (state.wasteRecords || [])
    .filter((record) => record.source === "Pedido" || String(record.reason || "").toLowerCase().includes("cambio"))
    .slice(0, 3);

  const changedLines = state.tables
    .flatMap((table) => (table.items || []).map((item) => ({ table, item })))
    .filter(({ item }) => item.changeImpact || item.cancelReason)
    .slice(-3)
    .reverse();

  if (!records.length && !changedLines.length) return "";

  return `
    <section class="panel kds-recent-changes">
      <header>
        <div>
          <p class="eyebrow">Trazabilidad</p>
          <h2>Cambios y mermas recientes</h2>
        </div>
        <a class="mini-button" href="inventario.html">Ver inventario</a>
      </header>

      <div class="kds-change-list">
        ${records.map((record) => `
          <article>
            <span class="kds-change-icon">!</span>
            <div>
              <strong>${escapeHtml(record.item || "Producto")}</strong>
              <small>${escapeHtml(record.table || "Pedido")} · ${escapeHtml(record.type || "Merma")}</small>
            </div>
            <b>${escapeHtml(record.reason || "Cambio solicitado")}</b>
          </article>
        `).join("")}
        ${!records.length ? changedLines.map(({ table, item }) => `
          <article>
            <span class="kds-change-icon">↻</span>
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <small>${escapeHtml(table.name)} · ${escapeHtml(item.originalStatus || item.status || "Cambio")}</small>
            </div>
            <b>${escapeHtml(item.changeImpact || item.cancelReason || "Cambio")}</b>
          </article>
        `).join("") : ""}
      </div>
    </section>`;
}

/* ==========================================================================
   ENTRADAS DEL TABLERO / AGRUPACION
   ========================================================================== */

function preparationEntries() {
  const groups = [];

  state.kitchenOrders.forEach((order) => {
    const activeItems = (order.items || []).filter((item) => {
      const status = normalizePreparationStatus(item.status);
      return status !== "Cancelado" && status !== "Entregado" && stationMatches(item.station);
    });

    const byStationStatus = new Map();

    activeItems.forEach((item) => {
      const status = normalizePreparationStatus(item.status);
      const key = `${item.station}|${status}`;
      if (!byStationStatus.has(key)) byStationStatus.set(key, []);
      byStationStatus.get(key).push(item);
    });

    byStationStatus.forEach((items, key) => {
      const [station, status] = key.split("|");
      const elapsed = orderElapsed(order, items);
      const target = groupTargetMinutes(items, station);
      const timing = timingInfo(elapsed, target, status);

      const entry = { order, station, status, items, elapsed, target, timing };
      if (entryMatchesFilters(entry)) groups.push(entry);
    });
  });

  return groups.sort((a, b) => {
    const toneRank = { danger: 0, warning: 1, normal: 2, done: 3 };
    const ta = toneRank[a.timing.tone] ?? 4;
    const tb = toneRank[b.timing.tone] ?? 4;
    if (ta !== tb) return ta - tb;
    return b.elapsed - a.elapsed;
  });
}

function dispatchEntries() {
  const groups = [];

  state.dispatchOrders.forEach((order) => {
    const activeItems = (order.items || []).filter((item) => {
      const status = normalizeDispatchStatus(item.status);
      return status !== "Cancelado" && status !== "Entregado" && stationMatches(item.station);
    });

    const byStation = new Map();
    activeItems.forEach((item) => {
      const station = item.station || "Despacho";
      if (!byStation.has(station)) byStation.set(station, []);
      byStation.get(station).push(item);
    });

    byStation.forEach((items, station) => {
      const status = aggregateDispatchStatus(items);
      const elapsed = orderElapsed(order, items);
      const target = stationTarget(station, 3);
      const timing = timingInfo(elapsed, target, status);
      const entry = { order, station, status, items, elapsed, target, timing };

      if (dispatchEntryMatchesFilters(entry)) groups.push(entry);
    });
  });

  return groups.sort((a, b) => b.elapsed - a.elapsed);
}

function entryMatchesFilters(entry) {
  const searchMatches = matchesSearch(
    ui.search,
    entry.order.id,
    entry.order.table,
    entry.order.channel,
    entry.station,
    ...entry.items.flatMap((item) => [item.name, ...(item.modifiers || []), item.note])
  );

  if (!searchMatches) return false;

  if (ui.filter === "Nuevos" && entry.status !== "Nuevo") return false;
  if (ui.filter === "Preparando" && entry.status !== "Preparando") return false;
  if (ui.filter === "Listos" && entry.status !== "Listo") return false;
  if (ui.filter === "Demorados" && entry.timing.tone !== "danger") return false;

  return true;
}

function dispatchEntryMatchesFilters(entry) {
  const searchMatches = matchesSearch(
    ui.search,
    entry.order.id,
    entry.order.orderId,
    entry.order.table,
    entry.order.channel,
    entry.station,
    ...entry.items.flatMap((item) => [item.name, item.note])
  );

  if (!searchMatches) return false;
  if (ui.filter === "Demorados") return entry.timing.tone === "danger";
  if (["Nuevos", "Preparando", "Listos"].includes(ui.filter)) return false;
  return true;
}

function stationMatches(station) {
  if (ui.station === "Todas") return ["Barra", "Cocina", "Despacho"].includes(station);
  if (ui.station === "Barra") return station === "Barra";
  if (ui.station === "Cocina") return station === "Cocina";
  return true;
}

function calculateMetrics(preparation, dispatch) {
  // Para los KPI ignoramos el filtro de estado, pero respetamos estación/búsqueda.
  const priorFilter = ui.filter;
  ui.filter = "Todos";
  const allPrep = preparationEntries();
  const allDispatch = dispatchEntries();
  ui.filter = priorFilter;

  return {
    newCount: allPrep.filter((entry) => entry.status === "Nuevo").length,
    preparingCount: allPrep.filter((entry) => entry.status === "Preparando").length,
    readyCount:
      allPrep.filter((entry) => entry.status === "Listo").length +
      allDispatch.filter((entry) => entry.status === "Pendiente de entrega").length,
    delayedCount:
      allPrep.filter((entry) => entry.timing.tone === "danger").length +
      allDispatch.filter((entry) => entry.timing.tone === "danger").length
  };
}

function stationCount(station) {
  const previous = ui.station;
  ui.station = station;
  const count = preparationEntries().length + dispatchEntries().length;
  ui.station = previous;
  return count;
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */

function wire() {
  view.querySelectorAll("[data-station]").forEach((button) => {
    button.addEventListener("click", () => {
      const station = button.dataset.station;
      if (!allowedStations().includes(station)) return;
      ui.station = station;
      history.replaceState({}, "", `ventas-kds.html?station=${encodeURIComponent(station)}`);
      render();
    });
  });

  view.querySelectorAll("[data-kds-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.filter = button.dataset.kdsFilter;
      render();
    });
  });

  view.querySelectorAll("[data-kds-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.kdsAction;
      const orderId = button.dataset.orderId;
      const lineIds = String(button.dataset.lineIds || "").split(",").filter(Boolean);

      if (action === "start") setPreparationStatus(orderId, lineIds, "Preparando");
      if (action === "ready") setPreparationStatus(orderId, lineIds, "Listo");
      if (action === "deliver") setPreparationStatus(orderId, lineIds, "Entregado");
    });
  });

  view.querySelectorAll("[data-dispatch-deliver]").forEach((button) => {
    button.addEventListener("click", () => {
      const lineIds = String(button.dataset.lineIds || "").split(",").filter(Boolean);
      deliverDirectItems(button.dataset.dispatchId, lineIds);
    });
  });

  view.querySelectorAll("[data-review-change]").forEach((button) => {
    button.addEventListener("click", () => {
      reviewChangeRequest(button.dataset.orderId, button.dataset.reviewChange);
    });
  });

  view.querySelector("[data-refresh-kds]")?.addEventListener("click", () => {
    ui.now = Date.now();
    normalizeState();
    render();
    showToast("Produccion actualizada.");
  });

  view.querySelector("[data-fullscreen]")?.addEventListener("click", toggleFullscreen);
}

/* ==========================================================================
   CAMBIO DE ESTADO - PREPARACION
   ========================================================================== */

function setPreparationStatus(orderId, lineIds, nextStatus) {
  const order = state.kitchenOrders.find((item) => item.id === orderId);
  if (!order) {
    showToast("No encontramos el pedido.");
    return;
  }

  const now = new Date().toISOString();
  const selected = (order.items || []).filter((item) => lineIds.includes(item.lineId));

  if (!selected.length) return;

  // Si hay un cambio pendiente no permitimos iniciar/terminar silenciosamente.
  if (selected.some(hasPendingChangeRequest)) {
    showToast("Revisa primero el cambio solicitado por el cliente.");
    return;
  }

  selected.forEach((item) => {
    const current = normalizePreparationStatus(item.status);
    if (!isValidPreparationTransition(current, nextStatus)) return;

    item.status = nextStatus;
    item.updatedAt = now;
    item.updatedBy = session.name;

    if (nextStatus === "Preparando") {
      item.startedAt ||= now;
      item.startedBy ||= session.name;
    }
    if (nextStatus === "Listo") {
      item.readyAt = now;
      item.readyBy = session.name;
    }
    if (nextStatus === "Entregado") {
      item.deliveredAt = now;
      item.deliveredBy = session.name;
    }

    syncQueueLineToTable(item, order, nextStatus, "preparation");
  });

  order.status = aggregatePreparationStatus(order.items);
  order.updatedAt = now;

  const actionLabel = {
    Preparando: "Inicio de preparacion",
    Listo: "Producto listo",
    Entregado: "Entrega confirmada"
  }[nextStatus] || "Estado actualizado";

  addAuditEvent(state, {
    user: session.name,
    action: actionLabel,
    module: "Produccion",
    detail: `${order.table || order.id} · ${selected.map((item) => item.name).join(", ")} · ${nextStatus}`
  });

  saveState(state);
  render();

  showToast(
    nextStatus === "Preparando"
      ? "Preparacion iniciada."
      : nextStatus === "Listo"
        ? "Producto marcado como listo."
        : "Entrega confirmada."
  );
}

function isValidPreparationTransition(current, next) {
  if (current === "Nuevo" && next === "Preparando") return true;
  if (current === "Preparando" && next === "Listo") return true;
  if (current === "Listo" && next === "Entregado") return true;
  return false;
}

/* ==========================================================================
   DESPACHO DIRECTO
   ========================================================================== */

function deliverDirectItems(dispatchId, lineIds) {
  const order = state.dispatchOrders.find((item) => item.id === dispatchId);
  if (!order) {
    showToast("No encontramos el despacho.");
    return;
  }

  const now = new Date().toISOString();
  const selected = (order.items || []).filter((item) => lineIds.includes(item.lineId));

  selected.forEach((item) => {
    if (normalizeDispatchStatus(item.status) !== "Pendiente de entrega") return;

    item.status = "Entregado";
    item.deliveredAt = now;
    item.deliveredBy = session.name;

    applyDirectInventoryMovement(item, order);
    syncQueueLineToTable(item, order, "Entregado", "dispatch");
  });

  order.status = aggregateDispatchStatus(order.items);
  order.updatedAt = now;

  addAuditEvent(state, {
    user: session.name,
    action: "Despacho directo entregado",
    module: "Produccion",
    detail: `${order.table || order.orderId || order.id} · ${selected.map((item) => item.name).join(", ")}`
  });

  saveState(state);
  render();
  showToast("Producto de despacho directo entregado.");
}

function applyDirectInventoryMovement(item, order) {
  if (item.inventoryApplied) return;

  const product = productById(item.productId || item.id);
  const inventoryItemId = item.inventoryItemId || product?.inventoryItemId;
  if (!inventoryItemId) return;

  const inventoryItem = state.inventory.find((record) => record.id === inventoryItemId);
  if (!inventoryItem) return;

  const qty = Number(item.qty || 1);
  const previousStock = Number(inventoryItem.stock || 0);
  inventoryItem.stock = Math.max(0, previousStock - qty);

  const movement = {
    id: nextId(state, "inventoryMovement", "MOV", 4),
    at: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    type: "Salida",
    reason: "Venta / despacho directo",
    itemId: inventoryItem.id,
    item: inventoryItem.item,
    qty,
    unit: inventoryItem.unit || "un",
    before: previousStock,
    after: inventoryItem.stock,
    orderId: order.orderId || order.id,
    tableId: order.tableId || null,
    table: order.table || null,
    user: session.name
  };

  state.inventoryMovements.unshift(movement);
  item.inventoryApplied = true;
  item.inventoryMovementId = movement.id;
}

/* ==========================================================================
   SOLICITUDES DE CAMBIO - SOPORTE KDS
   ========================================================================== */

function hasPendingChangeRequest(item) {
  if (!item) return false;
  if (item.changeRequest?.status === "Pendiente") return true;
  if (item.changeRequested === true) return true;

  return (state.changeRequests || []).some(
    (request) => request.lineId === item.lineId && request.status === "Pendiente"
  );
}

function reviewChangeRequest(orderId, lineId) {
  const order = state.kitchenOrders.find((item) => item.id === orderId);
  const item = order?.items?.find((line) => line.lineId === lineId);
  if (!item) return;

  const request = findChangeRequest(item);
  const currentStatus = normalizePreparationStatus(item.status);
  const wasteType = currentStatus === "Preparando" ? "Preparacion" : "Producto terminado";

  const html = `
    <section class="modal kds-change-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Cambio solicitado</p>
          <h2>${escapeHtml(item.name)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <div class="kds-change-modal__body">
        <div class="kds-change-current">
          <span>Estado actual</span>
          <strong>${escapeHtml(currentStatus)}</strong>
        </div>

        <div class="kds-change-message">
          <strong>Solicitud del mozo</strong>
          <p>${escapeHtml(request?.message || item.changeRequest?.message || "El cliente solicita modificar o reemplazar el producto.")}</p>
        </div>

        <div class="kds-change-impact">
          <span>Si aceptas rehacer</span>
          <strong>Puede generar merma de ${escapeHtml(wasteType.toLowerCase())}</strong>
          <small>La merma queda asociada a mesa, pedido, producto y responsable.</small>
        </div>
      </div>

      <div class="modal__actions">
        <button class="button button--secondary" type="button" data-reject-change>Rechazar cambio</button>
        <button class="button button--primary" type="button" data-accept-change>Aceptar y rehacer</button>
      </div>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-reject-change]")?.addEventListener("click", () => {
    settleChangeRequest(item, request, "Rechazada");
    addAuditEvent(state, {
      user: session.name,
      action: "Cambio rechazado",
      module: "Produccion",
      detail: `${order.table || order.id} · ${item.name}`
    });
    saveState(state);
    closeModal();
    render();
    showToast("Cambio rechazado. Se mantiene la preparacion actual.");
  });

  modal.querySelector("[data-accept-change]")?.addEventListener("click", () => {
    registerWasteForKdsChange(item, order, currentStatus, wasteType);
    settleChangeRequest(item, request, "Aceptada");

    // El original queda cancelado. El reemplazo debe llegar como una nueva
    // linea desde la pantalla del mozo para conservar la trazabilidad.
    item.status = "Cancelado";
    item.cancelled = true;
    item.cancelledAt = new Date().toISOString();
    item.cancelledBy = session.name;
    item.cancelReason = "Cambio solicitado por cliente";
    syncQueueLineToTable(item, order, "Cancelado", "preparation");
    order.status = aggregatePreparationStatus(order.items);

    addAuditEvent(state, {
      user: session.name,
      action: "Cambio aceptado con merma",
      module: "Produccion",
      detail: `${order.table || order.id} · ${item.name} · ${wasteType}`
    });

    saveState(state);
    closeModal();
    render();
    showToast("Original cancelado y merma registrada. El mozo puede enviar el reemplazo.");
  });
}

function findChangeRequest(item) {
  if (item.changeRequest?.status === "Pendiente") return item.changeRequest;
  return (state.changeRequests || []).find(
    (request) => request.lineId === item.lineId && request.status === "Pendiente"
  ) || null;
}

function settleChangeRequest(item, request, status) {
  if (request) {
    request.status = status;
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = session.name;
  }

  if (item.changeRequest) {
    item.changeRequest.status = status;
    item.changeRequest.resolvedAt = new Date().toISOString();
    item.changeRequest.resolvedBy = session.name;
  }

  item.changeRequested = false;
}

function registerWasteForKdsChange(item, order, previousStatus, type) {
  const product = productById(item.productId || item.id);
  const qty = Number(item.qty || 1);
  const unitCost =
    Number(item.estimatedCost ?? product?.estimatedCost ?? 0) ||
    Number(item.price ?? product?.price ?? 0) * 0.45;

  const now = new Date().toISOString();
  const record = {
    id: nextId(state, "waste", "MER", 3),
    type,
    itemId: item.productId || item.id,
    item: item.name,
    qty,
    unit: "un",
    reason: "Cambio solicitado por cliente",
    station: item.station || "Produccion",
    cost: Math.round(unitCost * qty * 100) / 100,
    status: "Registrada",
    user: session.name,
    at: now,
    date: now.slice(0, 10),
    source: "Pedido",
    tableId: order.tableId || null,
    table: order.table || null,
    orderId: order.id,
    lineId: item.lineId,
    previousStatus
  };

  state.wasteRecords.unshift(record);
  return record;
}

/* ==========================================================================
   SINCRONIZACION CON VENTAS / MESAS
   ========================================================================== */

function syncAllQueuesToTables() {
  state.kitchenOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      syncQueueLineToTable(item, order, normalizePreparationStatus(item.status), "preparation", false);
    });
  });

  state.dispatchOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      syncQueueLineToTable(item, order, normalizeDispatchStatus(item.status), "dispatch", false);
    });
  });
}

function syncQueueLineToTable(item, order, status, flow, copyTimes = true) {
  const table = state.tables.find((record) => record.id === order.tableId);
  if (!table) return;

  const tableItem = (table.items || []).find((line) => line.lineId === item.lineId);
  if (!tableItem) return;

  tableItem.status = status;
  tableItem.updatedAt = item.updatedAt || tableItem.updatedAt;
  tableItem.updatedBy = item.updatedBy || tableItem.updatedBy;

  if (flow === "preparation") {
    tableItem.productionStatus = status;
    tableItem.dispatchStatus = null;
  } else {
    tableItem.productionStatus = null;
    tableItem.dispatchStatus = status;
  }

  if (copyTimes) {
    ["startedAt", "startedBy", "readyAt", "readyBy", "deliveredAt", "deliveredBy", "cancelledAt", "cancelledBy"].forEach((key) => {
      if (item[key] !== undefined) tableItem[key] = item[key];
    });
  }

  if (item.cancelled) tableItem.cancelled = true;
}

function ensureDispatchQueuesFromTables() {
  const queuedLineIds = new Set(
    state.dispatchOrders
      .flatMap((order) => order.items || [])
      .map((item) => item.lineId)
      .filter(Boolean)
  );

  state.tables.forEach((table) => {
    const missing = (table.items || []).filter((item) => {
      const product = productById(item.productId || item.id);
      const isDirect =
        item.requiresPreparation === false ||
        product?.requiresPreparation === false ||
        item.operationType === "direct_dispatch" ||
        product?.operationType === "direct_dispatch" ||
        product?.operationType === "retail";

      return isDirect && item.lineId && !queuedLineIds.has(item.lineId);
    });

    if (!missing.length) return;

    const orderId = missing.find((item) => item.orderId)?.orderId || `ORD-${table.id}`;
    const dispatch = {
      id: `DSP-${table.id}-${Date.now().toString().slice(-5)}`,
      orderId,
      tableId: table.id,
      table: table.name,
      channel: table.seats === 0 ? "Delivery" : "Local",
      flow: "dispatch",
      status: "Pendiente de entrega",
      createdAt: table.openedAt || new Date().toISOString(),
      items: missing.map((item) => {
        const product = productById(item.productId || item.id);
        return {
          ...item,
          productId: item.productId || item.id,
          station: item.dispatchStation || product?.dispatchStation || item.station || product?.station || "Despacho",
          operationType: item.operationType || product?.operationType || "direct_dispatch",
          requiresPreparation: false,
          inventoryMode: item.inventoryMode || product?.inventoryMode || "direct",
          inventoryItemId: item.inventoryItemId || product?.inventoryItemId || null,
          estimatedCost: item.estimatedCost ?? product?.estimatedCost ?? null,
          status: normalizeDispatchStatus(item.dispatchStatus || item.status || "Pendiente de entrega")
        };
      }),
      user: session.name
    };

    dispatch.status = aggregateDispatchStatus(dispatch.items);
    state.dispatchOrders.push(dispatch);
    missing.forEach((item) => queuedLineIds.add(item.lineId));
  });
}

/* ==========================================================================
   TIEMPOS / KPI
   ========================================================================== */

function orderElapsed(order, items = []) {
  const relevantTimes = items
    .map((item) => item.startedAt || item.sentAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  const anchor = relevantTimes.length
    ? Math.min(...relevantTimes)
    : new Date(order.createdAt || 0).getTime();

  const actual = anchor > 0 ? Math.max(0, Math.floor((ui.now - anchor) / 60000)) : 0;

  // Los seeds del prototipo traen `elapsed` para que una demo abierta varias
  // horas despues no convierta todos los pedidos en demoras irreales.
  const seeded = Number(order.elapsed);
  if (Number.isFinite(seeded) && seeded >= 0 && actual > 90) return seeded;
  return actual;
}

function groupTargetMinutes(items, station) {
  const targets = items
    .map((item) => Number(item.estimatedTime || 0))
    .filter((value) => value > 0);

  if (targets.length) return Math.max(...targets);
  return stationTarget(station);
}

function stationTarget(station, fallback = 10) {
  const record = state.stations.find(
    (item) => String(item.name || "").toLowerCase() === String(station || "").toLowerCase()
  );
  return Number(record?.targetMinutes || fallback);
}

function timingInfo(elapsed, target, status) {
  if (["Listo", "Entregado"].includes(status)) {
    // Listo sigue mostrando alerta si superó el objetivo; ayuda al supervisor
    // a identificar producciones tardias incluso antes de la entrega.
    if (elapsed > target * 1.35) return { tone: "danger", label: "Demorado" };
    return { tone: "done", label: "Listo" };
  }

  if (elapsed > target * 1.35) return { tone: "danger", label: "Demorado" };
  if (elapsed >= target * 0.85) return { tone: "warning", label: "Atencion" };
  return { tone: "normal", label: "En tiempo" };
}

/* ==========================================================================
   ESTADOS
   ========================================================================== */

function normalizePreparationStatus(status) {
  const value = normalizeText(status);
  if (value.includes("cancel")) return "Cancelado";
  if (value.includes("entreg")) return "Entregado";
  if (value.includes("list")) return "Listo";
  if (value.includes("prepar")) return "Preparando";
  return "Nuevo";
}

function normalizeDispatchStatus(status) {
  const value = normalizeText(status);
  if (value.includes("cancel")) return "Cancelado";
  if (value.includes("entreg")) return "Entregado";
  return "Pendiente de entrega";
}

function aggregatePreparationStatus(items = []) {
  const statuses = items.map((item) => normalizePreparationStatus(item.status));
  if (!statuses.length) return "Nuevo";
  if (statuses.every((status) => status === "Cancelado")) return "Cancelado";
  if (statuses.every((status) => ["Entregado", "Cancelado"].includes(status))) return "Entregado";
  if (statuses.every((status) => ["Listo", "Entregado", "Cancelado"].includes(status))) return "Listo";
  if (statuses.some((status) => status === "Preparando")) return "Preparando";
  if (
    statuses.some((status) => ["Listo", "Entregado"].includes(status)) &&
    statuses.some((status) => status === "Nuevo")
  ) return "Preparando";
  return "Nuevo";
}

function aggregateDispatchStatus(items = []) {
  const statuses = items.map((item) => normalizeDispatchStatus(item.status));
  if (!statuses.length) return "Pendiente de entrega";
  if (statuses.every((status) => status === "Cancelado")) return "Cancelado";
  if (statuses.every((status) => ["Entregado", "Cancelado"].includes(status))) return "Entregado";
  return "Pendiente de entrega";
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function productById(id) {
  return state.menuItems.find((item) => item.id === id) || null;
}

function stationIcon(station) {
  if (station === "Barra") return "☕";
  if (station === "Cocina") return "🍳";
  if (station === "Todas") return "▦";
  return "↗";
}

function statusSlug(status) {
  return normalizeText(status).replace(/\s+/g, "-");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatElapsed(minutes) {
  const value = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${String(mins).padStart(2, "0")}:00`;
}

function formatClock(timestamp) {
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(timestamp));
}

function formatDay(timestamp) {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(timestamp));
}

function formatOrderTime(iso) {
  if (!iso) return "Hora no registrada";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Hora no registrada";
  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {
      showToast("El navegador no permitio abrir pantalla completa.");
    });
    return;
  }
  document.exitFullscreen?.();
}
