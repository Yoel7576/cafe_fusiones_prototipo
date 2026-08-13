// Cafe Fusiones - Ventana emergente reutilizable (regla 12).
// Inyecta un backdrop con el contenido dado y gestiona el cierre.
let escHandler = null;

export function openModal(innerHtml) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.dataset.modalRoot = "";
  backdrop.setAttribute("role", "presentation");
  backdrop.innerHTML = innerHtml;
  document.body.appendChild(backdrop);

  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest("[data-close-modal]")) {
      closeModal();
    }
  });
  escHandler = (event) => { if (event.key === "Escape") closeModal(); };
  document.addEventListener("keydown", escHandler);

  const focusable = backdrop.querySelector("input, select, textarea, button");
  if (focusable) focusable.focus();
  return backdrop;
}

export function closeModal() {
  const backdrop = document.querySelector(".modal-backdrop[data-modal-root]");
  if (backdrop) backdrop.remove();
  if (escHandler) {
    document.removeEventListener("keydown", escHandler);
    escHandler = null;
  }
}

export function isModalOpen() {
  return !!document.querySelector(".modal-backdrop[data-modal-root]");
}

// Icono X reutilizable para las cabeceras de modal.
export const closeIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
