// Cafe Fusiones - Clientes / Fidelizacion / Reservas V8
// Ruta: js/pages/clientes.js
//
// PRINCIPIOS DE ESTA VERSION
// ---------------------------------------------------------------------------
// 1) Cliente registrado != miembro del programa de fidelizacion.
// 3) Local/Turista es opcional y nunca bloquea una operacion.
// 4) La identidad se intenta resolver por telefono, correo o documento.
//    El nombre solo sirve como sugerencia, nunca como coincidencia definitiva.
// 5) Puntos disponibles != puntos calificables para nivel.
// 6) Bronce / Plata / Oro son niveles configurables; los umbrales son parametros.
// 7) Clientes no utiliza categorías manuales. La organización se resuelve con
//    fidelización, nivel, origen, segmentación opcional y comportamiento.
// 8) El sistema soporta SUCURSALES:
//      state.branches = [...]
//    La sucursal activa es visible y los registros operativos conservan branchId.
//    El cliente es global a la empresa; se guarda sucursal de origen/ultima atencion.
// 9) La Landing y otros canales pueden registrar origen, referencia y consentimiento.
//    El ERP no administra campañas de marketing.
//
// Flujo esperado:
// Landing / Instagram / WhatsApp / Salon
//        -> Cliente / Reserva
//        -> Reserva / Venta
//        -> Caja confirma pago
//        -> Cliente identificado
//        -> Puntos si esta afiliado
//        -> Nivel
//        -> Recompensas elegibles
//        -> Reportes

import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import {
  getState,
  saveState,
  nextId,
  addAuditEvent
} from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import {
  icon,
  money,
  escapeHtml,
  statusClass,
  matchesSearch
} from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(window.location.search);

const TABS = [
  { id: "clientes", label: "Clientes", icon: "◎" },
  { id: "fidelizacion", label: "Fidelización", icon: "★" },
  { id: "reservas", label: "Reservas", icon: "◷" }
];

const SEGMENTS = ["Todos", "No especificado", "Local", "Turista"];
const RESERVATION_STATUSES = [
  "Pendiente",
  "Confirmada",
  "Llegó",
  "Atendida",
  "Cancelada",
  "No asistió"
];

const CRM_SOURCES = [
  "Salón",
  "Caja",
  "Reserva",
  "Landing",
  "Instagram",
  "Facebook",
  "Google",
  "TikTok",
  "WhatsApp",
  "Llamada",
  "Referido",
  "Otro"
];

const ui = {
  tab: TABS.some((tab) => tab.id === params.get("tab"))
    ? params.get("tab")
    : "clientes",
  search: "",
  segment: "Todos",
  loyaltyStatus: "Todos",
  reservationStatus: "Todos",
  customerModalTab: "resumen",
  branchId: ""
};

if (session) init();

/* ==========================================================================
   INICIO / NORMALIZACION
   ========================================================================== */

function init() {
  normalizeClientState();

  ui.branchId = resolveInitialBranch();

  renderSidebar("clientes", session.role);
  renderTopbar({
    title: "Clientes y Fidelización",
    eyebrow: "CRM y relación con clientes",
    searchPlaceholder: "Buscar nombre, teléfono, correo o documento...",
    onSearch: (query) => {
      ui.search = query || "";
      render();
    }
  });

  render();
}

function normalizeClientState() {
  state.customers ||= [];
  state.reservations ||= [];
  state.rewards ||= [];
  state.loyaltyMovements ||= [];
  state.salesHistory ||= [];
  state.settings ||= {};


  normalizeBranches();
  normalizeLoyaltyConfig();

  state.customers = state.customers.map((customer) => normalizeCustomer(customer));
  state.reservations = state.reservations.map((reservation) => normalizeReservation(reservation));
  state.rewards = state.rewards.map((reward) => normalizeReward(reward));

  saveState(state);
}

function normalizeBranches() {
  // Sucursal actual conocida de Cafe Fusiones.
  // Las futuras sucursales se crean/eliminan desde Configuracion.
  if (!Array.isArray(state.branches) || !state.branches.length) {
    state.branches = [{
      id: "SUC-01",
      code: "CHA-01",
      name: "Chachapoyas - Principal",
      shortName: "Principal",
      address: state.settings?.address || "Jr. Ortiz Arrieta 779, Chachapoyas",
      city: "Chachapoyas",
      status: "Activa",
      isMain: true
    }];
  }

  state.branches = state.branches.map((branch, index) => ({
    id: branch.id || `SUC-${String(index + 1).padStart(2, "0")}`,
    code: branch.code || "",
    name: branch.name || `Sucursal ${index + 1}`,
    shortName: branch.shortName || branch.name || `Sucursal ${index + 1}`,
    address: branch.address || "",
    city: branch.city || "",
    status: branch.status || "Activa",
    isMain: branch.isMain === true,
    ...branch
  }));

  const activeBranches = getActiveBranches();
  const preferred = state.settings.activeBranchId;
  const validPreferred = activeBranches.some((branch) => branch.id === preferred);

  if (!validPreferred) {
    state.settings.activeBranchId =
      activeBranches.find((branch) => branch.isMain)?.id ||
      activeBranches[0]?.id ||
      state.branches[0]?.id ||
      "";
  }
}

function normalizeLoyaltyConfig() {
  state.loyaltyConfig ||= {};

  // Los nombres Bronce/Plata/Oro responden al alcance del programa.
  // Los UMBRALES son configurables y siguen siendo parametros de prototipo.
  if (!Array.isArray(state.loyaltyConfig.levels) || !state.loyaltyConfig.levels.length) {
    state.loyaltyConfig.levels = [
      { id: "bronze", name: "Bronce", minPoints: 0 },
      { id: "silver", name: "Plata", minPoints: 300 },
      { id: "gold", name: "Oro", minPoints: 700 }
    ];
  }

  state.loyaltyConfig.pointsPerSol = Number(state.loyaltyConfig.pointsPerSol ?? 1);
  state.loyaltyConfig.scope = state.loyaltyConfig.scope || "Empresa";
  state.loyaltyConfig.qualifyingPeriod = state.loyaltyConfig.qualifyingPeriod || "Configurable";
}

function normalizeCustomer(customer) {
  const legacyHasLoyalty =
    customer?.loyalty?.enrolled === true ||
    Boolean(customer?.level) ||
    Number(customer?.points || 0) > 0;

  const loyalty = {
    enrolled: legacyHasLoyalty,
    status: legacyHasLoyalty ? "Activo" : "No afiliado",
    joinedAt: customer?.loyalty?.joinedAt || customer?.loyaltyJoinedAt || "",
    memberCode: customer?.loyalty?.memberCode || "",
    availablePoints: Number(
      customer?.loyalty?.availablePoints ??
      customer?.availablePoints ??
      customer?.points ??
      0
    ),
    qualifyingPoints: Number(
      customer?.loyalty?.qualifyingPoints ??
      customer?.qualifyingPoints ??
      customer?.points ??
      0
    ),
    level: legacyHasLoyalty
      ? normalizeLevel(
          customer?.loyalty?.level ||
          customer?.level ||
          levelFromQualifyingPoints(
            Number(customer?.qualifyingPoints ?? customer?.points ?? 0)
          )
        )
      : null,
    ...customer?.loyalty
  };

  if (!loyalty.enrolled) {
    loyalty.status = "No afiliado";
    loyalty.level = null;
    loyalty.availablePoints = 0;
    loyalty.qualifyingPoints = 0;
  }

  const originBranchId =
    customer.originBranchId ||
    customer.branchId ||
    state.settings.activeBranchId ||
    primaryBranch()?.id ||
    "";

  const normalized = {
    ...customer,
    crmStatus: "Cliente",
    segment: normalizeSegment(customer.segment),
    source: customer.source || "Salón",
    sourceDetail: customer.sourceDetail || "",
    landingPath: customer.landingPath || "",
    originBranchId,
    lastBranchId: customer.lastBranchId || originBranchId,
    phone: customer.phone || "",
    email: customer.email || "",
    document: customer.document || "",
    birthdate: customer.birthdate || "",
    preferences: Array.isArray(customer.preferences) ? customer.preferences : [],
    tags: Array.isArray(customer.tags) ? customer.tags : [],
    status: customer.status || "Activo",
    marketingConsent: customer.marketingConsent === true,
    marketingConsentAt: customer.marketingConsentAt || "",
    notes: customer.notes || "",
    visits: Number(customer.visits || 0),
    lifetimeSpend: Number(customer.lifetimeSpend || 0),
    avgTicket: Number(customer.avgTicket || 0),
    satisfaction: Number(customer.satisfaction || 0),
    last: customer.last || "",
    loyalty
  };

  // Campos espejo para compatibilidad temporal con otras pantallas existentes.
  // En la version final, Caja/Ventas deben leer customer.loyalty.
  normalized.points = loyalty.enrolled ? loyalty.availablePoints : 0;
  normalized.level = loyalty.enrolled ? loyalty.level : null;

  // Limpieza de compatibilidad: Clientes ya no usa categorías manuales.
  delete normalized.categoryId;

  return normalized;
}

