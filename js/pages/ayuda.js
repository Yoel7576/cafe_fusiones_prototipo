// Cafe Fusiones - Centro de ayuda (manual de uso del sistema).
// Ruta: js/pages/ayuda.js
//
// Antes era un modal; ahora es su propia pantalla con el menu lateral activo.
// Secciones por ?tab= y buscador en la barra superior, que busca en todas.
// El contenido vive en js/data/ayuda.js.

import { requireAuth } from "../core/auth.js";
import { canAccess, rolePermissions } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { escapeHtml, matchesSearch } from "../core/utils.js";
import { HELP_SECTIONS, HELP_MODULES, HELP_TOPICS, HELP_ROLES } from "../data/ayuda.js";

const session = requireAuth();
const view = document.getElementById("view");
const params = new URLSearchParams(window.location.search);

// Columnas de la matriz de permisos (los modulos que filtra rolePermissions).
const ROLE_MODULES = ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes", "admin"];

const ui = {
  tab: HELP_SECTIONS.some((section) => section.id === params.get("tab")) ? params.get("tab") : "inicio",
  search: "",
  // Tema abierto al llegar con un enlace #tema.
  open: decodeURIComponent(window.location.hash.slice(1))
};

if (session) init();

function init() {
  // Si el enlace apunta a un tema, se abre la seccion donde vive.
  const destino = HELP_TOPICS.find((topic) => topic.id === ui.open);
  if (destino) ui.tab = destino.section;

  renderSidebar("ayuda", session.role);
  renderTopbar({
    title: "Ayuda",
    eyebrow: "Soporte",
    searchPlaceholder: "Buscar en la ayuda",
    onSearch: (q) => { ui.search = q.trim(); render(); }
  });
  render();

  if (destino) {
    document.getElementById(`tema-${destino.id}`)?.scrollIntoView({ block: "start" });
  }
}

function render() {
  view.innerHTML = `
    <div class="view-stack help-view">
      <section class="panel help-hero">
        <div>
          <h2>¿En qué te ayudamos?</h2>
          <p>Guía de uso del sistema de Cafe Fusiones: qué hace cada módulo, cómo se trabaja día a día y qué puede hacer cada rol. Usa el buscador de arriba para encontrar un tema.</p>
        </div>
        <div class="help-hero__role">
          <span>Tu rol</span>
          <strong>${escapeHtml(session.role)}</strong>
        </div>
      </section>

      <nav class="panel help-subtabs" aria-label="Secciones de ayuda">
        ${HELP_SECTIONS.map((section) => `
          <button class="help-subtab ${!ui.search && ui.tab === section.id ? "is-active" : ""}" type="button" data-help-tab="${section.id}">${section.label}</button>
        `).join("")}
      </nav>

      ${ui.search ? renderResults() : renderSection(ui.tab)}
    </div>`;

  wire();
}

function renderSection(sectionId) {
  if (sectionId === "roles") return renderRoles();
  if (sectionId === "modulos") return renderModules();

  const topics = HELP_TOPICS.filter((topic) => topic.section === sectionId);
  const section = HELP_SECTIONS.find((item) => item.id === sectionId);
  return `
    <section class="help-list" aria-label="${escapeHtml(section?.label || "Ayuda")}">
      ${topics.map((topic, index) => topicHtml(topic, { open: topic.id === ui.open || (!ui.open && index === 0) })).join("")}
    </section>`;
}

// Modulos: accesos directos arriba y la explicacion de cada uno debajo.
function renderModules() {
  const topics = HELP_TOPICS.filter((topic) => topic.section === "modulos");
  const accesibles = topics.filter((topic) => moduleAllowed(topic.module));

  return `
    <section class="panel help-shortcuts">
      <h2>Ir a un módulo</h2>
      <div class="help-shortcuts__grid">
        ${accesibles.map((topic) => `
          <a class="help-shortcut" href="${HELP_MODULES[topic.module].href}">
            <strong>${escapeHtml(topic.title)}</strong>
            <span>${escapeHtml(topic.summary)}</span>
          </a>
        `).join("")}
      </div>
    </section>
    <section class="help-list" aria-label="Módulos">
      ${topics.map((topic) => topicHtml(topic, { open: topic.id === ui.open })).join("")}
    </section>`;
}

