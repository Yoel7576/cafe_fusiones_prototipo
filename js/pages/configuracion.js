// Cafe Fusiones - Configuracion V3
// Ruta: js/pages/configuracion.js
//
// Navegacion:
//   general | sucursales | usuarios | sistema
//   Sistema abre sub-vistas en la misma pagina (?vista=mesas|estaciones|impresion|parametros).
//
// Criterio UX:
// - La pantalla muestra resumen primero.
// - Los formularios se abren solo al crear/editar.
// - No se eliminan registros con historial: se activan/desactivan.
// - Las categorias se administran en Administracion > Categorias.
// - Sucursales son visibles y transversales a todo el ERP.
// - Los datos fiscales se conservan para Caja/comprobantes, pero esta pantalla
//   no simula todavia la integracion electronica con SUNAT.

import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import {
  getState,
  saveState,
  activeBranches,
  getActiveBranch,
  setActiveBranch,
  branchById,
  nextId,
  addAuditEvent
} from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { confirmAction } from "../components/confirm.js";
import { showToast } from "../components/toast.js";
import { icon, escapeHtml, statusClass } from "../core/utils.js";
import {
  zonaHtml,
  mesaHtml,
  lienzoHtml,
  snapPlano,
  tamanoMesa,
  normalizarMapaMesa,
  acotar,
  PLANO_GRID
} from "../components/floorplan.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(location.search);

const TABS = [
  ["general", "General"],
  ["sucursales", "Sucursales"],
  ["usuarios", "Usuarios y permisos"],
  ["sistema", "Sistema"]
];

const PERMISSIONS = [
  ["dashboard", "Inicio"],
  ["ventas", "Ventas"],
  ["caja", "Caja"],
  ["inventario", "Inventario"],
  ["clientes", "Clientes"],
  ["reportes", "Reportes"],
  ["administracion", "Administración"],
  ["configuracion", "Configuración"]
];

// "operacion" era el nombre anterior de la pestana Sistema: los enlaces viejos siguen sirviendo.
const requestedTab = params.get("tab") === "operacion" ? "sistema" : params.get("tab");
const SISTEMA_VISTAS = ["mesas", "estaciones", "impresion", "parametros"];
const VISTA_TITULOS = {
  mesas: "Mesas y plano",
  estaciones: "Estaciones",
  impresion: "Impresión",
  parametros: "Parámetros del sistema"
};

// Estado efimero del editor de plano (no se persiste).
const planoUi = { seleccion: null };

const ui = {
  tab: TABS.some(([id]) => id === requestedTab)
    ? requestedTab
    : "general",
  vista: SISTEMA_VISTAS.includes(params.get("vista")) ? params.get("vista") : null,
  operationBranchId: state.settings?.activeBranchId || "",
  search: ""
};

if (session) init();

/* ==========================================================================
   INICIO
   ========================================================================== */

function init() {
  normalizeSettingsState();

  renderSidebar("configuracion", session.role);

  renderTopbar({
    title: "Configuración",
    eyebrow: "",
    showSearch: false
  });

  render();
}

function normalizeSettingsState() {
  state.settings ||= {};
  state.branches ||= [];
  state.categories ||= [];
  state.users ||= [];
  state.stations ||= [];
  state.tables ||= [];
  state.floorZones ||= [];

  const currentBranch = getActiveBranch(state);

  state.settings.commercialName ||= state.settings.tradeName || "Cafe Fusiones";
  state.settings.legalName ||= state.settings.business || "";
  state.settings.fiscalAddress ||= state.settings.address || currentBranch?.address || "";
  state.settings.currency ||= "PEN";
  state.settings.language ||= "es";
  state.settings.igv = Number(state.settings.igv ?? 18);

  state.settings.billing ||= {
    enabled: false,
    boletaEnabled: true,
    facturaEnabled: true,
    boletaSeries: "",
    facturaSeries: "",
    electronicProvider: "",
    status: "Pendiente"
  };

  state.settings.printing ||= {
    autoKitchen: false,
    autoReceipt: false,
    stationPrinters: {}
  };

  state.settings.kdsEnabled = state.settings.kdsEnabled !== false;
  state.settings.loyaltyEnabled = state.settings.loyaltyEnabled !== false;

  if (
    !ui.operationBranchId ||
    !state.branches.some((branch) => branch.id === ui.operationBranchId)
  ) {
    ui.operationBranchId = currentBranch?.id || "";
  }

  saveState(state);
}

/* ==========================================================================
   RENDER GENERAL
   ========================================================================== */

function render() {
  view.innerHTML = `
    <div class="settings-v2">
      ${settingsHeader()}
      ${settingsTabs()}
      ${renderCurrentTab()}
    </div>
  `;

  wireCommon();
  wireCurrentTab();
}

function settingsHeader() {
  const branch = getActiveBranch(state);

  return `
    <section class="panel settings-module-head">
      <div class="settings-module-head__top">
        <h2>Configuración central</h2>

        <label class="settings-active-branch">
          <span>Sucursal activa</span>
          <select data-active-branch>
            ${activeBranches(state).map((item) => `
              <option
                value="${item.id}"
                ${branch?.id === item.id ? "selected" : ""}
              >
                ${escapeHtml(item.shortName || item.name)}
              </option>
            `).join("")}
          </select>
        </label>
      </div>
    </section>`;
}

function settingsTabs() {
  return `
    <section class="panel settings-tabs-wrap">
      <nav class="settings-tabs" aria-label="Secciones de configuración">
        ${TABS.map(([id, label]) => `
          <button
            class="settings-tab ${ui.tab === id ? "is-active" : ""}"
            type="button"
            data-settings-tab="${id}"
          >
            <strong>${label}</strong>
          </button>
        `).join("")}
      </nav>
    </section>`;
}

function renderCurrentTab() {
  if (ui.tab === "sucursales") return renderBranches();
  if (ui.tab === "usuarios") return renderUsers();
  if (ui.tab === "sistema") return renderSistema();
  return renderGeneral();
}

/* ==========================================================================
   GENERAL
   ========================================================================== */

function renderGeneral() {
  const branch = getActiveBranch(state);
  const billing = state.settings.billing || {};

  return `
    <div class="settings-tab-view">
      <div class="settings-general-grid">
        <section class="panel settings-summary-card">
          <header>
            <div>
              <h2>Datos del negocio</h2>
            </div>
            <button class="mini-button" type="button" data-edit-business>Editar</button>
          </header>

          <dl class="settings-summary-list">
            <div>
              <dt>Nombre comercial</dt>
              <dd>${escapeHtml(state.settings.commercialName || "No registrado")}</dd>
            </div>
            <div>
              <dt>Razón social</dt>
              <dd>${escapeHtml(state.settings.legalName || "No registrada")}</dd>
            </div>
            <div>
              <dt>RUC</dt>
              <dd>${escapeHtml(state.settings.ruc || "No registrado")}</dd>
            </div>
            <div>
              <dt>Dirección fiscal</dt>
              <dd>${escapeHtml(state.settings.fiscalAddress || "No registrada")}</dd>
            </div>
            <div>
              <dt>Moneda / IGV</dt>
              <dd>${escapeHtml(state.settings.currency || "PEN")} · ${Number(state.settings.igv || 0)}%</dd>
            </div>
          </dl>
        </section>

        <section class="panel settings-summary-card">
          <header>
            <div>
              <h2>Facturación y emisión</h2>
            </div>
            <button class="mini-button" type="button" data-edit-billing>Configurar</button>
          </header>

          <div class="settings-feature-status">
            <span class="${billing.enabled ? "is-on" : "is-pending"}">
              ${billing.enabled ? "Series configuradas" : "Sin series configuradas"}
            </span>
          </div>

          <dl class="settings-summary-list settings-summary-list--compact">
            <div>
              <dt>Boleta</dt>
              <dd>${billing.boletaEnabled !== false ? "Habilitada" : "Deshabilitada"}</dd>
            </div>
            <div>
              <dt>Serie</dt>
              <dd>${escapeHtml(billing.boletaSeries || "Por configurar")}</dd>
            </div>
            <div>
              <dt>Factura</dt>
              <dd>${billing.facturaEnabled !== false ? "Habilitada" : "Deshabilitada"}</dd>
            </div>
            <div>
              <dt>Serie</dt>
              <dd>${escapeHtml(billing.facturaSeries || "Por configurar")}</dd>
            </div>
          </dl>
        </section>

        <section class="panel settings-summary-card">
          <header>
            <div>
              <h2>${escapeHtml(branch?.name || "Sucursal")}</h2>
            </div>
            <button class="mini-button" type="button" data-go-branches>Ver sucursales</button>
          </header>

          <dl class="settings-summary-list">
            <div>
              <dt>Código</dt>
              <dd>${escapeHtml(branch?.code || "Sin código")}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>${escapeHtml(branch?.address || "No registrada")}</dd>
            </div>
            <div>
              <dt>Ciudad</dt>
              <dd>${escapeHtml(branch?.city || "No registrada")}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>${escapeHtml(branch?.status || "Activa")}</dd>
            </div>
          </dl>
        </section>

        <section class="panel settings-summary-card">
          <header>
            <div>
              <h2>Categorías</h2>
            </div>
            <a class="mini-button" href="admin.html?tab=categorias">Administrar</a>
          </header>

          <div class="settings-feature-status">
            <strong>${state.categories.length}</strong>
          </div>
        </section>
      </div>
    </div>`;
}