function normalizeReservation(reservation) {
  return {
    branchId:
      reservation.branchId ||
      state.settings.activeBranchId ||
      primaryBranch()?.id ||
      "",
    time: reservation.time || "",
    tableId: reservation.tableId || "",
    status: reservation.status || "Pendiente",
    channel: reservation.channel || "Presencial",
    customerId: reservation.customerId || null,
    notes: reservation.notes || "",
    ...reservation
  };
}

function normalizeReward(reward) {
  return {
    status: reward.status || "Activo",
    branchId: reward.branchId || "ALL",
    ...reward
  };
}


/* ==========================================================================
   SUCURSALES / CONTEXTO
   ========================================================================== */

function getActiveBranches() {
  return (state.branches || []).filter((branch) => branch.status !== "Inactiva");
}

function primaryBranch() {
  return (
    getActiveBranches().find((branch) => branch.isMain) ||
    getActiveBranches()[0] ||
    state.branches?.[0] ||
    null
  );
}

function resolveInitialBranch() {
  const requested = params.get("branch");
  const active = getActiveBranches();

  if (requested === "ALL") return "ALL";
  if (active.some((branch) => branch.id === requested)) return requested;

  return state.settings.activeBranchId || primaryBranch()?.id || "ALL";
}

function branchById(id) {
  return (state.branches || []).find((branch) => branch.id === id) || null;
}

function branchName(id) {
  if (!id || id === "ALL") return "Todas las sucursales";
  return branchById(id)?.shortName || branchById(id)?.name || "Sucursal";
}

function branchMatchesCustomer(customer) {
  if (ui.branchId === "ALL") return true;

  if (customer.originBranchId === ui.branchId || customer.lastBranchId === ui.branchId) {
    return true;
  }

  const saleAtBranch = (state.salesHistory || []).some(
    (sale) => sale.customerId === customer.id && sale.branchId === ui.branchId
  );

  const reservationAtBranch = (state.reservations || []).some(
    (reservation) =>
      reservation.customerId === customer.id &&
      reservation.branchId === ui.branchId
  );

  return saleAtBranch || reservationAtBranch;
}

function branchMatchesRecord(record) {
  return ui.branchId === "ALL" ||
    record.branchId === ui.branchId ||
    record.branchId === "ALL";
}

/* ==========================================================================
   RENDER GENERAL
   ========================================================================== */

function render() {
  view.innerHTML = `
    <div class="clients-v4">
      ${moduleHeader()}
      ${moduleTabs()}
      ${renderCurrentTab()}
    </div>
  `;

  wireCommon();
  wireCurrentTab();
}

function moduleHeader() {
  const scopedCustomers = state.customers.filter(branchMatchesCustomer);
  const active = scopedCustomers.filter((customer) =>
    customer.status === "Activo"
  ).length;
  const members = scopedCustomers.filter((customer) =>
    customer.loyalty?.enrolled === true &&
    customer.loyalty?.status === "Activo"
  ).length;
  const activeReservations = state.reservations
    .filter(branchMatchesRecord)
    .filter((reservation) => ["Pendiente", "Confirmada"].includes(reservation.status))
    .length;

  return `
    <section class="panel clients-module-head">
      <div>
        <p class="eyebrow">CLIENTES · FIDELIZACIÓN · RESERVAS</p>
        <h2>Relación con clientes</h2>
        <p>
          El cliente se identifica una sola vez para toda Cafe Fusiones. Cada venta o
          reserva conserva su sucursal. Registrar un cliente no lo afilia automáticamente
          al programa de fidelización.
        </p>
      </div>

      <div class="clients-head-pills">
        ${branchSelector()}
        <span><strong>${active}</strong> clientes</span>
        <span><strong>${members}</strong> afiliados</span>
        <span><strong>${activeReservations}</strong> reservas</span>
      </div>
    </section>`;
}

function branchSelector() {
  const branches = getActiveBranches();

  return `
    <label class="clients-branch-context" title="Contexto de sucursal">
      <small>Sucursal</small>
      <select data-branch-context aria-label="Sucursal activa">
        ${branches.length > 1
          ? `<option value="ALL" ${ui.branchId === "ALL" ? "selected" : ""}>Todas las sucursales</option>`
          : ""
        }
        ${branches.map((branch) => `
          <option value="${branch.id}" ${ui.branchId === branch.id ? "selected" : ""}>
            ${escapeHtml(branch.shortName || branch.name)}
          </option>
        `).join("")}
      </select>
    </label>`;
}

function moduleTabs() {
  return `
    <section class="panel clients-tabs-wrap">
      <nav class="clients-tabs" aria-label="Secciones de clientes">
        ${TABS.map((tab) => `
          <button
            class="clients-tab ${ui.tab === tab.id ? "is-active" : ""}"
            type="button"
            data-tab="${tab.id}"
          >
            <span>${tab.icon}</span>
            <strong>${tab.label}</strong>
          </button>
        `).join("")}
      </nav>
    </section>`;
}

function renderCurrentTab() {
  switch (ui.tab) {
    case "fidelizacion": return renderLoyalty();
    case "reservas": return renderReservations();
    default: return renderCustomers();
  }
}

/* ==========================================================================
   CLIENTES / CRM
   ========================================================================== */

function filteredCustomers() {
  return state.customers
    .filter(branchMatchesCustomer)
    .filter((customer) =>
      ui.segment === "Todos" ||
      normalizeSegment(customer.segment) === ui.segment
    )
    .filter((customer) => {
      if (ui.loyaltyStatus === "Todos") return true;
      if (ui.loyaltyStatus === "Afiliado") return customer.loyalty?.enrolled === true;
      if (ui.loyaltyStatus === "No afiliado") return customer.loyalty?.enrolled !== true;
      return true;
    })
    .filter((customer) => matchesSearch(
      ui.search,
      customer.name,
      customer.phone,
      customer.email,
      customer.document,
      normalizeSegment(customer.segment),
      customer.loyalty?.level,
      customer.source,
      branchName(customer.lastBranchId),
      (customer.tags || []).join(" ")
    ));
}

