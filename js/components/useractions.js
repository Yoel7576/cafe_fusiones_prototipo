// Cafe Fusiones - Acciones de usuario (notificaciones, configuracion, ayuda, salir).
// Reutilizable: se usa desde el menu lateral. Reemplaza los botones inactivos.
import { openModal, closeModal, closeIcon } from "./modal.js";
import { showToast } from "./toast.js";
import { confirmAction } from "./confirm.js";
import { clearSession } from "../core/auth.js";
import { getState, saveState } from "../core/storage.js";
import { escapeHtml, isExpiringSoon } from "../core/utils.js";

export function openNotifications() {
  const state = getState();
  const items = [];
  state.inventory.filter((i) => i.stock <= i.min).forEach((i) => items.push({ tone: "danger", text: `Stock bajo: ${i.item} (${i.stock} ${i.unit})` }));
  state.inventory.filter((i) => isExpiringSoon(i.expiry)).forEach((i) => items.push({ tone: "warn", text: `Por vencer: ${i.item} (vence ${i.expiry})` }));
  (state.reservations || []).forEach((r) => items.push({ tone: "info", text: `Reserva: ${r.name} ${r.lastname} · ${r.people} personas · ${r.date}` }));
  items.push({ tone: state.cashBox.open ? "ok" : "info", text: state.cashBox.open ? `Caja abierta por ${state.cashBox.user}` : "Caja cerrada" });

  const list = items.map((n) => `<li class="notif-item notif--${n.tone}">${escapeHtml(n.text)}</li>`).join("");
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="nt">
      <div class="modal__header"><div><p class="eyebrow">Alertas</p><h2 id="nt">Notificaciones</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div style="padding:16px 20px 20px;"><ul class="notif-list">${list || '<li class="muted">Sin notificaciones.</li>'}</ul></div>
    </section>`;
  openModal(html);
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

export function openHelp() {
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="ht">
      <div class="modal__header"><div><p class="eyebrow">Soporte</p><h2 id="ht">Ayuda</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div class="help-body" style="padding:16px 20px 20px;">
        <p><strong>Acceso demo:</strong> usuario <code>CFUSIONES</code>, clave <code>prototipo</code>.</p>
        <ul>
          <li><strong>Ventas:</strong> gestiona mesas, toma pedidos y cobra (precuenta, efectivo o POS).</li>
          <li><strong>Caja:</strong> abre/cierra turno, registra ingresos y egresos, imprime reportes.</li>
          <li><strong>Inventario:</strong> registra insumos, mermas y edita el stock.</li>
          <li><strong>Clientes:</strong> base de clientes y reservas.</li>
          <li><strong>Reportes:</strong> ventas, mozos, platos, stock y exportacion.</li>
          <li><strong>Administracion:</strong> platos, recetas, categorias, trazabilidad y usuarios.</li>
        </ul>
        <p class="muted">Para anular un producto de una mesa se pide la clave del cajero (<code>prototipo</code>).</p>
      </div>
    </section>`;
  openModal(html);
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