/* ==========================================================================
   SUCURSALES
   ========================================================================== */

function renderBranches() {
  const branches = [...state.branches].sort((a, b) => {
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    return String(a.name).localeCompare(String(b.name), "es");
  });

  return `
    <div class="settings-tab-view">

      <section class="panel settings-toolbar">
        <div>
          <h2>Sucursales</h2>
        </div>

        <button class="button button--primary" type="button" data-new-branch>
          ${icon("plus")}<span>Nueva sucursal</span>
        </button>
      </section>

      <section class="settings-branch-grid">
        ${branches.map(branchCard).join("")}
      </section>
    </div>`;
}

function branchCard(branch) {
  const usage = branchUsage(branch.id);
  const active = branch.status === "Activa";

  return `
    <article class="panel settings-branch-card ${!active ? "is-inactive" : ""}">
      <header>
        <div>
          <div class="settings-card-flags">
            ${branch.isMain ? `<span class="settings-pill settings-pill--main">Principal</span>` : ""}
            <span class="${statusClass(branch.status)}">${escapeHtml(branch.status)}</span>
          </div>
          <h3>${escapeHtml(branch.name)}</h3>
          <p>${escapeHtml(branch.code || "Sin código")} · ${escapeHtml(branch.city || "Ciudad no registrada")}</p>
        </div>
      </header>

      <div class="settings-branch-body">
        <p class="settings-address">${escapeHtml(branch.address || "Dirección no registrada")}</p>

        <div class="settings-mini-stats">
          <div><span>Mesas</span><strong>${usage.tables}</strong></div>
          <div><span>Estaciones</span><strong>${usage.stations}</strong></div>
          <div><span>Reservas</span><strong>${usage.reservations}</strong></div>
        </div>
      </div>

      <footer>
        <button class="mini-button" type="button" data-edit-branch="${branch.id}">Editar</button>

        ${!branch.isMain && active ? `
          <button class="mini-button" type="button" data-main-branch="${branch.id}">
            Hacer principal
          </button>
        ` : ""}

        <button
          class="mini-button ${active ? "" : "is-success"}"
          type="button"
          data-toggle-branch="${branch.id}"
        >
          ${active ? "Desactivar" : "Activar"}
        </button>
      </footer>
    </article>`;
}

function branchUsage(branchId) {
  const count = (key) =>
    Array.isArray(state[key])
      ? state[key].filter((record) => record.branchId === branchId).length
      : 0;

  return {
    tables: count("tables"),
    stations: count("stations"),
    reservations: count("reservations"),
    sales: count("salesHistory"),
    inventory: count("inventory"),
    purchases: count("purchaseOrders")
  };
}

/* ==========================================================================
   USUARIOS Y PERMISOS
   ========================================================================== */

