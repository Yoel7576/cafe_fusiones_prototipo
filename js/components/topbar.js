// Cafe Fusiones - Barra superior (componente reutilizable).
// Las opciones de cuenta (notificaciones, config, ayuda, salir) se movieron al menu
// lateral; aqui queda solo el titulo, la busqueda, sincronizar y el usuario visible.
import { getSession, demoUser } from "../core/auth.js";

const searchIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>';

// `actions` recibe HTML de la propia pantalla (por ejemplo un acceso rapido).
// Se pinta antes del boton de sincronizar, al mismo tamano que el resto.
export function renderTopbar({ title, eyebrow = "Modulo", showSearch = true, searchPlaceholder = "Buscar producto, mesa o cliente", onSearch, actions = "" } = {}) {
  const session = getSession() || demoUser;
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  topbar.classList.toggle("is-simple", !showSearch);
  topbar.innerHTML = `
    <div>
      ${eyebrow ? `<p class="eyebrow" id="section-eyebrow">${eyebrow}</p>` : ""}
      <h1 id="section-title">${title}</h1>
    </div>
    ${showSearch ? `
    <label class="search-box" aria-label="Buscar en el sistema">
      ${searchIcon}
      <input id="global-search" type="search" placeholder="${searchPlaceholder}">
    </label>` : ""}
    <div class="topbar-actions">
      ${actions}
      <div class="topbar-user">
        <span class="avatar">${session.initials || "CF"}</span>
        <span><strong>${session.name || "Administrador"}</strong><small>${session.role || "Gerencia"}</small></span>
      </div>
    </div>`;

  if (showSearch && typeof onSearch === "function") {
    topbar.querySelector("#global-search")?.addEventListener("input", (event) => onSearch(event.target.value));
  }
}
