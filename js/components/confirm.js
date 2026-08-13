// Cafe Fusiones - Dialogo de confirmacion reutilizable.
import { openModal, closeModal } from "./modal.js";
import { escapeHtml } from "../core/utils.js";

export function confirmAction({ title, message, label = "Confirmar" }) {
  return new Promise((resolve) => {
    const html = `
      <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div class="modal__header">
          <div><p class="eyebrow">Confirmacion</p><h2 id="confirm-title">${escapeHtml(title)}</h2></div>
        </div>
        <div class="confirm-body"><p>${escapeHtml(message)}</p></div>
        <div class="confirm-actions" style="padding:0 20px 20px;">
          <button class="button" type="button" data-cancel>Cancelar</button>
          <button class="button button--primary" type="button" data-ok>${escapeHtml(label)}</button>
        </div>
      </section>`;
    const backdrop = openModal(html);
    backdrop.addEventListener("click", (event) => {
      if (event.target.closest("[data-ok]")) { closeModal(); resolve(true); }
      else if (event.target.closest("[data-cancel]") || event.target === backdrop) { closeModal(); resolve(false); }
    });
  });
}