function renderUsers() {
  return `
    <div class="settings-tab-view">

      <section class="panel settings-toolbar">
        <div>
          <h2>Usuarios y permisos</h2>
        </div>

        <button class="button button--primary" type="button" data-new-user>
          ${icon("plus")}<span>Nuevo usuario</span>
        </button>
      </section>

      <section class="panel">
        <div class="table-wrap">
          <table class="data-table settings-users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Sucursal(es)</th>
                <th>Último acceso</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${state.users.map(userRow).join("")}
            </tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function userRow(user) {
  const active = user.status !== "Inactivo";

  return `
    <tr>
      <td>
        <strong>${escapeHtml(user.name)}</strong>
        <br><small class="muted">${escapeHtml(user.email || "Sin correo")}</small>
      </td>
      <td>${escapeHtml(user.role || "Sin rol")}</td>
      <td>${escapeHtml(userBranchesLabel(user))}</td>
      <td>${escapeHtml(user.lastAccess || "Sin registro")}</td>
      <td>
        <span class="${statusClass(active ? "Activo" : "Inactivo")}">
          ${active ? "Activo" : "Inactivo"}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="mini-button" type="button" data-edit-user="${user.id}">Editar</button>
          <button class="mini-button" type="button" data-user-permissions="${user.id}">
            Permisos
          </button>
          <button class="mini-button" type="button" data-toggle-user="${user.id}">
            ${active ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>`;
}

/* ==========================================================================
   OPERACION
   ========================================================================== */

function renderSistema() {
  if (ui.vista) return renderSistemaVista();

  const branchId = ui.operationBranchId || getActiveBranch(state)?.id;
  const branch = branchById(state, branchId);

  const tables = state.tables.filter((table) => table.branchId === branchId);
  const stations = state.stations.filter((station) => station.branchId === branchId);
  const activeStations = stations.filter((station) => station.status !== "Inactiva");
  const printerAssignments = state.settings.printing?.stationPrinters || {};
  const assignedPrinters = stations.filter((station) => printerAssignments[station.id]).length;

  return `
    <div class="settings-tab-view">
      <section class="panel settings-operation-head">
        <div>
          <h2>Configuración por sucursal</h2>
        </div>

        <label>
          <span>Sucursal</span>
          <select data-operation-branch>
            ${activeBranches(state).map((item) => `
              <option value="${item.id}" ${branchId === item.id ? "selected" : ""}>
                ${escapeHtml(item.name)}
              </option>
            `).join("")}
          </select>
        </label>
      </section>

      <section class="settings-operation-grid">
        ${operationCard({
          title: "Mesas",
          value: tables.length,
          detail: `${tables.reduce((sum, table) => sum + Number(table.seats || 0), 0)} asientos configurados`,
          action: "mesas",
          actionLabel: "Gestionar mesas"
        })}

        ${operationCard({
          title: "Estaciones",
          value: activeStations.length,
          detail: stations.length
            ? `${stations.length} registradas en ${branch?.shortName || branch?.name || "la sucursal"}`
            : "Sin estaciones configuradas",
          action: "estaciones",
          actionLabel: "Gestionar estaciones"
        })}

        ${operationCard({
          title: "Impresión",
          value: `${assignedPrinters}/${stations.length}`,
          detail: "Estaciones con impresora asignada",
          action: "impresion",
          actionLabel: "Configurar impresión"
        })}

        ${operationCard({
          title: "Sistema",
          value: state.settings.kdsEnabled ? "KDS activo" : "KDS inactivo",
          detail: state.settings.loyaltyEnabled
            ? "Fidelización habilitada"
            : "Fidelización deshabilitada",
          action: "parametros",
          actionLabel: "Ajustar parámetros"
        })}
      </section>
    </div>`;
}

function operationCard({ title, value, detail, action, actionLabel }) {
  return `
    <article class="panel settings-operation-card">
      <header>
        <h3>${escapeHtml(title)}</h3>
        <strong>${escapeHtml(String(value))}</strong>
      </header>

      <p>${escapeHtml(detail)}</p>

      <footer>
        <button class="mini-button" type="button" data-operation-action="${action}">
          ${escapeHtml(actionLabel)}
        </button>
      </footer>
    </article>`;
}

/* ==========================================================================
   EVENTOS GENERALES
   ========================================================================== */

function wireCommon() {
  view.querySelectorAll("[data-settings-tab]").forEach((button) => {
    button.addEventListener("click", () => goTab(button.dataset.settingsTab));
  });

  view.querySelector("[data-active-branch]")?.addEventListener("change", (event) => {
    const branchId = event.target.value;

    if (!setActiveBranch(state, branchId)) {
      showToast("No se pudo cambiar la sucursal activa.");
      return;
    }

    ui.operationBranchId = branchId;
    showToast(`Sucursal activa: ${branchById(state, branchId)?.name || "Sucursal"}.`);
    render();
  });
}

function wireCurrentTab() {
  if (ui.tab === "general") wireGeneral();
  if (ui.tab === "sucursales") wireBranches();
  if (ui.tab === "usuarios") wireUsers();
  if (ui.tab === "sistema") wireSistema();
}

function goTab(tab) {
  if (!TABS.some(([id]) => id === tab)) return;

  ui.tab = tab;
  ui.vista = null;

  const url = new URL(location.href);
  url.searchParams.set("tab", tab);
  url.searchParams.delete("vista");

  history.replaceState({}, "", url);
  render();
}

/* ==========================================================================
   GENERAL - EVENTOS Y MODALES
   ========================================================================== */

function wireGeneral() {
  view.querySelector("[data-edit-business]")?.addEventListener("click", openBusinessModal);
  view.querySelector("[data-edit-billing]")?.addEventListener("click", openBillingModal);
  view.querySelector("[data-go-branches]")?.addEventListener("click", () => goTab("sucursales"));
}

function openBusinessModal() {
  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader("Datos del negocio", "General")}

      <form class="form-grid settings-modal-body" data-business-form>
        <label>
          Nombre comercial
          <input
            name="commercialName"
            value="${escapeHtml(state.settings.commercialName || "")}"
            required
          >
        </label>

        <label>
          Razón social
          <input
            name="legalName"
            value="${escapeHtml(state.settings.legalName || "")}"
            required
          >
        </label>

        <label>
          RUC
          <input
            name="ruc"
            value="${escapeHtml(state.settings.ruc || "")}"
            inputmode="numeric"
            maxlength="11"
            required
          >
        </label>

        <label>
          IGV (%)
          <input
            name="igv"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value="${Number(state.settings.igv || 0)}"
            required
          >
        </label>

        <label class="span-2">
          Dirección fiscal
          <input
            name="fiscalAddress"
            value="${escapeHtml(state.settings.fiscalAddress || "")}"
            required
          >
        </label>

        <label>
          Moneda
          <select name="currency">
            <option value="PEN" ${state.settings.currency === "PEN" ? "selected" : ""}>Soles (PEN)</option>
            <option value="USD" ${state.settings.currency === "USD" ? "selected" : ""}>Dólares (USD)</option>
          </select>
        </label>

        <label>
          Idioma principal
          <select name="language">
            <option value="es" ${state.settings.language === "es" ? "selected" : ""}>Español</option>
            <option value="en" ${state.settings.language === "en" ? "selected" : ""}>English</option>
          </select>
        </label>

        <div class="settings-form-note span-2">
          <strong>Datos de la empresa</strong>
          <small>
            Verifica que la información fiscal y comercial esté actualizada.
          </small>
        </div>

        ${modalActions("Guardar datos")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-business-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const ruc = String(data.ruc || "").trim();

    if (ruc && !/^\d{11}$/.test(ruc)) {
      showToast("El RUC debe tener 11 dígitos.");
      return;
    }

    state.settings.commercialName = String(data.commercialName || "").trim();
    state.settings.legalName = String(data.legalName || "").trim();
    state.settings.business = state.settings.legalName;
    state.settings.ruc = ruc;
    state.settings.igv = Number(data.igv || 0);
    state.settings.fiscalAddress = String(data.fiscalAddress || "").trim();
    state.settings.address = state.settings.fiscalAddress;
    state.settings.currency = data.currency;
    state.settings.language = data.language;

    addAuditEvent(state, {
      user: session.name,
      action: "Datos del negocio actualizados",
      module: "Configuración",
      detail: state.settings.legalName
    });

    saveState(state);
    closeModal();
    showToast("Datos del negocio actualizados.");
    render();
  });
}

function openBillingModal() {
  const billing = state.settings.billing;

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader("Comprobantes", "Caja y facturación")}

      <form class="form-grid settings-modal-body" data-billing-form>
        <label class="settings-check-row span-2">
          <input
            name="boletaEnabled"
            type="checkbox"
            value="1"
            ${billing.boletaEnabled !== false ? "checked" : ""}
          >
          <span>
            <strong>Emitir boletas</strong>
            <small>Permite emitir boletas en las ventas.</small>
          </span>
        </label>

        <label>
          Serie de boleta
          <input
            name="boletaSeries"
            value="${escapeHtml(billing.boletaSeries || "")}"
            placeholder="Ej. B001"
          >
        </label>

        <label class="settings-check-row span-2">
          <input
            name="facturaEnabled"
            type="checkbox"
            value="1"
            ${billing.facturaEnabled !== false ? "checked" : ""}
          >
          <span>
            <strong>Emitir facturas</strong>
            <small>Utiliza los datos fiscales registrados en General.</small>
          </span>
        </label>

        <label>
          Serie de factura
          <input
            name="facturaSeries"
            value="${escapeHtml(billing.facturaSeries || "")}"
            placeholder="Ej. F001"
          >
        </label>

        <div class="settings-form-note span-2">
          <strong>Datos de emisión</strong>
          <small>
            Las series y los datos fiscales se utilizarán al emitir comprobantes.
          </small>
        </div>

        ${modalActions("Guardar configuración")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-billing-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    state.settings.billing = {
      ...billing,
      boletaEnabled: data.get("boletaEnabled") === "1",
      facturaEnabled: data.get("facturaEnabled") === "1",
      boletaSeries: String(data.get("boletaSeries") || "").trim().toUpperCase(),
      facturaSeries: String(data.get("facturaSeries") || "").trim().toUpperCase(),
      enabled: Boolean(
        String(data.get("boletaSeries") || "").trim() ||
        String(data.get("facturaSeries") || "").trim()
      ),
      status: "Configurada"
    };

    addAuditEvent(state, {
      user: session.name,
      action: "Configuración de comprobantes actualizada",
      module: "Configuración",
      detail: "Boletas y facturas"
    });

    saveState(state);
    closeModal();
    showToast("Configuración de comprobantes guardada.");
    render();
  });
}

/* ==========================================================================
   SUCURSALES - EVENTOS Y MODALES
   ========================================================================== */

function wireBranches() {
  view.querySelector("[data-new-branch]")?.addEventListener("click", () => openBranchModal());

  view.querySelectorAll("[data-edit-branch]").forEach((button) => {
    button.addEventListener("click", () => openBranchModal(button.dataset.editBranch));
  });

  view.querySelectorAll("[data-main-branch]").forEach((button) => {
    button.addEventListener("click", () => setMainBranch(button.dataset.mainBranch));
  });

  view.querySelectorAll("[data-toggle-branch]").forEach((button) => {
    button.addEventListener("click", () => toggleBranch(button.dataset.toggleBranch));
  });
}

function openBranchModal(branchId = null) {
  const branch = branchId ? branchById(state, branchId) : null;

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader(branch ? "Editar sucursal" : "Nueva sucursal", "Sucursales")}

      <form class="form-grid settings-modal-body" data-branch-form>
        <label class="span-2">
          Nombre *
          <input
            name="name"
            value="${escapeHtml(branch?.name || "")}"
            placeholder="Ej. Chachapoyas - Centro"
            required
          >
        </label>

        <label>
          Nombre corto
          <input
            name="shortName"
            value="${escapeHtml(branch?.shortName || "")}"
            placeholder="Ej. Centro"
          >
        </label>

        <label>
          Código
          <input
            name="code"
            value="${escapeHtml(branch?.code || "")}"
            placeholder="Ej. CHA-02"
          >
        </label>

        <label>
          Ciudad *
          <input
            name="city"
            value="${escapeHtml(branch?.city || "")}"
            required
          >
        </label>

        <label>
          Región
          <input
            name="region"
            value="${escapeHtml(branch?.region || "Amazonas")}"
          >
        </label>

        <label class="span-2">
          Dirección *
          <input
            name="address"
            value="${escapeHtml(branch?.address || "")}"
            required
          >
        </label>

        <div class="settings-form-note span-2">
          <strong>Operación por local</strong>
          <small>
            Ventas, caja, mesas, inventario y reservas se registran por sucursal.
          </small>
        </div>

        ${modalActions(branch ? "Guardar cambios" : "Crear sucursal")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-branch-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));

    const payload = {
      name: String(data.name || "").trim(),
      shortName: String(data.shortName || "").trim() || String(data.name || "").trim(),
      code: String(data.code || "").trim().toUpperCase(),
      city: String(data.city || "").trim(),
      region: String(data.region || "").trim(),
      address: String(data.address || "").trim()
    };

    if (!payload.name || !payload.city || !payload.address) {
      showToast("Completa nombre, ciudad y dirección.");
      return;
    }

    const duplicateCode = state.branches.find(
      (item) =>
        item.id !== branch?.id &&
        payload.code &&
        String(item.code || "").toUpperCase() === payload.code
    );

    if (duplicateCode) {
      showToast("Ya existe una sucursal con ese código.");
      return;
    }

    if (branch) {
      Object.assign(branch, payload, { updatedAt: new Date().toISOString() });
    } else {
      const newBranch = {
        id: nextId(state, "branch", "SUC", 2),
        ...payload,
        country: "Perú",
        status: "Activa",
        isMain: state.branches.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      state.branches.push(newBranch);

      // Prepara Caja de la nueva sede sin abrirla.
      state.cashBoxes ||= [];
      if (!state.cashBoxes.some((box) => box.branchId === newBranch.id)) {
        state.cashBoxes.push({
          branchId: newBranch.id,
          open: false,
          user: null,
          opening: 0,
          openedAt: null,
          closedAt: null,
          movements: [],
          voids: [],
          countedAmount: null,
          difference: null
        });
      }
    }

    addAuditEvent(state, {
      user: session.name,
      action: branch ? "Sucursal actualizada" : "Sucursal creada",
      module: "Configuración",
      detail: payload.name
    });

    saveState(state);
    closeModal();
    showToast(branch ? "Sucursal actualizada." : "Sucursal creada.");
    render();
  });
}

async function setMainBranch(branchId) {
  const branch = branchById(state, branchId);
  if (!branch || branch.status !== "Activa") return;

  const ok = await confirmAction({
    title: "Cambiar sucursal principal",
    message: `${branch.name} pasará a ser la sucursal principal de Cafe Fusiones.`,
    label: "Hacer principal"
  });

  if (!ok) return;

  state.branches.forEach((item) => {
    item.isMain = item.id === branchId;
  });

  addAuditEvent(state, {
    user: session.name,
    action: "Sucursal principal actualizada",
    module: "Configuración",
    detail: branch.name,
    branchId
  });

  saveState(state);
  showToast(`${branch.name} ahora es la sucursal principal.`);
  render();
}

async function toggleBranch(branchId) {
  const branch = branchById(state, branchId);
  if (!branch) return;

  const isActive = branch.status === "Activa";

  if (isActive) {
    const otherActive = state.branches.filter(
      (item) => item.id !== branch.id && item.status === "Activa"
    );

    if (!otherActive.length) {
      showToast("Debe existir al menos una sucursal activa.");
      return;
    }

    if (branch.isMain) {
      showToast("Define otra sucursal como principal antes de desactivar esta.");
      return;
    }

    const usage = branchUsage(branch.id);
    const hasHistory = usage.sales || usage.inventory || usage.purchases || usage.reservations;

    const ok = await confirmAction({
      title: "Desactivar sucursal",
      message: hasHistory
        ? "La sucursal tiene información histórica. No se eliminará; quedará inactiva y sus registros se conservarán."
        : "La sucursal dejará de estar disponible para nuevas operaciones.",
      label: "Desactivar"
    });

    if (!ok) return;

    branch.status = "Inactiva";

    if (state.settings.activeBranchId === branch.id) {
      const replacement = otherActive[0];
      state.settings.activeBranchId = replacement.id;
      ui.operationBranchId = replacement.id;
    }
  } else {
    branch.status = "Activa";
  }

  branch.updatedAt = new Date().toISOString();

  addAuditEvent(state, {
    user: session.name,
    action: isActive ? "Sucursal desactivada" : "Sucursal activada",
    module: "Configuración",
    detail: branch.name,
    branchId: branch.id
  });

  saveState(state);
  showToast(isActive ? "Sucursal desactivada." : "Sucursal activada.");
  render();
}

/* ==========================================================================
   USUARIOS - EVENTOS Y MODALES
   ========================================================================== */

function wireUsers() {
  view.querySelector("[data-new-user]")?.addEventListener("click", () => openUserModal());

  view.querySelectorAll("[data-edit-user]").forEach((button) => {
    button.addEventListener("click", () => openUserModal(button.dataset.editUser));
  });

  view.querySelectorAll("[data-user-permissions]").forEach((button) => {
    button.addEventListener("click", () => openPermissionsModal(button.dataset.userPermissions));
  });

  view.querySelectorAll("[data-toggle-user]").forEach((button) => {
    button.addEventListener("click", () => toggleUser(button.dataset.toggleUser));
  });
}

function openUserModal(userId = null) {
  const user = userId
    ? state.users.find((item) => item.id === userId)
    : null;

  const allBranchAccess = Array.isArray(user?.branchIds) && user.branchIds.includes("ALL");
  const branchIds = Array.isArray(user?.branchIds)
    ? user.branchIds
    : [state.settings.activeBranchId];

  const roles = uniqueRoles();

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader(user ? "Editar usuario" : "Nuevo usuario", "Usuarios")}

      <form class="form-grid settings-modal-body" data-user-form>
        <label class="span-2">
          Nombre *
          <input
            name="name"
            value="${escapeHtml(user?.name || "")}"
            required
          >
        </label>

        <label>
          Correo *
          <input
            name="email"
            type="email"
            value="${escapeHtml(user?.email || "")}"
            required
          >
        </label>

        <label>
          Teléfono
          <input
            name="phone"
            value="${escapeHtml(user?.phone || "")}"
          >
        </label>

        <label>
          Rol *
          <input
            name="role"
            list="role-options"
            value="${escapeHtml(user?.role || "")}"
            placeholder="Ej. Caja"
            required
          >
          <datalist id="role-options">
            ${roles.map((role) => `<option value="${escapeHtml(role)}"></option>`).join("")}
          </datalist>
        </label>

        <label>
          Estación <span class="optional">(opcional)</span>
          <select name="station">
            <option value="">Sin estación fija</option>
            ${state.stations
              .filter((station) => station.status !== "Inactiva")
              .map((station) => `
                <option
                  value="${escapeHtml(station.name)}"
                  ${user?.station === station.name ? "selected" : ""}
                >
                  ${escapeHtml(station.name)} · ${escapeHtml(branchById(state, station.branchId)?.shortName || "Sucursal")}
                </option>
              `).join("")}
          </select>
        </label>

        <label class="settings-check-row span-2">
          <input
            name="allBranches"
            type="checkbox"
            value="1"
            ${allBranchAccess ? "checked" : ""}
            data-all-user-branches
          >
          <span>
            <strong>Acceso a todas las sucursales</strong>
            <small>Útil para administración o gerencia.</small>
          </span>
        </label>

        <div
          class="settings-branch-checks span-2"
          data-user-branches
          ${allBranchAccess ? "hidden" : ""}
        >
          ${activeBranches(state).map((branch) => `
            <label>
              <input
                type="checkbox"
                name="branchIds"
                value="${branch.id}"
                ${branchIds.includes(branch.id) ? "checked" : ""}
              >
              <span>${escapeHtml(branch.name)}</span>
            </label>
          `).join("")}
        </div>

        <div class="settings-form-note span-2">
          <strong>Accesos</strong>
          <small>
            Puedes ajustar los permisos del usuario después de guardarlo.
          </small>
        </div>

        ${modalActions(user ? "Guardar cambios" : "Crear usuario")}
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-user-form]");
  const allBranchesControl = modal.querySelector("[data-all-user-branches]");
  const branchBox = modal.querySelector("[data-user-branches]");

  allBranchesControl?.addEventListener("change", () => {
    if (branchBox) branchBox.hidden = allBranchesControl.checked;
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim().toLowerCase();

    const duplicate = state.users.find(
      (item) =>
        item.id !== user?.id &&
        String(item.email || "").trim().toLowerCase() === email
    );

    if (duplicate) {
      showToast("Ya existe un usuario con ese correo.");
      return;
    }

    let branchAccess = ["ALL"];

    if (data.get("allBranches") !== "1") {
      branchAccess = data.getAll("branchIds").filter(Boolean);

      if (!branchAccess.length) {
        showToast("Selecciona al menos una sucursal.");
        return;
      }
    }

    const payload = {
      name: String(data.get("name") || "").trim(),
      email,
      phone: String(data.get("phone") || "").trim(),
      role: String(data.get("role") || "").trim(),
      station: String(data.get("station") || "").trim(),
      branchIds: branchAccess,
      defaultBranchId: branchAccess.includes("ALL")
        ? state.settings.activeBranchId
        : branchAccess[0]
    };

    if (user) {
      Object.assign(user, payload);
    } else {
      state.users.push({
        id: uniqueUserId(),
        ...payload,
        status: "Activo",
        lastAccess: "Sin acceso",
        permissionMode: "role",
        permissions: []
      });
    }

    addAuditEvent(state, {
      user: session.name,
      action: user ? "Usuario actualizado" : "Usuario creado",
      module: "Configuración",
      detail: payload.name
    });

    saveState(state);
    closeModal();
    showToast(user ? "Usuario actualizado." : "Usuario creado.");
    render();
  });
}

function openPermissionsModal(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;

  const custom = user.permissionMode === "custom";
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const html = `
    <section class="modal settings-permissions-modal" role="dialog" aria-modal="true">
      ${modalHeader(`Permisos · ${user.name}`, "Usuarios")}

      <form class="settings-modal-body" data-permissions-form>
        <div class="settings-permission-mode">
          <label>
            <input
              type="radio"
              name="permissionMode"
              value="role"
              ${!custom ? "checked" : ""}
            >
            <span>
              <strong>Usar permisos del rol</strong>
              <small>Usa los accesos definidos para su rol.</small>
            </span>
          </label>

          <label>
            <input
              type="radio"
              name="permissionMode"
              value="custom"
              ${custom ? "checked" : ""}
            >
            <span>
              <strong>Personalizar este usuario</strong>
              <small>Elige las secciones a las que puede acceder.</small>
            </span>
          </label>
        </div>

        <div class="settings-permission-grid" data-permission-grid ${!custom ? "hidden" : ""}>
          ${PERMISSIONS.map(([id, label]) => `
            <label>
              <input
                type="checkbox"
                name="permissions"
                value="${id}"
                ${permissions.includes(id) ? "checked" : ""}
              >
              <span>${escapeHtml(label)}</span>
            </label>
          `).join("")}
        </div>

        <div class="settings-form-note">
          <strong>Acceso personalizado</strong>
          <small>
            Usa esta opción solo cuando el usuario necesite permisos distintos a su rol.
          </small>
        </div>

        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar permisos</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-permissions-form]");
  const grid = modal.querySelector("[data-permission-grid]");

  form?.querySelectorAll('input[name="permissionMode"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (grid) grid.hidden = form.elements.permissionMode.value !== "custom";
    });
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const mode = String(data.get("permissionMode") || "role");

    user.permissionMode = mode;
    user.permissions = mode === "custom"
      ? data.getAll("permissions")
      : [];

    addAuditEvent(state, {
      user: session.name,
      action: "Permisos de usuario actualizados",
      module: "Configuración",
      detail: user.name
    });

    saveState(state);
    closeModal();
    showToast("Permisos actualizados.");
    render();
  });
}

