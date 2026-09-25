// Cafe Fusiones - Acciones de usuario (notificaciones, configuracion, ayuda, salir).
// Reutilizable: se usa desde el menu lateral. Reemplaza los botones inactivos.
import { openModal, closeModal, closeIcon } from "./modal.js";
import { showToast } from "./toast.js";
import { confirmAction } from "./confirm.js";
import { clearSession } from "../core/auth.js";
import { getState, saveState } from "../core/storage.js";
import { escapeHtml, isExpiringSoon } from "../core/utils.js";

export function openNotifications() {
  window.location.href = "notificaciones.html";
}

export function openSettings() {
  const state = getState();
  const s = state.settings || {};
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="st">
      <div class="modal__header"><div><p class="eyebrow">Sistema</p><h2 id="st">Configuracion</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid" data-settings-form style="padding:20px;">
        <label class="span-2">Nombre del negocio<input name="business" value="${escapeHtml(s.business || "")}" required></label>
        <label>RUC<input name="ruc" value="${escapeHtml(s.ruc || "")}"></label>
        <label>IGV (%)<input name="igv" type="number" min="0" step="1" value="${s.igv ?? 18}"></label>
        <label class="span-2">Direccion<input name="address" value="${escapeHtml(s.address || "")}"></label>
        <div class="confirm-actions span-2"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Guardar configuracion</button></div>
      </form>
    </section>`;
  openModal(html).querySelector("[data-settings-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    state.settings = { ...state.settings, business: d.business, ruc: d.ruc, igv: Number(d.igv) || 18, address: d.address };
    saveState(state); closeModal(); showToast("Configuracion guardada.");
  });
}

// La ayuda ya no es un modal: es la pantalla pages/ayuda.html.
export function openHelp() {
  window.location.href = "ayuda.html";
}

export async function logout() {
  const ok = await confirmAction({ title: "Cerrar sesion", message: "Se cerrara la sesion actual del prototipo.", label: "Cerrar sesion" });
  if (ok) { clearSession(); window.location.href = "login.html"; }
}

export function handleUserAction(action) {
  if (action === "notifications") openNotifications();
  else if (action === "settings") openSettings();
  else if (action === "help") openHelp();
  else if (action === "logout") logout();
}