function renderRoles() {
  const labels = { dashboard: "Inicio", ventas: "Ventas", caja: "Caja", inventario: "Inventario", clientes: "Clientes", reportes: "Reportes", admin: "Administración" };
  return `
    <section class="panel help-roles">
      <div class="panel__header"><h2>Qué puede usar cada rol</h2></div>
      <p class="help-note">El menú lateral de cada persona solo muestra los módulos de su rol. Configuración, Notificaciones y Ayuda están disponibles para todos. Los permisos de un usuario en particular se pueden personalizar en Configuración &gt; Usuarios y permisos.</p>
      <div class="table-wrap">
        <table class="data-table help-roles-table">
          <thead>
            <tr><th>Rol</th>${ROLE_MODULES.map((id) => `<th>${labels[id]}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${Object.keys(rolePermissions).map((role) => `
              <tr class="${role === session.role ? "is-current" : ""}">
                <td>
                  <strong>${escapeHtml(role)}</strong>${role === session.role ? ' <span class="help-badge">Tu rol</span>' : ""}
                  <br><small>${escapeHtml(HELP_ROLES[role] || "")}</small>
                </td>
                ${ROLE_MODULES.map((id) => rolePermissions[role].includes(id)
                  ? '<td class="help-yes" aria-label="Sí">✓</td>'
                  : '<td class="help-no" aria-label="No">—</td>').join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>`;
}

// Busqueda en todas las secciones a la vez.
function renderResults() {
  const results = HELP_TOPICS.filter((topic) =>
    matchesSearch(ui.search, topic.title, topic.summary, ...(topic.steps || []), ...(topic.tips || [])));

  if (!results.length) {
    return `
      <section class="panel help-empty">
        <strong>No encontramos temas para "${escapeHtml(ui.search)}"</strong>
        <p>Prueba con otra palabra, por ejemplo: caja, pedido, receta, stock o mesa.</p>
      </section>`;
  }

  return `
    <p class="help-results">${results.length} resultado${results.length === 1 ? "" : "s"} para "${escapeHtml(ui.search)}"</p>
    <section class="help-list">
      ${results.map((topic) => topicHtml(topic, { open: results.length <= 3, showSection: true })).join("")}
    </section>`;
}

function topicHtml(topic, { open = false, showSection = false } = {}) {
  const section = HELP_SECTIONS.find((item) => item.id === topic.section);
  const link = topic.module && moduleAllowed(topic.module) ? HELP_MODULES[topic.module] : null;

  return `
    <details class="panel help-topic" id="tema-${escapeHtml(topic.id)}" ${open ? "open" : ""}>
      <summary>
        <span class="help-topic__head">
          ${showSection ? `<small>${escapeHtml(section?.label || "")}</small>` : ""}
          <strong>${escapeHtml(topic.title)}</strong>
          <span>${escapeHtml(topic.summary)}</span>
        </span>
        <span class="help-topic__chevron" aria-hidden="true">›</span>
      </summary>
      <div class="help-topic__body">
        ${topic.steps?.length ? `<ol class="help-steps">${topic.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}
        ${topic.tips?.length ? `<ul class="help-tips">${topic.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>` : ""}
        ${link ? `<a class="button button--secondary help-topic__link" href="${link.href}">Ir a ${escapeHtml(link.label)}</a>` : ""}
      </div>
    </details>`;
}

// Configuracion y Notificaciones estan en el menu de todos los roles.
function moduleAllowed(moduleId) {
  if (!moduleId || !HELP_MODULES[moduleId]) return false;
  if (moduleId === "configuracion" || moduleId === "notificaciones") return true;
  return canAccess(session.role, moduleId);
}

function wire() {
  view.querySelectorAll("[data-help-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.tab = button.dataset.helpTab;
      ui.open = "";
      ui.search = "";
      const buscador = document.getElementById("global-search");
      if (buscador) buscador.value = "";

      const url = new URL(window.location.href);
      url.searchParams.set("tab", ui.tab);
      url.hash = "";
      history.replaceState({}, "", url);
      render();
    });
  });
}