async function toggleUser(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;

  const active = user.status !== "Inactivo";

  if (active && user.id === session.id) {
    showToast("No puedes desactivar tu propia sesión.");
    return;
  }

  if (active) {
    const ok = await confirmAction({
      title: "Desactivar usuario",
      message: `${user.name} dejará de tener acceso al sistema. Su historial se conservará.`,
      label: "Desactivar"
    });

    if (!ok) return;
  }

  user.status = active ? "Inactivo" : "Activo";

  addAuditEvent(state, {
    user: session.name,
    action: active ? "Usuario desactivado" : "Usuario activado",
    module: "Configuración",
    detail: user.name
  });

  saveState(state);
  showToast(active ? "Usuario desactivado." : "Usuario activado.");
  render();
}

/* ==========================================================================
   OPERACION - EVENTOS
   ========================================================================== */

// Cada tarjeta abre su propia pantalla dentro de Sistema (no un modal):
// el menu lateral y el submenu siguen visibles.
function renderSistemaVista() {
  const branch = branchById(state, ui.operationBranchId);
  const cuerpo = {
    mesas: () => `<div class="settings-plan-body" data-plan-body>${planoEditorBody()}</div>`,
    estaciones: stationsViewBody,
    impresion: printingViewBody,
    parametros: systemViewBody
  }[ui.vista];

  return `
    <div class="settings-tab-view">
      <section class="panel settings-subpage-head">
        <button class="settings-back" type="button" data-sistema-back>‹ Volver</button>
        <div>
          <p class="eyebrow">Sistema${ui.vista === "parametros" ? "" : ` · ${escapeHtml(branch?.shortName || branch?.name || "Sucursal")}`}</p>
          <h2>${VISTA_TITULOS[ui.vista]}</h2>
        </div>
      </section>
      <section class="panel settings-subpage" data-sistema-vista>
        ${cuerpo()}
      </section>
    </div>`;
}

