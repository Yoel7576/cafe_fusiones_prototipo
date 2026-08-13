// Cafe Fusiones - Configuracion V3
// Ruta: js/pages/configuracion.js
//
// Navegacion:
//   general | sucursales | categorias | usuarios | operacion
//
// Criterio UX:
// - La pantalla muestra resumen primero.
// - Los formularios se abren solo al crear/editar.
// - No se eliminan registros con historial: se activan/desactivan.
// - Categorias son dinamicas y se crean exclusivamente aqui.
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
  categoriesByScope,
  CATEGORY_SCOPES,
  nextId,
  addAuditEvent
} from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { confirmAction } from "../components/confirm.js";
import { showToast } from "../components/toast.js";
import { icon, escapeHtml, statusClass } from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(location.search);

const TABS = [
  ["general", "General", "⚙"],
  ["sucursales", "Sucursales", "⌂"],
  ["categorias", "Categorías", "▦"],
  ["usuarios", "Usuarios y permisos", "♙"],
  ["operacion", "Operación", "◫"]
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

const ui = {
  tab: TABS.some(([id]) => id === params.get("tab"))
    ? params.get("tab")
    : "general",
  categoryScope: params.get("scope") || "menu",
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
    eyebrow: "Sistema",
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

  const currentBranch = getActiveBranch(state);

  state.settings.commercialName ||= "Cafe Fusiones";
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
  const activeCategories = state.categories.filter((category) => category.status !== "Inactiva").length;

  return `
    <section class="panel settings-module-head">
      <div>
        <p class="eyebrow">Configuración del sistema</p>
        <h2>Administración central</h2>
        <p>
          Administra los datos generales, sucursales, categorías, usuarios y operación.
        </p>
      </div>

      <div class="settings-context">
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

        <span class="settings-context-stat">
          <strong>${state.branches.filter((item) => item.status === "Activa").length}</strong>
          sucursal(es)
        </span>

        <span class="settings-context-stat">
          <strong>${activeCategories}</strong>
          categorías
        </span>
      </div>
    </section>`;
}

function settingsTabs() {
  return `
    <section class="panel settings-tabs-wrap">
      <nav class="settings-tabs" aria-label="Secciones de configuración">
        ${TABS.map(([id, label, symbol]) => `
          <button
            class="settings-tab ${ui.tab === id ? "is-active" : ""}"
            type="button"
            data-settings-tab="${id}"
          >
            <span>${symbol}</span>
            <strong>${label}</strong>
          </button>
        `).join("")}
      </nav>
    </section>`;
}

function renderCurrentTab() {
  if (ui.tab === "sucursales") return renderBranches();
  if (ui.tab === "categorias") return renderCategories();
  if (ui.tab === "usuarios") return renderUsers();
  if (ui.tab === "operacion") return renderOperation();
  return renderGeneral();
}

/* ==========================================================================
   GENERAL
   ========================================================================== */

function renderGeneral() {
  const branch = getActiveBranch(state);
  const billing = state.settings.billing || {};
  const fiscalComplete = Boolean(
    state.settings.legalName &&
    state.settings.ruc &&
    state.settings.fiscalAddress
  );

  return `
    <div class="settings-tab-view">
      <section class="settings-kpis">
        ${kpi(
          "Sucursal principal",
          escapeHtml(mainBranch()?.shortName || mainBranch()?.name || "Sin definir"),
          "Referencia general de la empresa",
          "neutral"
        )}
        ${kpi(
          "Datos fiscales",
          fiscalComplete ? "Completos" : "Pendientes",
          "Usados posteriormente en comprobantes",
          fiscalComplete ? "ok" : "warn"
        )}
        ${kpi(
          "Usuarios activos",
          state.users.filter((user) => user.status !== "Inactivo").length,
          "Personas con acceso",
          "neutral"
        )}
        ${kpi(
          "Sistema",
          state.settings.kdsEnabled ? "Operativo" : "Revisar",
          "KDS y parámetros generales",
          state.settings.kdsEnabled ? "ok" : "warn"
        )}
      </section>

      <div class="settings-general-grid">
        <section class="panel settings-summary-card">
          <header>
            <div>
              <p class="eyebrow">Empresa</p>
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
              <p class="eyebrow">Comprobantes</p>
              <h2>Facturación y emisión</h2>
            </div>
            <button class="mini-button" type="button" data-edit-billing>Configurar</button>
          </header>

          <div class="settings-feature-status">
            <span class="${billing.enabled ? "is-on" : "is-pending"}">
              ${billing.enabled ? "Series configuradas" : "Sin series configuradas"}
            </span>
            <p>
              Configura la emisión de boletas y facturas.
            </p>
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
              <p class="eyebrow">Ubicación actual</p>
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
              <p class="eyebrow">Organización</p>
              <h2>Categorías</h2>
            </div>
            <button class="mini-button" type="button" data-go-categories>Administrar</button>
          </header>

          <div class="settings-feature-status">
            <strong>${state.categories.length}</strong>
            <p>
              Crea y organiza las categorías que utiliza el negocio.
            </p>
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
      <section class="settings-kpis settings-kpis--3">
        ${kpi("Sucursales", branches.length, "Registradas en el sistema", "neutral")}
        ${kpi("Activas", branches.filter((branch) => branch.status === "Activa").length, "Disponibles para operar", "ok")}
        ${kpi("Principal", mainBranch()?.shortName || mainBranch()?.name || "Sin definir", "Sucursal de referencia", "info")}
      </section>

      <section class="panel settings-toolbar">
        <div>
          <p class="eyebrow">Estructura empresarial</p>
          <h2>Sucursales</h2>
          <p>
            Administra los locales de Cafe Fusiones.
          </p>
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
   CATEGORIAS
   ========================================================================== */

function renderCategories() {
  const scopes = CATEGORY_SCOPES || [];
  const validScope = scopes.some((scope) => scope.id === ui.categoryScope);

  if (!validScope && scopes.length) {
    ui.categoryScope = scopes[0].id;
  }

  const categories = categoriesByScope(state, ui.categoryScope, {
    activeOnly: false
  });

  return `
    <div class="settings-tab-view">
      <section class="panel settings-toolbar settings-toolbar--categories">
        <div>
          <p class="eyebrow">Catálogo central</p>
          <h2>Categorías</h2>
          <p>
            Organiza la carta, la carta pública, los insumos y los gastos.
          </p>
        </div>

        <button class="button button--primary" type="button" data-new-category>
          ${icon("plus")}<span>Nueva categoría</span>
        </button>
      </section>

      <section class="panel settings-category-scope">
        <div class="settings-scope-buttons">
          ${scopes.map((scope) => `
            <button
              class="${ui.categoryScope === scope.id ? "is-active" : ""}"
              type="button"
              data-category-scope="${scope.id}"
            >
              ${escapeHtml(scope.label)}
              <span>${categoriesByScope(state, scope.id, { activeOnly: false }).length}</span>
            </button>
          `).join("")}
        </div>
      </section>

      <section class="panel settings-category-list">
        <div class="panel__header">
          <div>
            <p class="eyebrow">${escapeHtml(scopeLabel(ui.categoryScope))}</p>
            <h2>Categorías configuradas</h2>
          </div>
          <span class="status status--info">${categories.length} registro(s)</span>
        </div>

        ${categories.length
          ? `
            <div class="table-wrap">
              <table class="data-table settings-category-table">
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Categoría</th>
                    <th>Aplica en</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${categories.map((category, index) => categoryRow(category, index, categories.length)).join("")}
                </tbody>
              </table>
            </div>
          `
          : `
            <div class="settings-empty">
              <span>▦</span>
              <strong>No hay categorías creadas</strong>
              <p>
                Crea la primera categoría para ${escapeHtml(scopeLabel(ui.categoryScope).toLowerCase())}.
              </p>
              <button class="button button--primary" type="button" data-new-category>
                Crear primera categoría
              </button>
            </div>
          `
        }
      </section>
    </div>`;
}

function categoryRow(category, index, total) {
  const active = category.status !== "Inactiva";

  return `
    <tr>
      <td>
        <div class="settings-order-actions">
          <button
            class="icon-button"
            type="button"
            data-move-category="${category.id}"
            data-direction="-1"
            ${index === 0 ? "disabled" : ""}
            aria-label="Subir categoría"
          >↑</button>
          <button
            class="icon-button"
            type="button"
            data-move-category="${category.id}"
            data-direction="1"
            ${index === total - 1 ? "disabled" : ""}
            aria-label="Bajar categoría"
          >↓</button>
        </div>
      </td>

      <td>
        <strong>${escapeHtml(category.name)}</strong>
        ${category.code ? `<br><small class="muted">${escapeHtml(category.code)}</small>` : ""}
      </td>

      <td>${escapeHtml(categoryBranchesLabel(category))}</td>

      <td>
        <span class="${statusClass(active ? "Activa" : "Inactiva")}">
          ${active ? "Activa" : "Inactiva"}
        </span>
      </td>

      <td>
        <div class="table-actions">
          <button class="mini-button" type="button" data-edit-category="${category.id}">
            Editar
          </button>
          <button class="mini-button" type="button" data-toggle-category="${category.id}">
            ${active ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>`;
}

/* ==========================================================================
   USUARIOS Y PERMISOS
   ========================================================================== */

function renderUsers() {
  const active = state.users.filter((user) => user.status !== "Inactivo").length;
  const multiBranch = state.users.filter((user) =>
    Array.isArray(user.branchIds) &&
    (user.branchIds.includes("ALL") || user.branchIds.length > 1)
  ).length;

  return `
    <div class="settings-tab-view">
      <section class="settings-kpis settings-kpis--3">
        ${kpi("Usuarios", state.users.length, "Registrados", "neutral")}
        ${kpi("Activos", active, "Con acceso habilitado", "ok")}
        ${kpi("Multi-sucursal", multiBranch, "Acceso a más de una sede", "info")}
      </section>

      <section class="panel settings-toolbar">
        <div>
          <p class="eyebrow">Acceso al sistema</p>
          <h2>Usuarios y permisos</h2>
          <p>
            Administra usuarios, roles, sucursales y accesos.
          </p>
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

function renderOperation() {
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
          <p class="eyebrow">Operación diaria</p>
          <h2>Configuración por sucursal</h2>
          <p>
            Configura mesas, estaciones, impresión y servicios por sucursal.
          </p>
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
          symbol: "▦",
          title: "Mesas",
          value: tables.length,
          detail: `${tables.reduce((sum, table) => sum + Number(table.seats || 0), 0)} asientos configurados`,
          action: "manage-tables",
          actionLabel: "Gestionar mesas"
        })}

        ${operationCard({
          symbol: "◉",
          title: "Estaciones",
          value: activeStations.length,
          detail: stations.length
            ? `${stations.length} registradas en ${branch?.shortName || branch?.name || "la sucursal"}`
            : "Sin estaciones configuradas",
          action: "manage-stations",
          actionLabel: "Gestionar estaciones"
        })}

        ${operationCard({
          symbol: "▤",
          title: "Impresión",
          value: `${assignedPrinters}/${stations.length}`,
          detail: "Estaciones con impresora asignada",
          action: "manage-printing",
          actionLabel: "Configurar impresión"
        })}

        ${operationCard({
          symbol: "⚙",
          title: "Sistema",
          value: state.settings.kdsEnabled ? "KDS activo" : "KDS inactivo",
          detail: state.settings.loyaltyEnabled
            ? "Fidelización habilitada"
            : "Fidelización deshabilitada",
          action: "manage-system",
          actionLabel: "Ajustar parámetros"
        })}
      </section>
    </div>`;
}

function operationCard({ symbol, title, value, detail, action, actionLabel }) {
  return `
    <article class="panel settings-operation-card">
      <header>
        <span>${symbol}</span>
        <div>
          <h3>${escapeHtml(title)}</h3>
          <strong>${escapeHtml(String(value))}</strong>
        </div>
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
  if (ui.tab === "categorias") wireCategories();
  if (ui.tab === "usuarios") wireUsers();
  if (ui.tab === "operacion") wireOperation();
}

