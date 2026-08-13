// Cafe Fusiones - Barra superior (componente reutilizable).
// Las opciones de cuenta (notificaciones, config, ayuda, salir) se movieron al menu
// lateral; aqui queda solo el titulo, la busqueda, sincronizar y el usuario visible.
import { getSession, demoUser } from "../core/auth.js";
import { showToast } from "./toast.js";

const searchIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>';
const syncIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M3 17v4h4"/><path d="M21 7V3h-4"/></svg>';

export function renderTopbar({ title, eyebrow = "Modulo", showSearch = true, searchPlaceholder = "Buscar producto, mesa o cliente", onSearch } = {}) {
  const session = getSession() || demoUser;
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  topbar.classList.toggle("is-simple", !showSearch);
  topbar.innerHTML = `
    <div>
      <p class="eyebrow" id="section-eyebrow">${eyebrow}</p>
      <h1 id="section-title">${title}</h1>
    </div>
    ${showSearch ? `
    <label class="search-box" aria-label="Buscar en el sistema">
      ${searchIcon}
      <input id="global-search" type="search" placeholder="${searchPlaceholder}">
    </label>` : ""}
    <div class="topbar-actions">
      <button class="icon-button" id="sync-button" type="button" aria-label="Sincronizar datos">${syncIcon}</button>
      <div class="topbar-user">
        <span class="avatar">${session.initials || "CF"}</span>
        <span><strong>${session.name || "Administrador"}</strong><small>${session.role || "Gerencia"}</small></span>
      </div>
    </div>`;

  topbar.querySelector("#sync-button")?.addEventListener("click", () => showToast("Datos sincronizados correctamente."));

  if (showSearch && typeof onSearch === "function") {
    topbar.querySelector("#global-search")?.addEventListener("input", (event) => onSearch(event.target.value));
  }
}