function goVista(vista) {
  ui.vista = SISTEMA_VISTAS.includes(vista) ? vista : null;
  planoUi.seleccion = null;

  const url = new URL(location.href);
  url.searchParams.set("tab", "sistema");
  if (ui.vista) url.searchParams.set("vista", ui.vista);
  else url.searchParams.delete("vista");
  history.replaceState({}, "", url);

  render();
  window.scrollTo({ top: 0 });
}

function wireSistema() {
  if (ui.vista) {
    wireSistemaVista();
    return;
  }

  view.querySelector("[data-operation-branch]")?.addEventListener("change", (event) => {
    ui.operationBranchId = event.target.value;
    render();
  });

  view.querySelectorAll("[data-operation-action]").forEach((button) => {
    button.addEventListener("click", () => goVista(button.dataset.operationAction));
  });
}

function wireSistemaVista() {
  const root = view.querySelector("[data-sistema-vista]");
  view.querySelector("[data-sistema-back]")?.addEventListener("click", () => goVista(null));
  root?.querySelectorAll("[data-sistema-cancel]").forEach((button) => {
    button.addEventListener("click", () => goVista(null));
  });

  if (ui.vista === "mesas") wirePlanoEditor(root);
  if (ui.vista === "estaciones") wireStationsView(root);
  if (ui.vista === "impresion") wirePrintingView(root);
  if (ui.vista === "parametros") wireSystemView(root);
}

/* ==========================================================================
   SISTEMA - MESAS
   ========================================================================== */