function goTab(tab) {
  if (!TABS.some(([id]) => id === tab)) return;

  ui.tab = tab;

  const url = new URL(location.href);
  url.searchParams.set("tab", tab);

  if (tab === "categorias") {
    url.searchParams.set("scope", ui.categoryScope);
  } else {
    url.searchParams.delete("scope");
  }

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
  view.querySelector("[data-go-categories]")?.addEventListener("click", () => goTab("categorias"));
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
   CATEGORIAS - EVENTOS Y MODALES
   ========================================================================== */

function wireCategories() {
  view.querySelectorAll("[data-category-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.categoryScope = button.dataset.categoryScope;

      const url = new URL(location.href);
      url.searchParams.set("tab", "categorias");
      url.searchParams.set("scope", ui.categoryScope);
      history.replaceState({}, "", url);

      render();
    });
  });

  view.querySelectorAll("[data-new-category]").forEach((button) => {
    button.addEventListener("click", () => openCategoryModal());
  });

  view.querySelectorAll("[data-edit-category]").forEach((button) => {
    button.addEventListener("click", () => openCategoryModal(button.dataset.editCategory));
  });

  view.querySelectorAll("[data-toggle-category]").forEach((button) => {
    button.addEventListener("click", () => toggleCategory(button.dataset.toggleCategory));
  });

  view.querySelectorAll("[data-move-category]").forEach((button) => {
    button.addEventListener("click", () => {
      moveCategory(
        button.dataset.moveCategory,
        Number(button.dataset.direction || 0)
      );
    });
  });
}