function renderCustomers() {
  const list = filteredCustomers();
  const scoped = state.customers.filter(branchMatchesCustomer);
  const customers = scoped.filter((customer) => customer.status === "Activo");
  const members = scoped.filter((customer) => customer.loyalty?.enrolled === true);
  const upcomingReservations = state.reservations
    .filter(branchMatchesRecord)
    .filter((reservation) => ["Pendiente", "Confirmada"].includes(reservation.status))
    .length;
  const avgTicket = customers.length
    ? customers.reduce((sum, customer) => sum + Number(customer.avgTicket || 0), 0) / customers.length
    : 0;

  return `
    <div class="clients-tab-view">
      <section class="clients-kpis">
        ${metricCard("Clientes activos", customers.length, "Perfiles registrados", "neutral")}
        ${metricCard("Afiliados", members.length, "Programa de fidelización", "ok")}
        ${metricCard("Reservas activas", upcomingReservations, "Pendientes o confirmadas", upcomingReservations ? "info" : "neutral")}
        ${metricCard("Ticket promedio", money(avgTicket), "Promedio histórico por cliente", "neutral")}
      </section>

      <section class="panel clients-toolbar">
        <div class="clients-toolbar__filters">
          <label>
            <span>Fidelización</span>
            <select data-loyalty-status>
              ${["Todos", "Afiliado", "No afiliado"].map((status) => `
                <option ${ui.loyaltyStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>
              `).join("")}
            </select>
          </label>

          <label>
            <span>Segmento opcional</span>
            <select data-customer-segment>
              ${SEGMENTS.map((segment) => `
                <option ${ui.segment === segment ? "selected" : ""}>${escapeHtml(segment)}</option>
              `).join("")}
            </select>
          </label>
        </div>

        <div class="clients-toolbar__actions">
          <button class="button button--primary" type="button" data-new-customer>
            ${icon("plus")}<span>Nuevo cliente</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Base de clientes</p>
            <h2>Clientes</h2>
          </div>
          <span class="status status--info">${list.length} registros</span>
        </div>

        <div class="table-wrap">
          <table class="data-table clients-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fidelización</th>
                <th>Visitas</th>
                <th>Última visita</th>
                <th>Gasto</th>
                <th>Segmentación</th>
                <th>Sucursal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map(customerRow).join("") || tableEmpty(8, "No hay clientes con estos filtros.")}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function customerRow(customer) {
  const segment = normalizeSegment(customer.segment);
  const loyalty = customer.loyalty || {};

  return `
    <tr>
      <td>
        <strong>${escapeHtml(customer.name)}</strong>
        <br>
        <small class="muted">
          ${escapeHtml(customer.phone || "Sin teléfono")}
          ${customer.email ? ` · ${escapeHtml(customer.email)}` : ""}
        </small>
      </td>


      <td>
        ${loyalty.enrolled
          ? `
            <strong>${escapeHtml(normalizeLevel(loyalty.level))}</strong>
            <br><small class="muted">${Number(loyalty.availablePoints || 0)} pts disponibles</small>
          `
          : `<span class="customer-segment-unknown">No afiliado</span>`
        }
      </td>

      <td>${Number(customer.visits || 0)}</td>
      <td>${formatCustomerDate(customer.last)}</td>
      <td>${money(customer.lifetimeSpend || 0)}</td>

      <td>
        ${segment === "No especificado"
          ? `<span class="customer-segment-unknown">No especificado</span>`
          : `<span class="customer-segment">${escapeHtml(segment)}</span>`
        }
      </td>

      <td>
        <strong>${escapeHtml(branchName(customer.lastBranchId || customer.originBranchId))}</strong>
      </td>

      <td>
        <div class="table-actions">
          <button class="mini-button" type="button" data-customer-view="${customer.id}">Ver perfil</button>
          <button class="mini-button" type="button" data-customer-edit="${customer.id}">Editar</button>
        </div>
      </td>
    </tr>`;
}

/* ==========================================================================
   FIDELIZACION
   ========================================================================== */

function renderLoyalty() {
  const scopedCustomers = state.customers.filter(branchMatchesCustomer);
  const members = scopedCustomers.filter((customer) =>
    customer.loyalty?.enrolled === true &&
    customer.loyalty?.status === "Activo"
  );
  const levels = orderedLevels();
  const totalAvailable = members.reduce(
    (sum, customer) => sum + Number(customer.loyalty?.availablePoints || 0),
    0
  );
  const totalQualifying = members.reduce(
    (sum, customer) => sum + Number(customer.loyalty?.qualifyingPoints || 0),
    0
  );

  const scopedMovements = state.loyaltyMovements.filter((movement) => {
    if (ui.branchId === "ALL") return true;
    return movement.branchId === ui.branchId || !movement.branchId;
  });

  const redemptions = scopedMovements.filter((movement) =>
    String(movement.type || "").toLowerCase().includes("redeem") ||
    Number(movement.points || 0) < 0
  ).length;

  return `
    <div class="clients-tab-view">
      <section class="clients-kpis">
        ${metricCard("Miembros activos", members.length, "Solo afiliados al programa", "ok")}
        ${metricCard("Puntos disponibles", totalAvailable, "Se pueden canjear", "neutral")}
        ${metricCard("Puntos calificables", totalQualifying, "Determinan el nivel", "info")}
        ${metricCard("Canjes", redemptions, "Se ejecutarán principalmente en Caja", "neutral")}
      </section>

      <section class="panel loyalty-intro">
        <div>
          <p class="eyebrow">Programa configurable</p>
          <h2>Niveles y recompensas</h2>
          <p>
            Afiliarse es independiente de registrarse como cliente. Los puntos disponibles
            pueden gastarse; los puntos calificables determinan Bronce, Plata u Oro.
            Los umbrales y la regla de acumulación son configurables.
          </p>
        </div>
        <button class="button button--secondary" type="button" data-loyalty-config>
          Configurar reglas
        </button>
      </section>

      <section class="loyalty-level-grid">
        ${levels.map(levelCard).join("")}
      </section>

      <div class="clients-two-column">
        <section class="panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Catálogo configurable</p>
              <h2>Recompensas</h2>
            </div>
            <button class="mini-button" type="button" data-new-reward>Agregar recompensa</button>
          </div>

          <div class="reward-list">
            ${state.rewards
              .filter(branchMatchesRecord)
              .map(rewardRow)
              .join("") ||
              emptyMini("★", "Sin recompensas", "Configura beneficios del programa.")
            }
          </div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Trazabilidad</p>
              <h2>Últimos movimientos</h2>
            </div>
          </div>

          <div class="loyalty-movement-list">
            ${[...scopedMovements]
              .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
              .slice(0, 8)
              .map(loyaltyMovementRow)
              .join("") ||
              emptyMini("↕", "Sin movimientos", "Los puntos aparecerán al cerrar ventas o realizar canjes.")
            }
          </div>
        </section>
      </div>
    </div>`;
}

function levelCard(level) {
  const customers = state.customers
    .filter(branchMatchesCustomer)
    .filter((customer) =>
      customer.loyalty?.enrolled === true &&
      normalizeLevel(customer.loyalty?.level) === level.name
    );

  const levels = orderedLevels();
  const index = levels.findIndex((item) => item.id === level.id);
  const next = levels[index + 1];

  return `
    <article class="panel loyalty-level-card loyalty-level-card--${normalizeClass(level.name)}">
      <header>
        <span>${levelIcon(level.name)}</span>
        <div>
          <small>Nivel</small>
          <h3>${escapeHtml(level.name)}</h3>
        </div>
        <strong>${customers.length}</strong>
      </header>
      <div>
        <p>Desde <strong>${Number(level.minPoints || 0)} puntos calificables</strong></p>
        <small>
          ${next
            ? `Siguiente nivel desde ${Number(next.minPoints || 0)} puntos calificables.`
            : "Nivel superior del programa."
          }
        </small>
      </div>
    </article>`;
}

function rewardRow(reward) {
  return `
    <article class="reward-row">
      <div>
        <span>★</span>
        <div>
          <strong>${escapeHtml(reward.name)}</strong>
          <small>
            ${escapeHtml(reward.level || "Todos los niveles")}
            · ${escapeHtml(reward.status)}
            · ${escapeHtml(reward.branchId === "ALL" ? "Todas las sucursales" : branchName(reward.branchId))}
          </small>
        </div>
      </div>
      <b>${Number(reward.points || 0)} pts</b>
    </article>`;
}

function loyaltyMovementRow(movement) {
  const customer = customerById(movement.customerId);
  const points = Number(movement.points || 0);

  return `
    <article class="loyalty-movement-row">
      <span class="${points >= 0 ? "is-positive" : "is-negative"}">${points >= 0 ? "+" : "−"}</span>
      <div>
        <strong>${escapeHtml(customer?.name || "Cliente")}</strong>
        <small>
          ${escapeHtml(movement.detail || "Movimiento de puntos")}
          · ${formatDateTime(movement.at)}
          ${movement.branchId ? ` · ${escapeHtml(branchName(movement.branchId))}` : ""}
        </small>
      </div>
      <b class="${points >= 0 ? "is-positive" : "is-negative"}">
        ${points >= 0 ? "+" : ""}${points} pts
      </b>
    </article>`;
}

/* ==========================================================================
   RESERVAS
   ========================================================================== */

function renderReservations() {
  const statuses = ["Todos", ...RESERVATION_STATUSES];
  const list = [...state.reservations]
    .filter(branchMatchesRecord)
    .filter((reservation) =>
      ui.reservationStatus === "Todos" ||
      reservation.status === ui.reservationStatus
    )
    .filter((reservation) => matchesSearch(
      ui.search,
      reservation.name,
      reservation.lastname,
      reservation.phone,
      reservation.email,
      reservation.status,
      reservation.tableId,
      reservation.motive,
      branchName(reservation.branchId)
    ))
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );

  const today = list.filter((reservation) => reservation.date === todayIso()).length;
  const confirmed = list.filter((reservation) => reservation.status === "Confirmada").length;
  const pending = list.filter((reservation) => reservation.status === "Pendiente").length;

  return `
    <div class="clients-tab-view">
      <section class="clients-kpis clients-kpis--3">
        ${metricCard("Reservas hoy", today, branchName(ui.branchId), today ? "info" : "neutral")}
        ${metricCard("Confirmadas", confirmed, "Pendientes de llegada", "ok")}
        ${metricCard("Por confirmar", pending, "Requieren seguimiento", pending ? "warn" : "ok")}
      </section>

      <section class="panel clients-toolbar">
        <div class="clients-toolbar__filters">
          <label>
            <span>Estado</span>
            <select data-reservation-status>
              ${statuses.map((status) => `
                <option ${ui.reservationStatus === status ? "selected" : ""}>${escapeHtml(status)}</option>
              `).join("")}
            </select>
          </label>
        </div>

        <div class="clients-toolbar__actions">
          <button class="button button--primary" type="button" data-new-reservation>
            ${icon("plus")}<span>Nueva reserva</span>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Agenda por sucursal</p>
            <h2>Reservas</h2>
          </div>
          <span class="status status--info">${list.length} reservas</span>
        </div>

        <div class="table-wrap">
          <table class="data-table reservation-table">
            <thead>
              <tr>
                <th>Fecha / hora</th>
                <th>Cliente</th>
                <th>Personas</th>
                <th>Sucursal</th>
                <th>Mesa</th>
                <th>Canal</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${list.map(reservationRow).join("") || tableEmpty(8, "No hay reservas con estos filtros.")}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function reservationRow(reservation) {
  const customer = customerById(reservation.customerId);
  const fullName =
    customer?.name ||
    [reservation.name, reservation.lastname].filter(Boolean).join(" ") ||
    "Sin nombre";

  return `
    <tr>
      <td>
        <strong>${formatCustomerDate(reservation.date)}</strong>
        <br><small class="muted">${escapeHtml(reservation.time || "Hora pendiente")}</small>
      </td>
      <td>
        <strong>${escapeHtml(fullName)}</strong>
        <br><small class="muted">${escapeHtml(reservation.phone || customer?.phone || "")}</small>
      </td>
      <td>${Number(reservation.people || 1)}</td>
      <td>${escapeHtml(branchName(reservation.branchId))}</td>
      <td>${escapeHtml(reservation.tableId || "Por asignar")}</td>
      <td>${escapeHtml(reservation.channel || "Presencial")}</td>
      <td><span class="${statusClass(reservation.status)}">${escapeHtml(reservation.status)}</span></td>
      <td>
        <div class="table-actions">
          <button class="mini-button" type="button" data-reservation-edit="${reservation.id}">Gestionar</button>
        </div>
      </td>
    </tr>`;
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */

function wireCommon() {
  view.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => goTab(button.dataset.tab));
  });

  view.querySelector("[data-branch-context]")?.addEventListener("change", (event) => {
    ui.branchId = event.target.value;

    if (ui.branchId !== "ALL") {
      state.settings.activeBranchId = ui.branchId;
      saveState(state);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("branch", ui.branchId);
    history.replaceState({}, "", url);

    render();
  });
}

function wireCurrentTab() {
  if (ui.tab === "clientes") wireCustomers();
  if (ui.tab === "fidelizacion") wireLoyalty();
  if (ui.tab === "reservas") wireReservations();
}

function goTab(tab) {
  if (!TABS.some((item) => item.id === tab)) return;

  ui.tab = tab;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  url.searchParams.set("branch", ui.branchId);
  history.replaceState({}, "", url);
  render();
}

function wireCustomers() {
  view.querySelector("[data-customer-segment]")?.addEventListener("change", (event) => {
    ui.segment = event.target.value;
    render();
  });


  view.querySelector("[data-loyalty-status]")?.addEventListener("change", (event) => {
    ui.loyaltyStatus = event.target.value;
    render();
  });

  view.querySelector("[data-new-customer]")?.addEventListener("click", () => openCustomerForm());

  view.querySelectorAll("[data-customer-view]").forEach((button) => {
    button.addEventListener("click", () => openCustomer360(button.dataset.customerView));
  });

  view.querySelectorAll("[data-customer-edit]").forEach((button) => {
    button.addEventListener("click", () => openCustomerForm(button.dataset.customerEdit));
  });
}

function wireLoyalty() {
  view.querySelector("[data-loyalty-config]")?.addEventListener("click", openLoyaltyConfigModal);
  view.querySelector("[data-new-reward]")?.addEventListener("click", openRewardModal);
}

function wireReservations() {
  view.querySelector("[data-reservation-status]")?.addEventListener("change", (event) => {
    ui.reservationStatus = event.target.value;
    render();
  });

  view.querySelector("[data-new-reservation]")?.addEventListener("click", () => openReservationForm());

  view.querySelectorAll("[data-reservation-edit]").forEach((button) => {
    button.addEventListener("click", () => openReservationForm(button.dataset.reservationEdit));
  });
}


/* ==========================================================================
   ALTA / EDICION / PREVENCION DE DUPLICADOS
   ========================================================================== */

function openCustomerForm(id = null) {
  const customer = id ? customerById(id) : null;
  const defaultBranchId =
    customer?.originBranchId ||
    (ui.branchId !== "ALL" ? ui.branchId : state.settings.activeBranchId) ||
    primaryBranch()?.id ||
    "";

  const html = `
    <section class="modal customer-form-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Clientes</p>
          <h2>${customer ? "Editar cliente" : "Nuevo cliente"}</h2>
          <p class="muted">
            El perfil es único para todas las sucursales. Fidelización se activa por separado.
          </p>
        </div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button>
      </div>

      <form class="form-grid customer-form-body" data-customer-form>
        <label class="span-2">
          Nombre completo *
          <input
            name="name"
            value="${escapeHtml(customer?.name || "")}"
            required
            autocomplete="name"
            data-customer-identity
          >
        </label>

        <label>
          Sucursal de origen
          <select name="originBranchId">
            ${getActiveBranches().map((branch) => `
              <option value="${branch.id}" ${defaultBranchId === branch.id ? "selected" : ""}>
                ${escapeHtml(branch.name)}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          Teléfono
          <input
            name="phone"
            value="${escapeHtml(customer?.phone || "")}"
            autocomplete="tel"
            data-customer-identity
          >
        </label>

        <label>
          Correo
          <input
            name="email"
            type="email"
            value="${escapeHtml(customer?.email || "")}"
            autocomplete="email"
            data-customer-identity
          >
        </label>

        <label>
          DNI / documento <span class="optional">(opcional)</span>
          <input
            name="document"
            value="${escapeHtml(customer?.document || "")}"
            data-customer-identity
          >
        </label>

        <label>
          Fecha de nacimiento <span class="optional">(opcional)</span>
          <input name="birthdate" type="date" value="${escapeHtml(customer?.birthdate || "")}">
        </label>

        <div class="loyalty-config-note span-2" data-duplicate-note hidden></div>

        <label>
          Origen CRM
          <select name="source">
            ${CRM_SOURCES.map((source) => `
              <option ${customer?.source === source ? "selected" : ""}>${escapeHtml(source)}</option>
            `).join("")}
          </select>
        </label>

        <label>
          Referencia de origen <span class="optional">(opcional)</span>
          <input
            name="sourceDetail"
            value="${escapeHtml(customer?.sourceDetail || "")}"
            placeholder="Ej. QR mesa / formulario web / publicación / referido"
          >
        </label>

        <label class="span-2">
          Landing de origen <span class="optional">(opcional)</span>
          <input
            name="landingPath"
            value="${escapeHtml(customer?.landingPath || "")}"
            placeholder="/brunch, /reservas, /cafe-especialidad..."
          >
        </label>

        <div class="customer-segment-field span-2">
          <label>
            Segmentación Local/Turista <span class="optional">(opcional)</span>
            <select name="segment">
              <option value="No especificado" ${normalizeSegment(customer?.segment) === "No especificado" ? "selected" : ""}>No especificado</option>
              <option value="Local" ${normalizeSegment(customer?.segment) === "Local" ? "selected" : ""}>Local</option>
              <option value="Turista" ${normalizeSegment(customer?.segment) === "Turista" ? "selected" : ""}>Turista</option>
            </select>
          </label>

          <div class="customer-segment-help">
            <strong>No es necesario preguntarlo durante la atención.</strong>
            <small>
              Déjalo en “No especificado” si no se conoce. Es un dato de análisis,
              no un requisito para vender, reservar o fidelizar.
            </small>
          </div>
        </div>

        <label class="span-2">
          Preferencias <span class="optional">(opcional)</span>
          <input
            name="preferences"
            value="${escapeHtml((customer?.preferences || []).join(", "))}"
            placeholder="Leche de avena, sin azúcar, vegetariano..."
          >
        </label>

        <label class="span-2">
          Notas internas
          <textarea name="notes" rows="3" placeholder="Información útil para una mejor atención.">${escapeHtml(customer?.notes || "")}</textarea>
        </label>

        <label class="customer-consent span-2">
          <input
            name="marketingConsent"
            type="checkbox"
            value="1"
            ${customer?.marketingConsent === true ? "checked" : ""}
          >
          <span>
            <strong>Consentimiento para comunicaciones promocionales</strong>
            <small>
              Es independiente de fidelización. Registrar solo si la persona aceptó
              recibir promociones o comunicaciones comerciales.
            </small>
          </span>
        </label>

        <div class="modal__actions span-2">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">
            ${customer ? "Guardar cambios" : "Registrar contacto"}
          </button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-customer-form]");

  form?.querySelectorAll("[data-customer-identity]").forEach((input) => {
    input.addEventListener("input", () => updateDuplicateNote(form, customer?.id || null));
    input.addEventListener("blur", () => updateDuplicateNote(form, customer?.id || null));
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const email = String(data.get("email") || "").trim();
    const document = String(data.get("document") || "").trim();

    if (!name) return;

    const exactDuplicate = findExactDuplicate(
      { phone, email, document },
      customer?.id || null
    );

    if (exactDuplicate) {
      showToast(`Ya existe ${exactDuplicate.name}. Usa el perfil existente.`);
      return;
    }

    const wasConsent = customer?.marketingConsent === true;
    const marketingConsent = data.get("marketingConsent") === "1";

    const payload = {
      name,
      phone,
      email,
      document,
      birthdate: String(data.get("birthdate") || ""),
      crmStatus: "Cliente",
      originBranchId: String(data.get("originBranchId") || defaultBranchId),
      lastBranchId: customer?.lastBranchId || String(data.get("originBranchId") || defaultBranchId),
      source: String(data.get("source") || "Salón"),
      sourceDetail: String(data.get("sourceDetail") || "").trim(),
      landingPath: String(data.get("landingPath") || "").trim(),
      segment: normalizeSegment(data.get("segment")),
      preferences: splitCsv(data.get("preferences")),
      notes: String(data.get("notes") || "").trim(),
      marketingConsent,
      marketingConsentAt:
        marketingConsent && !wasConsent
          ? new Date().toISOString()
          : customer?.marketingConsentAt || "",
      status: customer?.status || "Activo"
    };

    if (customer) {
      Object.assign(customer, payload);
      syncLegacyLoyaltyFields(customer);

      addAuditEvent(state, {
        user: session.name,
        action: "Cliente actualizado",
        module: "Clientes",
        detail: `${customer.name} · ${branchName(customer.lastBranchId)}`
      });
    } else {
      const newCustomer = normalizeCustomer({
        id: nextId(state, "customer", "CLI", 2),
        ...payload,
        visits: 0,
        last: "",
        satisfaction: 0,
        lifetimeSpend: 0,
        avgTicket: 0,
        tags: [],
        loyalty: {
          enrolled: false,
          status: "No afiliado",
          joinedAt: "",
          memberCode: "",
          availablePoints: 0,
          qualifyingPoints: 0,
          level: null
        }
      });

      state.customers.unshift(newCustomer);

      addAuditEvent(state, {
        user: session.name,
        action: "Cliente registrado",
        module: "Clientes",
        detail: `${newCustomer.name} · ${branchName(newCustomer.originBranchId)}`
      });
    }

    saveState(state);
    closeModal();
    showToast(customer ? "Cliente actualizado." : "Cliente registrado.");
    render();
  });
}