function planoEditorBody() {
  const mesas = planoTables();
  const zonas = planoZones();
  const sel = planoSelected();

  return `
    <div class="plan-toolbar">
      <p class="muted">Arrastra una mesa o una zona para moverla.</p>
      <div class="plan-toolbar__actions">
        <button class="mini-button" type="button" data-plan-new-zone>Nueva zona</button>
        <button class="button button--primary" type="button" data-plan-new-table>
          ${icon("plus")}<span>Nueva mesa</span>
        </button>
      </div>
    </div>

    <div class="plan-editor">
      ${lienzoHtml(
        zonas.map(planoZoneEl).join("") + mesas.map(planoTableEl).join(""),
        { editable: true }
      )}
      <aside class="plan-inspector">${planoInspector(sel)}</aside>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Mesa</th><th>Zona</th><th>Capacidad</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          ${mesas.map((table) => `
            <tr>
              <td><strong>${escapeHtml(table.name || table.id)}</strong></td>
              <td>${escapeHtml(table.area || "Sin zona")}</td>
              <td>${Number(table.seats || 0)} personas</td>
              <td><span class="${statusClass(table.status)}">${escapeHtml(table.status || "Libre")}</span></td>
              <td><button class="mini-button" type="button" data-edit-table="${table.id}">Editar</button></td>
            </tr>
          `).join("") || `<tr><td colspan="5" class="text-center muted">No hay mesas configuradas.</td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function planoTables() {
  return state.tables.filter(
    (table) => table.branchId === ui.operationBranchId && Number(table.seats || 0) > 0 && table.map
  );
}

function planoZones() {
  return (state.floorZones || []).filter(
    (zone) => !zone.branchId || zone.branchId === ui.operationBranchId
  );
}

function planoSelected() {
  if (!planoUi.seleccion) return null;
  const { tipo, id } = planoUi.seleccion;
  return tipo === "mesa"
    ? state.tables.find((table) => table.id === id) || null
    : (state.floorZones || []).find((zone) => zone.id === id) || null;
}

function planoSelectedClass(tipo, id) {
  return planoUi.seleccion?.tipo === tipo && planoUi.seleccion?.id === id;
}

function planoTableEl(table) {
  return mesaHtml(table, { editable: true, selected: planoSelectedClass("mesa", table.id) });
}

function planoZoneEl(zone) {
  return zonaHtml(zone, { editable: true, selected: planoSelectedClass("zona", zone.id) });
}

function planoInspector(elemento) {
  if (!elemento) {
    return `
      <p class="eyebrow">Elemento</p>
      <p class="muted">Toca una mesa o una zona del plano para editarla o eliminarla.</p>`;
  }

  const esMesa = planoUi.seleccion.tipo === "mesa";

  return `
    <p class="eyebrow">${esMesa ? "Mesa" : "Zona"}</p>
    <label>Nombre
      <input data-plan-name value="${escapeHtml(elemento.name || "")}" maxlength="40">
    </label>
    ${esMesa ? `
      <label>Zona
        <input data-plan-area value="${escapeHtml(elemento.area || "")}" placeholder="Ej. Salón principal">
      </label>
      <label>Capacidad
        <input data-plan-seats type="number" min="1" max="30" step="1" value="${Number(elemento.seats || 2)}">
      </label>
      <label>Forma
        <select data-plan-shape>
          <option value="rect" ${elemento.map.shape === "round" ? "" : "selected"}>Cuadrada</option>
          <option value="round" ${elemento.map.shape === "round" ? "selected" : ""}>Redonda</option>
        </select>
      </label>
    ` : `
      <label>Tipo
        <select data-plan-type>
          <option value="area" ${elemento.type === "area" ? "selected" : ""}>Ambiente</option>
          <option value="station" ${elemento.type === "station" ? "selected" : ""}>Estación (abre su pantalla)</option>
          <option value="door" ${elemento.type === "door" ? "selected" : ""}>Acceso</option>
        </select>
      </label>
    `}
    <button class="mini-button mini-button--danger" type="button" data-plan-delete>Eliminar</button>`;
}

/* -------------------- arrastre y redimension (pointer events) --------------------
   Se usa pointerdown/move/up en vez de mouse o touch para que el mismo gesto
   funcione con mouse, dedo y lapiz. Las medidas se guardan en porcentaje sobre
   el lienzo, que es lo que Ventas vuelve a pintar.
   ------------------------------------------------------------------------------ */

function wirePlanoEditor(root) {
  const cuerpo = root?.querySelector("[data-plan-body]");
  const lienzo = root?.querySelector("[data-plan-canvas]");
  if (!lienzo) return;

  const repintar = () => {
    cuerpo.innerHTML = planoEditorBody();
    wirePlanoEditor(root);
  };

  lienzo.addEventListener("pointerdown", (event) => {
    const elemento = event.target.closest("[data-plan-item]");
    if (!elemento) return;

    const tipo = elemento.dataset.planItem;
    const id = elemento.dataset.planId;
    const registro = tipo === "mesa"
      ? state.tables.find((table) => table.id === id)
      : state.floorZones.find((zone) => zone.id === id);
    if (!registro) return;

    planoUi.seleccion = { tipo, id };
    root.querySelector(".plan-inspector").innerHTML = planoInspector(registro);
    wirePlanoInspector(root, repintar);
    lienzo.querySelectorAll(".floor-item").forEach((item) => item.classList.remove("is-selected"));
    elemento.classList.add("is-selected");

    // Las mesas tienen tamano unico: se corrige el guardado antes de moverla.
    if (tipo === "mesa") registro.map = { ...registro.map, ...tamanoMesa() };

    const redimensionando = Boolean(event.target.closest("[data-plan-resize]"));
    const caja = lienzo.getBoundingClientRect();
    const partidaX = event.clientX;
    const partidaY = event.clientY;
    const base = { ...registro.map };

    event.preventDefault();
    elemento.setPointerCapture?.(event.pointerId);

    const mover = (ev) => {
      const dx = ((ev.clientX - partidaX) / caja.width) * 100;
      const dy = ((ev.clientY - partidaY) / caja.height) * 100;

      // Todo cae en la grilla del plano, para que quede alineado sin puntería.
      if (redimensionando) {
        // Las mesas no se redimensionan: todas tienen el mismo tamaño.
        if (tipo === "mesa") return;
        registro.map.w = acotar(snapPlano(base.w + dx), PLANO_GRID * 2, 100 - registro.map.x);
        registro.map.h = acotar(snapPlano(base.h + dy), PLANO_GRID * 2, 100 - registro.map.y);
      } else {
        registro.map.x = acotar(snapPlano(base.x + dx), 0, 100 - registro.map.w);
        registro.map.y = acotar(snapPlano(base.y + dy), 0, 100 - registro.map.h);
      }

      elemento.style.left = `${registro.map.x}%`;
      elemento.style.top = `${registro.map.y}%`;
      elemento.style.width = `${registro.map.w}%`;
      elemento.style.height = `${registro.map.h}%`;
    };

    const soltar = () => {
      elemento.releasePointerCapture?.(event.pointerId);
      elemento.removeEventListener("pointermove", mover);
      elemento.removeEventListener("pointerup", soltar);
      elemento.removeEventListener("pointercancel", soltar);
      saveState(state);
    };

    elemento.addEventListener("pointermove", mover);
    elemento.addEventListener("pointerup", soltar);
    elemento.addEventListener("pointercancel", soltar);
  });

  wirePlanoInspector(root, repintar);

  root.querySelector("[data-plan-new-table]")?.addEventListener("click", () => {
    const id = uniqueTableId();
    state.tables.push({
      id,
      name: `Mesa ${planoTables().length + 1}`,
      area: "Salon principal",
      seats: 2,
      status: "Libre",
      branchId: ui.operationBranchId,
      customerId: null,
      openedAt: null,
      items: [],
      map: { x: 45, y: 45, ...tamanoMesa(), shape: "rect" }
    });
    addAuditEvent(state, {
      user: session.name, action: "Mesa creada", module: "Configuración",
      detail: id, branchId: ui.operationBranchId
    });
    saveState(state);
    planoUi.seleccion = { tipo: "mesa", id };
    repintar();
    showToast("Mesa agregada al plano.");
  });

  root.querySelector("[data-plan-new-zone]")?.addEventListener("click", () => {
    // Defensa: si la secuencia viene desfasada de un estado viejo, se avanza
    // hasta un id libre en vez de duplicar una zona existente.
    let id = nextId(state, "floorZone", "ZON", 2);
    while (state.floorZones.some((zone) => zone.id === id)) {
      id = nextId(state, "floorZone", "ZON", 2);
    }
    state.floorZones.push({
      id,
      name: "Nueva zona",
      type: "area",
      branchId: ui.operationBranchId,
      map: { x: 40, y: 20, w: 15, h: 7.5 }
    });
    addAuditEvent(state, {
      user: session.name, action: "Zona creada", module: "Configuración",
      detail: id, branchId: ui.operationBranchId
    });
    saveState(state);
    planoUi.seleccion = { tipo: "zona", id };
    repintar();
    showToast("Zona agregada al plano.");
  });

  root.querySelectorAll("[data-edit-table]").forEach((boton) => {
    boton.addEventListener("click", () => openTableForm(boton.dataset.editTable));
  });
}

function wirePlanoInspector(root, repintar) {
  const inspector = root.querySelector(".plan-inspector");
  if (!inspector) return;

  // IMPORTANTE: `saveState` normaliza el estado y reemplaza los objetos de los
  // arrays, asi que guardar una referencia aqui la deja obsoleta en el segundo
  // evento. Por eso cada handler vuelve a buscar el registro por id.
  if (!planoSelected()) return;

  const registro = () => planoSelected();

  const pintarEtiqueta = (texto) => {
    const elemento = registro();
    if (!elemento) return;
    const caja = inspector.closest(".settings-plan-body")
      ?.querySelector(`[data-plan-id="${cssEscape(elemento.id)}"]`);
    const destino = caja?.querySelector(".floor-item__name, .floor-item__code");
    if (destino) destino.textContent = String(texto || "").replace(/^Mesa\s+/i, "");
  };

  inspector.querySelector("[data-plan-name]")?.addEventListener("input", (event) => {
    const elemento = registro();
    if (!elemento) return;
    elemento.name = event.target.value;
    pintarEtiqueta(elemento.name);
    saveState(state);
  });

  inspector.querySelector("[data-plan-area]")?.addEventListener("input", (event) => {
    const elemento = registro();
    if (!elemento) return;
    elemento.area = event.target.value;
    saveState(state);
  });

  inspector.querySelector("[data-plan-seats]")?.addEventListener("change", (event) => {
    const elemento = registro();
    if (!elemento) return;
    elemento.seats = Math.max(1, Number(event.target.value || 1));
    // Cambiar la capacidad no cambia el tamaño: todas las mesas miden lo mismo.
    elemento.map = normalizarMapaMesa(elemento);
    saveState(state);
    repintar();
  });

  inspector.querySelector("[data-plan-shape]")?.addEventListener("change", (event) => {
    const elemento = registro();
    if (!elemento) return;
    elemento.map = { ...elemento.map, shape: event.target.value === "round" ? "round" : "rect" };
    saveState(state);
    repintar();
  });

  inspector.querySelector("[data-plan-type]")?.addEventListener("change", (event) => {
    const elemento = registro();
    if (!elemento) return;
    elemento.type = event.target.value;
    saveState(state);
    repintar();
  });

  inspector.querySelector("[data-plan-delete]")?.addEventListener("click", async () => {
    const elemento = registro();
    if (!elemento) return;
    const esMesa = planoUi.seleccion.tipo === "mesa";
    const nombre = elemento.name || elemento.id;

    if (esMesa && elemento.items?.length) {
      showToast("La mesa tiene consumo abierto: cobra o libera la mesa antes de eliminarla.");
      return;
    }

    // El editor vive en la pagina (no en un modal), asi que sigue en el DOM
    // mientras se muestra la confirmacion.
    const confirmado = await confirmAction({
      title: esMesa ? "Eliminar mesa" : "Eliminar zona",
      message: `¿Seguro que quieres eliminar "${nombre}" del plano? Esta accion no se puede deshacer.`,
      label: "Eliminar"
    });

    if (!confirmado) return;

    if (esMesa) {
      state.tables = state.tables.filter((table) => table.id !== elemento.id);
    } else {
      state.floorZones = state.floorZones.filter((zone) => zone.id !== elemento.id);
    }

    addAuditEvent(state, {
      user: session.name,
      action: esMesa ? "Mesa eliminada" : "Zona eliminada",
      module: "Configuración",
      detail: nombre,
      branchId: ui.operationBranchId
    });
    saveState(state);
    planoUi.seleccion = null;
    render();
    showToast(esMesa ? "Mesa eliminada." : "Zona eliminada.");
  });
}

function cssEscape(valor) {
  return String(valor).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function openTableForm(tableId = null) {
  const table = tableId
    ? state.tables.find((item) => item.id === tableId)
    : null;
  const currentMap = table?.map || { x: 15, y: 18, w: 10, h: 10, shape: "rect" };

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader(table ? "Editar mesa" : "Nueva mesa", "Operación")}

      <form class="form-grid settings-modal-body" data-table-form>
        <label>
          Nombre *
          <input
            name="name"
            value="${escapeHtml(table?.name || "")}"
            placeholder="Ej. Mesa 7"
            required
          >
        </label>

        <label>
          Zona
          <input
            name="area"
            value="${escapeHtml(table?.area || "")}"
            placeholder="Ej. Salón principal"
          >
        </label>

        <label>
          Capacidad
          <input
            name="seats"
            type="number"
            min="0"
            max="30"
            step="1"
            value="${Number(table?.seats ?? 2)}"
          >
        </label>

        <label>
          Estado operativo
          <select name="status">
            ${["Libre", "Ocupada", "Reservada", "Fuera de servicio"].map((status) => `
              <option ${table?.status === status ? "selected" : ""}>${status}</option>
            `).join("")}
          </select>
        </label>

        <label class="span-2">
          Forma
          <select name="shape">
            <option value="rect" ${currentMap.shape === "round" ? "" : "selected"}>Cuadrada</option>
            <option value="round" ${currentMap.shape === "round" ? "selected" : ""}>Redonda</option>
          </select>
        </label>

        <div class="settings-form-note span-2">
          <strong>Ubicación en el plano</strong>
          <small>
            La posición y el tamaño se ajustan arrastrando la mesa en el plano.
            Ventas muestra el plano guardado.
          </small>
        </div>

        ${modalActions(table ? "Guardar cambios" : "Crear mesa")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-table-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const shape = String(data.shape || "rect") === "round" ? "round" : "rect";

    const payload = {
      name: String(data.name || "").trim(),
      area: String(data.area || "").trim(),
      seats: Number(data.seats || 0),
      status: data.status,
      branchId: ui.operationBranchId,
      // La posicion se define arrastrando en el plano; aqui solo se conserva.
      map: { ...currentMap, shape }
    };

    if (table) {
      Object.assign(table, payload);
    } else {
      state.tables.push({
        id: uniqueTableId(),
        ...payload,
        customerId: null,
        openedAt: null,
        items: []
      });
    }

    addAuditEvent(state, {
      user: session.name,
      action: table ? "Mesa actualizada" : "Mesa creada",
      module: "Configuración",
      detail: `${payload.name} · ${branchById(state, ui.operationBranchId)?.name || "Sucursal"}`,
      branchId: ui.operationBranchId
    });

    saveState(state);
    closeModal();
    showToast(table ? "Mesa actualizada." : "Mesa creada.");
    render();
  });
}