function openCategoryModal(categoryId = null) {
  const category = categoryId
    ? state.categories.find((item) => item.id === categoryId)
    : null;

  const scope = category?.scope || ui.categoryScope;
  const branchIds = Array.isArray(category?.branchIds) && category.branchIds.length
    ? category.branchIds
    : ["ALL"];
  const appliesAll = branchIds.includes("ALL");

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader(category ? "Editar categoría" : "Nueva categoría", "Categorías")}

      <form class="form-grid settings-modal-body" data-category-form>
        <label>
          Tipo de categoría
          <select name="scope">
            ${CATEGORY_SCOPES.map((item) => `
              <option value="${item.id}" ${scope === item.id ? "selected" : ""}>
                ${escapeHtml(item.label)}
              </option>
            `).join("")}
          </select>
        </label>

        <label>
          Nombre *
          <input
            name="name"
            value="${escapeHtml(category?.name || "")}"
            placeholder="Ej. Cafés"
            required
          >
        </label>

        <label>
          Código <span class="optional">(opcional)</span>
          <input
            name="code"
            value="${escapeHtml(category?.code || "")}"
            placeholder="Ej. CAF"
          >
        </label>

        <label>
          Orden
          <input
            name="order"
            type="number"
            min="0"
            step="1"
            value="${Number(category?.order ?? nextCategoryOrder(scope))}"
          >
        </label>

        <label class="settings-check-row span-2">
          <input
            name="allBranches"
            type="checkbox"
            value="1"
            ${appliesAll ? "checked" : ""}
            data-all-category-branches
          >
          <span>
            <strong>Disponible en todas las sucursales</strong>
            <small>Desmarca esta opción únicamente si la categoría pertenece a sedes específicas.</small>
          </span>
        </label>

        <div
          class="settings-branch-checks span-2"
          data-category-branches
          ${appliesAll ? "hidden" : ""}
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
          <strong>Categorías</strong>
          <small>
            Define solo las categorías que utiliza Cafe Fusiones.
          </small>
        </div>

        ${modalActions(category ? "Guardar cambios" : "Crear categoría")}
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-category-form]");
  const allBranches = modal.querySelector("[data-all-category-branches]");
  const branchBox = modal.querySelector("[data-category-branches]");

  allBranches?.addEventListener("change", () => {
    if (branchBox) branchBox.hidden = allBranches.checked;
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const nextScope = String(data.get("scope") || "").trim();
    const name = String(data.get("name") || "").trim();

    if (!name) {
      showToast("Ingresa el nombre de la categoría.");
      return;
    }

    const duplicate = state.categories.find(
      (item) =>
        item.id !== category?.id &&
        item.scope === nextScope &&
        normalizeText(item.name) === normalizeText(name)
    );

    if (duplicate) {
      showToast("Ya existe una categoría con ese nombre en este tipo.");
      return;
    }

    let selectedBranches = ["ALL"];

    if (data.get("allBranches") !== "1") {
      selectedBranches = data.getAll("branchIds").filter(Boolean);

      if (!selectedBranches.length) {
        showToast("Selecciona al menos una sucursal o marca 'todas'.");
        return;
      }
    }

    const payload = {
      scope: nextScope,
      name,
      code: String(data.get("code") || "").trim().toUpperCase(),
      order: Number(data.get("order") || 0),
      branchIds: selectedBranches,
      updatedAt: new Date().toISOString()
    };

    if (category) {
      Object.assign(category, payload);
    } else {
      state.categories.push({
        id: nextId(state, "category", "CAT", 4),
        ...payload,
        status: "Activa",
        createdAt: new Date().toISOString()
      });
    }

    ui.categoryScope = nextScope;

    addAuditEvent(state, {
      user: session.name,
      action: category ? "Categoría actualizada" : "Categoría creada",
      module: "Configuración",
      detail: `${scopeLabel(nextScope)} · ${name}`
    });

    saveState(state);
    closeModal();
    showToast(category ? "Categoría actualizada." : "Categoría creada.");
    render();
  });
}