function updateDuplicateNote(form, excludeId) {
  const note = form.querySelector("[data-duplicate-note]");
  if (!note) return;

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const phone = String(data.get("phone") || "").trim();
  const email = String(data.get("email") || "").trim();
  const document = String(data.get("document") || "").trim();

  const exact = findExactDuplicate({ phone, email, document }, excludeId);

  if (exact) {
    note.hidden = false;
    note.innerHTML = `
      <strong>Posible registro duplicado</strong>
      <small>
        Ya existe <b>${escapeHtml(exact.name)}</b>
        (${escapeHtml(exact.phone || exact.email || exact.document || exact.id)}).
        No se creará otro registro con la misma identidad.
      </small>
    `;
    return;
  }

  const nameMatch = findNameSuggestion(name, excludeId);

  if (nameMatch) {
    note.hidden = false;
    note.innerHTML = `
      <strong>Nombre similar encontrado</strong>
      <small>
        Existe “${escapeHtml(nameMatch.name)}”. El nombre por sí solo no bloquea el registro;
        verifica teléfono, correo o documento antes de continuar.
      </small>
    `;
    return;
  }

  note.hidden = true;
  note.innerHTML = "";
}

function findExactDuplicate(identity, excludeId = null) {
  const phone = normalizePhone(identity.phone);
  const email = normalizeEmail(identity.email);
  const document = normalizeDocument(identity.document);

  return state.customers.find((item) => {
    if (excludeId && item.id === excludeId) return false;

    const samePhone =
      phone &&
      normalizePhone(item.phone) &&
      normalizePhone(item.phone) === phone;

    const sameEmail =
      email &&
      normalizeEmail(item.email) &&
      normalizeEmail(item.email) === email;

    const sameDocument =
      document &&
      normalizeDocument(item.document) &&
      normalizeDocument(item.document) === document;

    return samePhone || sameEmail || sameDocument;
  }) || null;
}