/* ==========================================================================
   SISTEMA - ESTACIONES
   ========================================================================== */

function stationsViewBody() {
  const stations = state.stations.filter((station) => station.branchId === ui.operationBranchId);

  return `
    <div class="settings-inline-head">
      <p>
        Las estaciones organizan KDS y producción. Barra y Cocina pueden
        mantenerse separadas aunque físicamente compartan espacio.
      </p>
      <button class="button button--primary" type="button" data-new-station>
        ${icon("plus")}<span>Nueva estación</span>
      </button>
    </div>

    <div class="settings-station-list">
      ${stations.map((station) => `
        <article>
          <div>
            <span class="${statusClass(station.status)}">${escapeHtml(station.status)}</span>
            <strong>${escapeHtml(station.name)}</strong>
            <small>${escapeHtml(station.type || "Operativa")} · objetivo ${Number(station.targetMinutes || 0)} min</small>
          </div>
          <button class="mini-button" type="button" data-edit-station="${station.id}">
            Editar
          </button>
        </article>
      `).join("") || `
        <div class="settings-empty settings-empty--small">
          <strong>Sin estaciones</strong>
          <p>Crea las estaciones que realmente utiliza esta sucursal.</p>
        </div>
      `}
    </div>`;
}

function wireStationsView(root) {
  root?.querySelector("[data-new-station]")?.addEventListener("click", () => openStationForm());

  root?.querySelectorAll("[data-edit-station]").forEach((button) => {
    button.addEventListener("click", () => openStationForm(button.dataset.editStation));
  });
}