async function toggleCategory(categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  if (!category) return;

  const active = category.status !== "Inactiva";

  if (active) {
    const ok = await confirmAction({
      title: "Desactivar categoría",
      message: "Los registros históricos conservarán su categoría, pero ya no estará disponible para nuevas asignaciones.",
      label: "Desactivar"
    });

    if (!ok) return;
  }

  category.status = active ? "Inactiva" : "Activa";
  category.updatedAt = new Date().toISOString();

  addAuditEvent(state, {
    user: session.name,
    action: active ? "Categoría desactivada" : "Categoría activada",
    module: "Configuración",
    detail: category.name
  });

  saveState(state);
  showToast(active ? "Categoría desactivada." : "Categoría activada.");
  render();
}

function moveCategory(categoryId, direction) {
  if (!direction) return;

  const list = categoriesByScope(state, ui.categoryScope, { activeOnly: false });
  const index = list.findIndex((category) => category.id === categoryId);
  const targetIndex = index + direction;

  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return;

  const current = list[index];
  const target = list[targetIndex];

  const currentOrder = Number(current.order || index * 10);
  const targetOrder = Number(target.order || targetIndex * 10);

  current.order = targetOrder;
  target.order = currentOrder;

  if (current.order === target.order) {
    list.forEach((category, position) => {
      category.order = (position + 1) * 10;
    });

    const refreshedIndex = list.findIndex((category) => category.id === categoryId);
    const swapIndex = refreshedIndex + direction;

    if (swapIndex >= 0 && swapIndex < list.length) {
      const a = list[refreshedIndex];
      const b = list[swapIndex];
      const temp = a.order;
      a.order = b.order;
      b.order = temp;
    }
  }

  saveState(state);
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

function wireOperation() {
  view.querySelector("[data-operation-branch]")?.addEventListener("change", (event) => {
    ui.operationBranchId = event.target.value;
    render();
  });

  view.querySelectorAll("[data-operation-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.operationAction;

      if (action === "manage-tables") openTablesModal();
      if (action === "manage-stations") openStationsModal();
      if (action === "manage-printing") openPrintingModal();
      if (action === "manage-system") openSystemModal();
    });
  });
}