function findNameSuggestion(name, excludeId = null) {
  const target = normalizeText(name);
  if (target.length < 5) return null;

  return state.customers.find((item) => {
    if (excludeId && item.id === excludeId) return false;
    const candidate = normalizeText(item.name);
    return candidate === target ||
      (candidate.length >= 5 && (candidate.includes(target) || target.includes(candidate)));
  }) || null;
}

/* ==========================================================================
   FICHA 360
   ========================================================================== */

function openCustomer360(id, selectedTab = "resumen") {
  const customer = customerById(id);
  if (!customer) return;

  ui.customerModalTab = selectedTab;
  const loyalty = customer.loyalty || {};

  const html = `
    <section class="modal customer-360-modal" role="dialog" aria-modal="true">
      <div class="modal__header customer-360-head">
        <div>
          <p class="eyebrow">Cliente 360°</p>
          <h2>${escapeHtml(customer.name)}</h2>
          <p>
            ${escapeHtml(customer.phone || "Sin teléfono")}
            ${customer.email ? ` · ${escapeHtml(customer.email)}` : ""}
          </p>
        </div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button>
      </div>

      <div class="customer-360-summary">
        <div>
          <span>Fidelización</span>
          <strong>${loyalty.enrolled ? "Afiliado" : "No afiliado"}</strong>
        </div>
        <div>
          <span>Nivel</span>
          <strong>${loyalty.enrolled ? escapeHtml(normalizeLevel(loyalty.level)) : "—"}</strong>
        </div>
        <div>
          <span>Puntos disponibles</span>
          <strong>${loyalty.enrolled ? Number(loyalty.availablePoints || 0) : "—"}</strong>
        </div>
        <div>
          <span>Visitas</span>
          <strong>${Number(customer.visits || 0)}</strong>
        </div>
        <div>
          <span>Gasto histórico</span>
          <strong>${money(customer.lifetimeSpend || 0)}</strong>
        </div>
      </div>

      <nav class="customer-360-tabs">
        ${[
          ["resumen", "Resumen"],
          ["compras", "Compras"],
          ["puntos", "Fidelización"],
          ["reservas", "Reservas"],
          ["actividad", "Actividad"]
        ].map(([tab, label]) => `
          <button
            type="button"
            class="${ui.customerModalTab === tab ? "is-active" : ""}"
            data-360-tab="${tab}"
          >${label}</button>
        `).join("")}
      </nav>

      <div class="customer-360-body" data-360-body>
        ${customer360Body(customer, ui.customerModalTab)}
      </div>

      <footer class="customer-360-footer">
        <span>
          ${escapeHtml(branchName(customer.lastBranchId || customer.originBranchId))}
          · Segmentación: <strong>${escapeHtml(normalizeSegment(customer.segment))}</strong>
        </span>

        <div>
          ${!loyalty.enrolled
            ? `<button class="mini-button" type="button" data-enroll-loyalty="${customer.id}">Afiliar a fidelización</button>`
            : ""
          }
          <button class="mini-button" type="button" data-360-reservation="${customer.id}">Crear reserva</button>
          <button class="button button--secondary" type="button" data-360-edit="${customer.id}">Editar perfil</button>
        </div>
      </footer>
    </section>`;

  const modal = openModal(html);

  modal.querySelectorAll("[data-360-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.customerModalTab = button.dataset["360Tab"];
      modal.querySelectorAll("[data-360-tab]").forEach((item) =>
        item.classList.toggle("is-active", item === button)
      );
      const target = modal.querySelector("[data-360-body]");
      if (target) target.innerHTML = customer360Body(customer, ui.customerModalTab);
    });
  });

  modal.querySelector("[data-360-edit]")?.addEventListener("click", () => {
    closeModal();
    openCustomerForm(customer.id);
  });

  modal.querySelector("[data-360-reservation]")?.addEventListener("click", () => {
    closeModal();
    openReservationForm(null, customer.id);
  });

  modal.querySelector("[data-enroll-loyalty]")?.addEventListener("click", () => {
    closeModal();
    openLoyaltyEnrollmentModal(customer.id);
  });
}