function openStationForm(stationId = null) {
  const station = stationId
    ? state.stations.find((item) => item.id === stationId)
    : null;

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader(station ? "Editar estación" : "Nueva estación", "Operación")}

      <form class="form-grid settings-modal-body" data-station-form>
        <label>
          Nombre *
          <input
            name="name"
            value="${escapeHtml(station?.name || "")}"
            placeholder="Ej. Barra"
            required
          >
        </label>

        <label>
          Tipo
          <input
            name="type"
            value="${escapeHtml(station?.type || "")}"
            placeholder="Ej. Barista"
          >
        </label>

        <label>
          Tiempo objetivo (min)
          <input
            name="targetMinutes"
            type="number"
            min="1"
            max="120"
            step="1"
            value="${Number(station?.targetMinutes || 5)}"
          >
        </label>

        <label>
          Estado
          <select name="status">
            <option value="Activa" ${station?.status !== "Inactiva" ? "selected" : ""}>Activa</option>
            <option value="Inactiva" ${station?.status === "Inactiva" ? "selected" : ""}>Inactiva</option>
          </select>
        </label>

        ${modalActions(station ? "Guardar cambios" : "Crear estación")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-station-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));

    const payload = {
      name: String(data.name || "").trim(),
      type: String(data.type || "").trim(),
      targetMinutes: Number(data.targetMinutes || 5),
      status: data.status,
      branchId: ui.operationBranchId
    };

    if (station) {
      Object.assign(station, payload);
    } else {
      state.stations.push({
        id: uniqueStationId(),
        ...payload
      });
    }

    addAuditEvent(state, {
      user: session.name,
      action: station ? "Estación actualizada" : "Estación creada",
      module: "Configuración",
      detail: payload.name,
      branchId: ui.operationBranchId
    });

    saveState(state);
    closeModal();
    showToast(station ? "Estación actualizada." : "Estación creada.");
    render();
  });
}

/* ==========================================================================
   SISTEMA - IMPRESION
   ========================================================================== */

function printingViewBody() {
  const stations = state.stations.filter((station) => station.branchId === ui.operationBranchId);
  const printing = state.settings.printing || { stationPrinters: {} };

  return `
    <form class="settings-subpage-form" data-printing-form>
      <div class="settings-check-stack">
        <label class="settings-check-row">
          <input type="checkbox" name="autoKitchen" value="1" ${printing.autoKitchen ? "checked" : ""}>
          <span>
            <strong>Imprimir comandas automáticamente</strong>
            <small>Imprime la comanda al enviar el pedido.</small>
          </span>
        </label>

        <label class="settings-check-row">
          <input type="checkbox" name="autoReceipt" value="1" ${printing.autoReceipt ? "checked" : ""}>
          <span>
            <strong>Imprimir comprobante al cerrar venta</strong>
            <small>Imprime el comprobante al cerrar la venta.</small>
          </span>
        </label>
      </div>

      <div class="settings-printer-fields">
        <h3>Impresora por estación</h3>
        ${stations.length
          ? stations.map((station) => `
            <label>
              <span>${escapeHtml(station.name)}</span>
              <input
                name="printer_${station.id}"
                value="${escapeHtml(printing.stationPrinters?.[station.id] || "")}"
                placeholder="Sin asignar"
              >
            </label>
          `).join("")
          : `<p class="muted">Primero configura una estación para esta sucursal.</p>`
        }
      </div>

      <div class="settings-subpage-actions">
        <button class="button button--secondary" type="button" data-sistema-cancel>Cancelar</button>
        <button class="button button--primary" type="submit">Guardar impresión</button>
      </div>
    </form>`;
}

function wirePrintingView(root) {
  const branchId = ui.operationBranchId;
  const stations = state.stations.filter((station) => station.branchId === branchId);

  root?.querySelector("[data-printing-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const stationPrinters = {
      ...(state.settings.printing?.stationPrinters || {})
    };

    stations.forEach((station) => {
      const value = String(data.get(`printer_${station.id}`) || "").trim();

      if (value) stationPrinters[station.id] = value;
      else delete stationPrinters[station.id];
    });

    state.settings.printing = {
      ...state.settings.printing,
      autoKitchen: data.get("autoKitchen") === "1",
      autoReceipt: data.get("autoReceipt") === "1",
      stationPrinters
    };

    addAuditEvent(state, {
      user: session.name,
      action: "Configuración de impresión actualizada",
      module: "Configuración",
      detail: branchById(state, branchId)?.name || "Sucursal",
      branchId
    });

    saveState(state);
    showToast("Configuración de impresión guardada.");
    goVista(null);
  });
}

/* ==========================================================================
   SISTEMA - PARAMETROS
   ========================================================================== */

function systemViewBody() {
  return `
    <form class="settings-subpage-form" data-system-form>
      <div class="settings-check-stack">
        <label class="settings-check-row">
          <input type="checkbox" name="kdsEnabled" value="1" ${state.settings.kdsEnabled ? "checked" : ""}>
          <span>
            <strong>KDS habilitado</strong>
            <small>Permite enviar pedidos a las estaciones de producción.</small>
          </span>
        </label>

        <label class="settings-check-row">
          <input type="checkbox" name="loyaltyEnabled" value="1" ${state.settings.loyaltyEnabled ? "checked" : ""}>
          <span>
            <strong>Fidelización habilitada</strong>
            <small>Permite afiliación, puntos y recompensas.</small>
          </span>
        </label>
      </div>

      <p class="muted">Estos ajustes se aplican a todas las sucursales.</p>

      <div class="settings-subpage-actions">
        <button class="button button--secondary" type="button" data-sistema-cancel>Cancelar</button>
        <button class="button button--primary" type="submit">Guardar parámetros</button>
      </div>
    </form>`;
}

function wireSystemView(root) {
  root?.querySelector("[data-system-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    state.settings.kdsEnabled = data.get("kdsEnabled") === "1";
    state.settings.loyaltyEnabled = data.get("loyaltyEnabled") === "1";

    addAuditEvent(state, {
      user: session.name,
      action: "Parámetros del sistema actualizados",
      module: "Configuración",
      detail: `KDS ${state.settings.kdsEnabled ? "activo" : "inactivo"} · Fidelización ${state.settings.loyaltyEnabled ? "activa" : "inactiva"}`
    });

    saveState(state);
    showToast("Parámetros actualizados.");
    goVista(null);
  });
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function userBranchesLabel(user) {
  const ids = Array.isArray(user.branchIds) ? user.branchIds : [];

  if (ids.includes("ALL")) return "Todas las sucursales";

  const names = ids
    .map((id) => branchById(state, id)?.shortName || branchById(state, id)?.name)
    .filter(Boolean);

  return names.join(", ") || "Sin sucursal";
}

function uniqueRoles() {
  return [
    ...new Set(
      state.users
        .map((user) => String(user.role || "").trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, "es"));
}

function uniqueUserId() {
  let counter = state.users.length + 1;
  let id = "";

  do {
    id = `USR-${String(counter).padStart(2, "0")}`;
    counter += 1;
  } while (state.users.some((user) => user.id === id));

  return id;
}

function uniqueStationId() {
  let counter = state.stations.length + 1;
  let id = "";

  do {
    id = `EST-${String(counter).padStart(2, "0")}`;
    counter += 1;
  } while (state.stations.some((station) => station.id === id));

  return id;
}

function uniqueTableId() {
  let counter = state.tables.length + 1;
  let id = "";

  do {
    id = `T${counter}`;
    counter += 1;
  } while (state.tables.some((table) => table.id === id));

  return id;
}

function modalHeader(title, eyebrow) {
  return `
    <div class="modal__header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>

      <button
        class="icon-button"
        type="button"
        data-close-modal
        aria-label="Cerrar"
      >
        ${closeIcon}
      </button>
    </div>`;
}

function modalActions(label) {
  return `
    <div class="modal__actions span-2">
      <button class="button button--secondary" type="button" data-close-modal>
        Cancelar
      </button>
      <button class="button button--primary" type="submit">
        ${escapeHtml(label)}
      </button>
    </div>`;
}