/* ==========================================================================
   OPERACION - MESAS
   ========================================================================== */

function openTablesModal() {
  const branchId = ui.operationBranchId;
  const branch = branchById(state, branchId);
  const tables = state.tables.filter((table) => table.branchId === branchId);

  const html = `
    <section class="modal settings-list-modal" role="dialog" aria-modal="true">
      ${modalHeader(`Mesas · ${branch?.shortName || branch?.name || "Sucursal"}`, "Operación")}

      <div class="settings-list-modal-body">
        <div class="settings-inline-head">
          <p>
            Configura nombre, zona y capacidad. La ubicación visual del plano
            se conserva cuando editas una mesa existente.
          </p>
          <button class="button button--primary" type="button" data-new-table>
            ${icon("plus")}<span>Nueva mesa</span>
          </button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Zona</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${tables.map((table) => `
                <tr>
                  <td><strong>${escapeHtml(table.name || table.id)}</strong></td>
                  <td>${escapeHtml(table.area || "Sin zona")}</td>
                  <td>${Number(table.seats || 0)} personas</td>
                  <td><span class="${statusClass(table.status)}">${escapeHtml(table.status || "Libre")}</span></td>
                  <td>
                    <button class="mini-button" type="button" data-edit-table="${table.id}">
                      Editar
                    </button>
                  </td>
                </tr>
              `).join("") || `
                <tr><td colspan="5" class="text-center muted">No hay mesas configuradas.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-new-table]")?.addEventListener("click", () => {
    openTableForm();
  });

  modal.querySelectorAll("[data-edit-table]").forEach((button) => {
    button.addEventListener("click", () => {
      openTableForm(button.dataset.editTable);
    });
  });
}