function customer360Body(customer, tab) {
  if (tab === "compras") return customerPurchases(customer);
  if (tab === "puntos") return customerPoints(customer);
  if (tab === "reservas") return customerReservations(customer);
  if (tab === "actividad") return customerActivity(customer);
  return customerSummary(customer);
}

function customerSummary(customer) {
  return `
    <div class="customer-summary-grid">
      <section>
        <h3>Perfil</h3>
        <dl>
          <div><dt>Origen del registro</dt><dd>${escapeHtml(customer.source || "No registrado")}</dd></div>
          <div><dt>Sucursal origen</dt><dd>${escapeHtml(branchName(customer.originBranchId))}</dd></div>
          <div><dt>Última sucursal</dt><dd>${escapeHtml(branchName(customer.lastBranchId))}</dd></div>
          <div><dt>Documento</dt><dd>${escapeHtml(customer.document || "No registrado")}</dd></div>
        </dl>
      </section>

      <section>
        <h3>Relación</h3>
        <dl>
          <div><dt>Última visita</dt><dd>${formatCustomerDate(customer.last)}</dd></div>
          <div><dt>Visitas</dt><dd>${Number(customer.visits || 0)}</dd></div>
          <div><dt>Ticket promedio</dt><dd>${money(customer.avgTicket || 0)}</dd></div>
          <div><dt>Gasto histórico</dt><dd>${money(customer.lifetimeSpend || 0)}</dd></div>
          <div><dt>Landing</dt><dd>${escapeHtml(customer.landingPath || "—")}</dd></div>
        </dl>
      </section>

      <section>
        <h3>Preferencias</h3>
        <div class="customer-preference-list">
          ${(customer.preferences || []).map((preference) =>
            `<span>${escapeHtml(preference)}</span>`
          ).join("") || `<p class="muted">Sin preferencias registradas.</p>`}
        </div>
      </section>

      <section>
        <h3>Comunicaciones</h3>
        <p class="customer-consent-state ${customer.marketingConsent ? "is-accepted" : "is-neutral"}">
          ${customer.marketingConsent
            ? "Autorizó comunicaciones promocionales."
            : "No hay autorización promocional registrada."
          }
        </p>
      </section>

      <section>
        <h3>Notas</h3>
        <p>${escapeHtml(customer.notes || "Sin notas internas.")}</p>
      </section>
    </div>`;
}

function customerPurchases(customer) {
  const sales = salesForCustomer(customer.id);

  return `
    <div class="customer-detail-list">
      ${sales.length
        ? sales.map((sale) => `
          <article>
            <div>
              <strong>${escapeHtml(sale.id || sale.saleId || "Venta")}</strong>
              <small>
                ${formatDateTime(sale.closedAt || sale.at || sale.date)}
                · ${escapeHtml(sale.channel || "Local")}
                · ${escapeHtml(branchName(sale.branchId || customer.lastBranchId))}
              </small>
            </div>
            <b>${money(sale.total || sale.amount || 0)}</b>
          </article>
        `).join("")
        : emptyMini(
            "🧾",
            "Sin compras históricas",
            "Las ventas asociadas aparecerán aquí al cerrar Caja."
          )
      }
    </div>`;
}

function customerPoints(customer) {
  const loyalty = customer.loyalty || {};

  if (!loyalty.enrolled) {
    return `
      <div class="clients-empty-mini">
        <span>★</span>
        <strong>No está afiliado al programa</strong>
        <p>
          Registrar a una persona en CRM no la afilia automáticamente.
          La afiliación se realiza de forma explícita.
        </p>
      </div>`;
  }

  const movements = [...state.loyaltyMovements]
    .filter((movement) => movement.customerId === customer.id)
    .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));

  const availableRewards = state.rewards.filter((reward) =>
    reward.status === "Activo" &&
    (reward.branchId === "ALL" || reward.branchId === ui.branchId || ui.branchId === "ALL") &&
    rewardIsEligible(customer, reward)
  );

  return `
    <div class="customer-points-layout">
      <section>
        <h3>Estado de fidelización</h3>
        <div class="customer-detail-list">
          <article>
            <div><strong>Nivel actual</strong><small>Según puntos calificables</small></div>
            <b>${escapeHtml(normalizeLevel(loyalty.level))}</b>
          </article>
          <article>
            <div><strong>Puntos disponibles</strong><small>Se pueden canjear</small></div>
            <b>${Number(loyalty.availablePoints || 0)} pts</b>
          </article>
          <article>
            <div><strong>Puntos calificables</strong><small>Determinan el nivel</small></div>
            <b>${Number(loyalty.qualifyingPoints || 0)} pts</b>
          </article>
        </div>

        <h3 style="margin-top:12px">Recompensas disponibles</h3>
        <div class="customer-reward-list">
          ${availableRewards.map((reward) => `
            <article>
              <span>★</span>
              <div>
                <strong>${escapeHtml(reward.name)}</strong>
                <small>${Number(reward.points || 0)} puntos · canje en Caja</small>
              </div>
            </article>
          `).join("") || `<p class="muted">Aún no tiene recompensas disponibles.</p>`}
        </div>
      </section>

      <section>
        <h3>Historial de puntos</h3>
        <div class="customer-detail-list">
          ${movements.map(loyaltyMovementRow).join("") || `<p class="muted">Sin movimientos de puntos.</p>`}
        </div>
      </section>
    </div>`;
}

function customerReservations(customer) {
  const reservations = state.reservations
    .filter((reservation) => reservation.customerId === customer.id)
    .sort((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
    );

  return `
    <div class="customer-detail-list">
      ${reservations.map((reservation) => `
        <article>
          <div>
            <strong>${formatCustomerDate(reservation.date)} · ${escapeHtml(reservation.time || "")}</strong>
            <small>
              ${Number(reservation.people || 1)} personas
              · ${escapeHtml(branchName(reservation.branchId))}
              · Mesa ${escapeHtml(reservation.tableId || "por asignar")}
            </small>
          </div>
          <span class="${statusClass(reservation.status)}">${escapeHtml(reservation.status)}</span>
        </article>
      `).join("") || emptyMini("◷", "Sin reservas", "Este contacto todavía no tiene reservas registradas.")}
    </div>`;
}

function customerActivity(customer) {
  const events = [];

  state.loyaltyMovements
    .filter((movement) => movement.customerId === customer.id)
    .forEach((movement) => events.push({
      at: movement.at,
      title: Number(movement.points || 0) >= 0 ? "Puntos acumulados" : "Recompensa canjeada",
      detail: movement.detail || `${movement.points} puntos`
    }));

  state.reservations
    .filter((reservation) => reservation.customerId === customer.id)
    .forEach((reservation) => events.push({
      at: `${reservation.date}T${reservation.time || "12:00"}`,
      title: `Reserva ${reservation.status}`,
      detail: `${branchName(reservation.branchId)} · ${reservation.people || 1} personas`
    }));

  salesForCustomer(customer.id).forEach((sale) => events.push({
    at: sale.closedAt || sale.at || sale.date,
    title: "Venta cerrada",
    detail: `${money(sale.total || sale.amount || 0)} · ${branchName(sale.branchId || customer.lastBranchId)}`
  }));

  return `
    <div class="customer-activity-list">
      ${events
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0))
        .map((event) => `
          <article>
            <span>•</span>
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <small>${escapeHtml(event.detail)} · ${formatDateTime(event.at)}</small>
            </div>
          </article>
        `).join("") ||
        emptyMini("•", "Sin actividad", "La actividad del CRM aparecerá aquí.")
      }
    </div>`;
}

/* ==========================================================================
   AFILIACION A FIDELIZACION
   ========================================================================== */

function openLoyaltyEnrollmentModal(customerId) {
  const customer = customerById(customerId);
  if (!customer || customer.loyalty?.enrolled) return;

  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Fidelización</p>
          <h2>Afiliar a ${escapeHtml(customer.name)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="form-grid customer-form-body" data-enrollment-form>
        <div class="loyalty-config-note span-2">
          <strong>Afiliación explícita</strong>
          <small>
            El cliente comenzará con 0 puntos disponibles y 0 puntos calificables.
            Los puntos se generarán cuando Caja confirme ventas futuras.
          </small>
        </div>

        <label class="span-2">
          Sucursal de afiliación
          <select name="branchId">
            ${getActiveBranches().map((branch) => `
              <option
                value="${branch.id}"
                ${(ui.branchId !== "ALL" ? ui.branchId : state.settings.activeBranchId) === branch.id ? "selected" : ""}
              >
                ${escapeHtml(branch.name)}
              </option>
            `).join("")}
          </select>
        </label>

        <label class="customer-consent span-2">
          <input name="confirmEnrollment" type="checkbox" value="1" required>
          <span>
            <strong>Confirmar inscripción al programa</strong>
            <small>
              Esta acción no equivale a consentimiento de marketing.
            </small>
          </span>
        </label>

        <div class="modal__actions span-2">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Afiliar</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-enrollment-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    if (data.get("confirmEnrollment") !== "1") {
      showToast("Confirma la inscripción al programa.");
      return;
    }

    const branchId = String(data.get("branchId") || state.settings.activeBranchId);

    customer.loyalty = {
      enrolled: true,
      status: "Activo",
      joinedAt: new Date().toISOString(),
      memberCode: customer.loyalty?.memberCode || `FUS-${String(customer.id).replace(/\D/g, "").padStart(5, "0")}`,
      availablePoints: 0,
      qualifyingPoints: 0,
      level: levelFromQualifyingPoints(0),
      joinedBranchId: branchId
    };

    syncLegacyLoyaltyFields(customer);

    addAuditEvent(state, {
      user: session.name,
      action: "Cliente afiliado a fidelización",
      module: "Clientes",
      detail: `${customer.name} · ${branchName(branchId)}`
    });

    saveState(state);
    closeModal();
    showToast("Cliente afiliado al programa.");
    render();
  });
}

/* ==========================================================================
   CONFIGURACION DE FIDELIZACION
   ========================================================================== */

function openLoyaltyConfigModal() {
  const levels = orderedLevels();

  const html = `
    <section class="modal loyalty-config-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Fidelización</p>
          <h2>Configurar reglas</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="form-grid loyalty-config-body" data-loyalty-form>
        <label class="span-2">
          Puntos por S/ 1 de consumo
          <input
            name="pointsPerSol"
            type="number"
            min="0"
            step="0.1"
            value="${Number(state.loyaltyConfig.pointsPerSol || 0)}"
          >
        </label>

        ${levels.map((level) => `
          <label>
            Desde puntos calificables · ${escapeHtml(level.name)}
            <input
              name="level_${escapeHtml(level.id)}"
              type="number"
              min="0"
              step="1"
              value="${Number(level.minPoints || 0)}"
            >
          </label>
        `).join("")}

        <div class="loyalty-config-note span-2">
          <strong>Reglas configurables</strong>
          <small>
            Bronce, Plata y Oro forman parte del diseño del programa, pero sus umbrales
            y la tasa de acumulación son parámetros administrables, no valores rígidos.
          </small>
        </div>

        <div class="modal__actions span-2">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar reglas</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-loyalty-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    state.loyaltyConfig.pointsPerSol = Number(data.get("pointsPerSol") || 0);
    state.loyaltyConfig.levels = state.loyaltyConfig.levels.map((level) => ({
      ...level,
      minPoints: Number(data.get(`level_${level.id}`) || 0)
    }));

    state.customers.forEach((customer) => {
      if (!customer.loyalty?.enrolled) return;
      customer.loyalty.level = levelFromQualifyingPoints(
        customer.loyalty.qualifyingPoints || 0
      );
      syncLegacyLoyaltyFields(customer);
    });

    addAuditEvent(state, {
      user: session.name,
      action: "Reglas de fidelización actualizadas",
      module: "Clientes",
      detail: `${state.loyaltyConfig.pointsPerSol} punto(s) por S/ 1`
    });

    saveState(state);
    closeModal();
    showToast("Reglas de fidelización actualizadas.");
    render();
  });
}

function openRewardModal() {
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div><p class="eyebrow">Recompensas</p><h2>Nueva recompensa</h2></div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="form-grid customer-form-body" data-reward-form>
        <label class="span-2">
          Nombre *
          <input name="name" required placeholder="Ej. Café Americano de cortesía">
        </label>

        <label>
          Puntos requeridos
          <input name="points" type="number" min="1" step="1" required>
        </label>

        <label>
          Nivel mínimo
          <select name="level">
            ${orderedLevels().map((level) => `<option>${escapeHtml(level.name)}</option>`).join("")}
          </select>
        </label>

        <label class="span-2">
          Sucursal
          <select name="branchId">
            <option value="ALL">Todas las sucursales</option>
            ${getActiveBranches().map((branch) => `
              <option value="${branch.id}">${escapeHtml(branch.name)}</option>
            `).join("")}
          </select>
        </label>

        <div class="modal__actions span-2">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Agregar recompensa</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-reward-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    state.rewards.unshift({
      id: `REC-${Date.now().toString().slice(-6)}`,
      name: data.name.trim(),
      points: Number(data.points),
      level: data.level,
      branchId: data.branchId || "ALL",
      status: "Activo"
    });

    saveState(state);
    closeModal();
    showToast("Recompensa agregada.");
    render();
  });
}

/* ==========================================================================
   RESERVAS
   ========================================================================== */

function openReservationForm(id = null, presetCustomerId = "") {
  const reservation = id
    ? state.reservations.find((item) => item.id === id)
    : null;

  const customerId = reservation?.customerId || presetCustomerId || "";
  const defaultBranchId =
    reservation?.branchId ||
    (ui.branchId !== "ALL" ? ui.branchId : state.settings.activeBranchId) ||
    primaryBranch()?.id ||
    "";

  const html = `
    <section class="modal reservation-form-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Reservas</p>
          <h2>${reservation ? "Gestionar reserva" : "Nueva reserva"}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="form-grid customer-form-body" data-reservation-form>
        <label class="span-2">
          Cliente registrado <span class="optional">(opcional)</span>
          <select name="customerId" data-reservation-customer>
            <option value="">Reserva sin perfil asociado</option>
            ${state.customers.map((customer) => `
              <option value="${customer.id}" ${customerId === customer.id ? "selected" : ""}>
                ${escapeHtml(customer.name)} · ${escapeHtml(customer.phone || customer.email || "sin contacto")}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          Sucursal *
          <select name="branchId" required data-reservation-branch>
            ${getActiveBranches().map((branch) => `
              <option value="${branch.id}" ${defaultBranchId === branch.id ? "selected" : ""}>
                ${escapeHtml(branch.name)}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          Canal
          <select name="channel">
            ${["Presencial", "Llamada", "WhatsApp", "Landing", "Web", "Instagram", "Facebook"].map((channel) => `
              <option ${reservation?.channel === channel ? "selected" : ""}>${channel}</option>
            `).join("")}
          </select>
        </label>

        <label>
          Nombre *
          <input name="name" value="${escapeHtml(reservation?.name || customerFirstName(customerById(customerId)))}" required>
        </label>

        <label>
          Apellidos
          <input name="lastname" value="${escapeHtml(reservation?.lastname || customerLastName(customerById(customerId)))}">
        </label>

        <label>
          Teléfono *
          <input name="phone" value="${escapeHtml(reservation?.phone || customerById(customerId)?.phone || "")}" required>
        </label>

        <label>
          Correo
          <input name="email" type="email" value="${escapeHtml(reservation?.email || customerById(customerId)?.email || "")}">
        </label>

        <label>
          Fecha *
          <input name="date" type="date" value="${escapeHtml(reservation?.date || todayIso())}" required>
        </label>

        <label>
          Hora *
          <input name="time" type="time" value="${escapeHtml(reservation?.time || "19:00")}" required>
        </label>

        <label>
          Personas
          <input name="people" type="number" min="1" step="1" value="${Number(reservation?.people || 2)}">
        </label>

        <label>
          Mesa preferida
          <select name="tableId" data-reservation-table>
            <option value="">Por asignar</option>
            ${tableOptionsForBranch(defaultBranchId, reservation?.tableId)}
          </select>
        </label>

        <label>
          Estado
          <select name="status">
            ${RESERVATION_STATUSES.map((status) => `
              <option ${reservation?.status === status ? "selected" : ""}>${status}</option>
            `).join("")}
          </select>
        </label>

        <label>
          Motivo / ocasión
          <input name="motive" value="${escapeHtml(reservation?.motive || "")}" placeholder="Cena, cumpleaños, reunión...">
        </label>

        <label class="span-2">
          Observaciones
          <textarea name="notes" rows="3">${escapeHtml(reservation?.notes || "")}</textarea>
        </label>

        <div class="modal__actions span-2">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">
            ${reservation ? "Guardar cambios" : "Registrar reserva"}
          </button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-reservation-form]");
  const customerSelect = modal.querySelector("[data-reservation-customer]");
  const branchSelect = modal.querySelector("[data-reservation-branch]");
  const tableSelect = modal.querySelector("[data-reservation-table]");

  customerSelect?.addEventListener("change", () => {
    const customer = customerById(customerSelect.value);
    if (!customer || !form) return;

    form.elements.name.value = customerFirstName(customer);
    form.elements.lastname.value = customerLastName(customer);
    form.elements.phone.value = customer.phone || "";
    form.elements.email.value = customer.email || "";
  });

  branchSelect?.addEventListener("change", () => {
    if (!tableSelect) return;
    tableSelect.innerHTML = `
      <option value="">Por asignar</option>
      ${tableOptionsForBranch(branchSelect.value, "")}
    `;
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    const exactDuplicate = findExactDuplicate({
      phone: data.phone,
      email: data.email,
      document: ""
    }, data.customerId || null);

    // Si la reserva no estaba vinculada, sugerimos/reutilizamos identidad existente.
    let resolvedCustomerId = data.customerId || null;

    if (!resolvedCustomerId && exactDuplicate) {
      resolvedCustomerId = exactDuplicate.id;
    }

    const payload = {
      customerId: resolvedCustomerId,
      branchId: data.branchId,
      name: data.name.trim(),
      lastname: data.lastname.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      people: Number(data.people || 1),
      motive: data.motive.trim(),
      date: data.date,
      time: data.time,
      tableId: data.tableId || "",
      channel: data.channel,
      status: data.status,
      notes: data.notes.trim()
    };

    if (reservation) {
      Object.assign(reservation, payload);
    } else {
      state.reservations.unshift({
        id: nextId(state, "reservation", "RES", 2),
        ...payload
      });
    }

    if (resolvedCustomerId) {
      const linked = customerById(resolvedCustomerId);
      if (linked) {
        linked.lastBranchId = payload.branchId;
      }
    }

    syncReservedTable(payload, reservation?.id || null);

    addAuditEvent(state, {
      user: session.name,
      action: reservation ? "Reserva actualizada" : "Reserva registrada",
      module: "Clientes",
      detail: `${payload.name} ${payload.lastname} · ${branchName(payload.branchId)} · ${payload.date} ${payload.time}`
    });

    saveState(state);
    closeModal();
    showToast(reservation ? "Reserva actualizada." : "Reserva registrada.");
    render();
  });
}

function tableOptionsForBranch(branchId, selectedId = "") {
  return (state.tables || [])
    .filter((table) => Number(table.seats || 0) > 0)
    .filter((table) => !table.branchId || table.branchId === branchId)
    .map((table) => `
      <option value="${table.id}" ${selectedId === table.id ? "selected" : ""}>
        ${escapeHtml(table.name || table.id)} · ${Number(table.seats || 0)} personas
      </option>
    `).join("");
}

function syncReservedTable(reservation, reservationId) {
  if (!reservation.tableId) return;
  if (!["Pendiente", "Confirmada"].includes(reservation.status)) return;

  const table = (state.tables || []).find((item) => item.id === reservation.tableId);
  if (!table) return;

  // Compatibilidad temporal: si la mesa aun no tiene branchId, se asume
  // perteneciente a la sucursal principal.
  table.branchId ||= primaryBranch()?.id || reservation.branchId;

  if (table.branchId !== reservation.branchId) return;

  if (!Array.isArray(table.items) || table.items.length === 0) {
    table.status = "Reservada";
    table.reservationId = reservationId || table.reservationId || null;
    table.customerId = reservation.customerId || null;
  }
}

/* ==========================================================================
   HELPERS CLIENTES / FIDELIZACION
   ========================================================================== */


function normalizeSegment(value) {
  const text = String(value || "").trim().toLowerCase();

  if (text === "local" || text === "residente") return "Local";
  if (text === "turista" || text === "visitante") return "Turista";

  return "No especificado";
}

function normalizeLevel(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["oro", "gold"].includes(text)) return "Oro";
  if (["plata", "silver"].includes(text)) return "Plata";
  return "Bronce";
}