function openTableForm(tableId = null) {
  const table = tableId
    ? state.tables.find((item) => item.id === tableId)
    : null;

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
            ${["Libre", "Fuera de servicio"].map((status) => `
              <option ${table?.status === status ? "selected" : ""}>${status}</option>
            `).join("")}
          </select>
        </label>

        <div class="settings-form-note span-2">
          <strong>Plano de mesas</strong>
          <small>
            Al editar una mesa se conserva su ubicación actual en el plano.
          </small>
        </div>

        ${modalActions(table ? "Guardar cambios" : "Crear mesa")}
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-table-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(event.currentTarget));

    const payload = {
      name: String(data.name || "").trim(),
      area: String(data.area || "").trim(),
      seats: Number(data.seats || 0),
      status: data.status,
      branchId: ui.operationBranchId
    };

    if (table) {
      Object.assign(table, payload);
    } else {
      state.tables.push({
        id: uniqueTableId(),
        ...payload,
        customerId: null,
        openedAt: null,
        items: [],
        map: null
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
   OPERACION - ESTACIONES
   ========================================================================== */

function openStationsModal() {
  const branchId = ui.operationBranchId;
  const branch = branchById(state, branchId);
  const stations = state.stations.filter((station) => station.branchId === branchId);

  const html = `
    <section class="modal settings-list-modal" role="dialog" aria-modal="true">
      ${modalHeader(`Estaciones · ${branch?.shortName || branch?.name || "Sucursal"}`, "Operación")}

      <div class="settings-list-modal-body">
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
        </div>
      </div>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-new-station]")?.addEventListener("click", () => openStationForm());

  modal.querySelectorAll("[data-edit-station]").forEach((button) => {
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
   OPERACION - IMPRESION
   ========================================================================== */

function openPrintingModal() {
  const branchId = ui.operationBranchId;
  const stations = state.stations.filter((station) => station.branchId === branchId);
  const printing = state.settings.printing || { stationPrinters: {} };

  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader("Impresión", "Operación")}

      <form class="settings-modal-body" data-printing-form>
        <div class="settings-check-stack">
          <label class="settings-check-row">
            <input
              type="checkbox"
              name="autoKitchen"
              value="1"
              ${printing.autoKitchen ? "checked" : ""}
            >
            <span>
              <strong>Imprimir comandas automáticamente</strong>
              <small>Imprime la comanda al enviar el pedido.</small>
            </span>
          </label>

          <label class="settings-check-row">
            <input
              type="checkbox"
              name="autoReceipt"
              value="1"
              ${printing.autoReceipt ? "checked" : ""}
            >
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

        <div class="settings-form-note">
          <strong>Impresoras</strong>
          <small>
            Asigna la impresora utilizada en cada estación.
          </small>
        </div>

        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar impresión</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-printing-form]")?.addEventListener("submit", (event) => {
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
    closeModal();
    showToast("Configuración de impresión guardada.");
    render();
  });
}

/* ==========================================================================
   OPERACION - SISTEMA
   ========================================================================== */

function openSystemModal() {
  const html = `
    <section class="modal settings-form-modal" role="dialog" aria-modal="true">
      ${modalHeader("Parámetros del sistema", "Operación")}

      <form class="settings-modal-body" data-system-form>
        <div class="settings-check-stack">
          <label class="settings-check-row">
            <input
              type="checkbox"
              name="kdsEnabled"
              value="1"
              ${state.settings.kdsEnabled ? "checked" : ""}
            >
            <span>
              <strong>KDS habilitado</strong>
              <small>Permite enviar pedidos a las estaciones de producción.</small>
            </span>
          </label>

          <label class="settings-check-row">
            <input
              type="checkbox"
              name="loyaltyEnabled"
              value="1"
              ${state.settings.loyaltyEnabled ? "checked" : ""}
            >
            <span>
              <strong>Fidelización habilitada</strong>
              <small>Permite afiliación, puntos y recompensas.</small>
            </span>
          </label>
        </div>

        <div class="settings-form-note">
          <strong>Aplicación</strong>
          <small>
            Estos ajustes se aplican a todas las sucursales.
          </small>
        </div>

        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar parámetros</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-system-form]")?.addEventListener("submit", (event) => {
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
    closeModal();
    showToast("Parámetros actualizados.");
    render();
  });
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function mainBranch() {
  return (
    state.branches.find((branch) => branch.isMain) ||
    state.branches[0] ||
    null
  );
}

function scopeLabel(scopeId) {
  return (
    CATEGORY_SCOPES.find((scope) => scope.id === scopeId)?.label ||
    "Categorías"
  );
}

function categoryBranchesLabel(category) {
  const ids = Array.isArray(category.branchIds) ? category.branchIds : ["ALL"];

  if (ids.includes("ALL")) return "Todas las sucursales";

  const names = ids
    .map((id) => branchById(state, id)?.shortName || branchById(state, id)?.name)
    .filter(Boolean);

  return names.join(", ") || "Sin sucursal";
}

function userBranchesLabel(user) {
  const ids = Array.isArray(user.branchIds) ? user.branchIds : [];

  if (ids.includes("ALL")) return "Todas las sucursales";

  const names = ids
    .map((id) => branchById(state, id)?.shortName || branchById(state, id)?.name)
    .filter(Boolean);

  return names.join(", ") || "Sin sucursal";
}

function nextCategoryOrder(scope) {
  const list = categoriesByScope(state, scope, { activeOnly: false });

  if (!list.length) return 10;

  return Math.max(...list.map((category) => Number(category.order || 0))) + 10;
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

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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

function kpi(label, value, detail, tone = "neutral") {
  return `
    <article class="panel settings-kpi settings-kpi--${tone}">
      <span>${escapeHtml(String(label))}</span>
      <strong>${value}</strong>
      <small>${escapeHtml(String(detail))}</small>
    </article>`;
}