function orderedLevels() {
  return [...(state.loyaltyConfig?.levels || [])]
    .map((level) => ({
      ...level,
      name: normalizeLevel(level.name)
    }))
    .sort((a, b) =>
      Number(a.minPoints || 0) - Number(b.minPoints || 0)
    );
}

function levelFromQualifyingPoints(points) {
  const value = Number(points || 0);
  const levels = orderedLevels();
  let current = levels[0]?.name || "Bronce";

  levels.forEach((level) => {
    if (value >= Number(level.minPoints || 0)) current = level.name;
  });

  return current;
}

function levelRank(levelName) {
  const levels = orderedLevels();
  const index = levels.findIndex(
    (level) => normalizeLevel(level.name) === normalizeLevel(levelName)
  );
  return index >= 0 ? index : 0;
}

function rewardIsEligible(customer, reward) {
  if (!customer.loyalty?.enrolled) return false;

  const enoughPoints =
    Number(customer.loyalty.availablePoints || 0) >= Number(reward.points || 0);

  const enoughLevel =
    levelRank(customer.loyalty.level) >= levelRank(reward.level || "Bronce");

  return enoughPoints && enoughLevel;
}

function syncLegacyLoyaltyFields(customer) {
  if (!customer.loyalty?.enrolled) {
    customer.points = 0;
    customer.level = null;
    return;
  }

  customer.loyalty.level = levelFromQualifyingPoints(
    customer.loyalty.qualifyingPoints || 0
  );
  customer.points = Number(customer.loyalty.availablePoints || 0);
  customer.level = customer.loyalty.level;
}

function customerById(id) {
  return state.customers.find((customer) => customer.id === id) || null;
}

function salesForCustomer(customerId) {
  return (state.salesHistory || [])
    .filter((sale) => sale.customerId === customerId)
    .sort((a, b) =>
      new Date(b.closedAt || b.at || b.date || 0) -
      new Date(a.closedAt || a.at || a.date || 0)
    );
}

function inactiveCustomers(days) {
  const limit = new Date();
  limit.setDate(limit.getDate() - Number(days || 0));

  return state.customers.filter((customer) => {
    if (!customer.last) return false;
    const date = new Date(`${customer.last}T12:00:00`);
    return !Number.isNaN(date.getTime()) && date < limit;
  });
}

function upcomingBirthdays(days) {
  const today = new Date();
  const result = [];

  state.customers.forEach((customer) => {
    if (!customer.birthdate) return;

    const birth = new Date(`${customer.birthdate}T12:00:00`);
    if (Number.isNaN(birth.getTime())) return;

    const upcoming = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate(),
      12, 0, 0
    );

    if (upcoming < today) upcoming.setFullYear(today.getFullYear() + 1);

    const diffDays = Math.ceil((upcoming - today) / 86400000);
    if (diffDays >= 0 && diffDays <= days) result.push(customer);
  });

  return result;
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeDocument(value) {
  return String(value || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function customerFirstName(customer) {
  if (!customer?.name) return "";
  return String(customer.name).trim().split(/\s+/)[0] || "";
}

function customerLastName(customer) {
  if (!customer?.name) return "";
  const parts = String(customer.name).trim().split(/\s+/);
  return parts.slice(1).join(" ");
}

function levelIcon(level) {
  if (normalizeLevel(level) === "Oro") return "◆";
  if (normalizeLevel(level) === "Plata") return "◇";
  return "●";
}

function normalizeClass(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ==========================================================================
   PRESENTACION
   ========================================================================== */

function metricCard(label, value, detail, tone = "neutral") {
  return `
    <article class="panel clients-kpi clients-kpi--${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>`;
}

function emptyMini(symbol, title, detail) {
  return `
    <div class="clients-empty-mini">
      <span>${symbol}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(detail)}</p>
    </div>`;
}

function tableEmpty(colspan, message) {
  return `<tr><td colspan="${colspan}" class="text-center muted">${escapeHtml(message)}</td></tr>`;
}

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatCustomerDate(value) {
  if (!value) return "No registrada";

  try {
    const raw = String(value).slice(0, 10);
    const date = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  } catch {
    return String(value);
  }
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return formatCustomerDate(value);

    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return String(value);
  }
}
