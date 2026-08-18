import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState } from "../core/storage.js";
import { showToast } from "../components/toast.js";
import { icon, escapeHtml } from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
let selectedNotificationId = null;

function normalizeNotification(item) {
  return {
    id: item.id || `notif-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    title: item.title || "Alerta",
    message: item.message || "Sin detalle.",
    details: item.details || item.message || "Sin detalle.",
    category: item.category || "Sistema",
    tone: item.tone || "info",
    read: !!item.read,
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function buildNotifications() {
  const generated = [];

  state.inventory.filter((i) => i.stock <= i.min).forEach((i) => {
    generated.push(normalizeNotification({
      id: `stock-${i.id}`,
      title: "Stock bajo",
      category: "Inventario",
      tone: "danger",
      message: `${i.item}: ${i.stock} ${i.unit} disponibles`,
      details: `El insumo ${i.item} está por debajo del mínimo recomendado (${i.min} ${i.unit}). Revisa el pedido o el ajuste de inventario para evitar faltantes.`,
      createdAt: new Date().toISOString()
    }));
  });

  state.inventory.filter((i) => i.expiry && i.expiry <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).forEach((i) => {
    generated.push(normalizeNotification({
      id: `expiry-${i.id}`,
      title: "Por vencer",
      category: "Inventario",
      tone: "warn",
      message: `${i.item} vence el ${i.expiry}`,
      details: `El producto ${i.item} vence pronto (${i.expiry}). Prioriza su uso o reubica el lote para evitar pérdidas de inventario.`,
      createdAt: new Date().toISOString()
    }));
  });

  (state.reservations || []).forEach((r) => {
    generated.push(normalizeNotification({
      id: `reservation-${r.id || r.name}`,
      title: "Reserva",
      category: "Clientes",
      tone: "info",
      message: `${r.name} ${r.lastname} · ${r.people} personas · ${r.date}`,
      details: `Reserva programada para ${r.date} con ${r.people} personas. Verifica la preparación del salón y la disponibilidad de la mesa.`,
      createdAt: new Date().toISOString()
    }));
  });

  if (state.cashBox?.open) {
    generated.push(normalizeNotification({
      id: "cash-open",
      title: "Caja abierta",
      category: "Caja",
      tone: "ok",
      message: `Caja abierta por ${state.cashBox.user || "usuario"}`,
      details: `La caja quedó abierta por ${state.cashBox.user || "el usuario actual"}. Verifica el cierre del turno y el monto inicial.`,
      createdAt: new Date().toISOString()
    }));
  }

  const merged = [...(state.notifications || []), ...generated].map(normalizeNotification);
  const deduped = new Map();
  merged.forEach((n) => deduped.set(n.id, n));
  state.notifications = [...deduped.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return state.notifications;
}

function ensureNotifications() {
  buildNotifications();
  if (!selectedNotificationId && state.notifications.length) {
    selectedNotificationId = state.notifications[0].id;
  }
  if (selectedNotificationId && !state.notifications.some((n) => n.id === selectedNotificationId)) {
    selectedNotificationId = state.notifications[0]?.id || null;
  }
}

function getSelectedNotification() {
  ensureNotifications();
  return state.notifications.find((n) => n.id === selectedNotificationId) || state.notifications[0] || null;
}

function markAsRead(id) {
  const item = state.notifications.find((n) => n.id === id);
  if (!item) return;
  item.read = true;
  saveState(state);
  render();
}

function markAllAsRead() {
  state.notifications.forEach((n) => { n.read = true; });
  saveState(state);
  render();
  showToast("Todas las notificaciones fueron marcadas como leídas.");
}

function render() {
  ensureNotifications();
  const notifications = state.notifications;
  const selected = getSelectedNotification();

  view.innerHTML = `
    <div class="view-stack notification-screen">
      <section class="panel">
        <div class="panel__header panel__header--wrap">
          <div>
            <p class="eyebrow">Alertas</p>
            <h2>Notificaciones</h2>
          </div>
          <div class="notification-actions">
            <button class="button button--secondary" type="button" data-mark-all-read>Marcar como leídas todas</button>
          </div>
        </div>

        <div class="notification-layout">
          <aside class="notification-sidebar">
            ${notifications.length ? notifications.map((n) => `
              <button
                type="button"
                class="notification-item ${selected?.id === n.id ? "is-selected" : ""} ${n.read ? "is-read" : "is-unread"}"
                data-select-notification="${n.id}"
              >
                <div class="notification-item__top">
                  <span class="tone tone--${n.tone}">${n.category}</span>
                  ${n.read ? '<span class="read-pill">Leída</span>' : '<span class="read-pill unread">Nueva</span>'}
                </div>
                <strong>${escapeHtml(n.title)}</strong>
                <p>${escapeHtml(n.message)}</p>
                <time>${new Date(n.createdAt).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
              </button>
            `).join("") : '<div class="notification-empty">No hay notificaciones.</div>'}
          </aside>

          <article class="notification-detail">
            ${selected ? `
              <div class="notification-detail__header">
                <div>
                  <p class="eyebrow">${escapeHtml(selected.category)}</p>
                  <h3>${escapeHtml(selected.title)}</h3>
                </div>
                <span class="tone tone--${selected.tone}">${selected.read ? "Leída" : "Nueva"}</span>
              </div>
              <p class="notification-detail__message">${escapeHtml(selected.message)}</p>
              <div class="notification-detail__body">
                <p>${escapeHtml(selected.details)}</p>
              </div>
              <div class="notification-detail__actions">
                <button class="button button--primary" type="button" data-mark-read="${selected.id}">${selected.read ? "Marcada como leída" : "Marcar como leída"}</button>
              </div>
            ` : '<div class="notification-empty">Selecciona una notificación para ver el detalle.</div>'}
          </article>
        </div>
      </section>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  view.querySelectorAll("[data-select-notification]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedNotificationId = button.dataset.selectNotification;
      render();
    });
  });

  const markReadButton = view.querySelector("[data-mark-read]");
  markReadButton?.addEventListener("click", () => {
    const id = markReadButton.dataset.markRead;
    markAsRead(id);
  });

  const markAll = view.querySelector("[data-mark-all-read]");
  markAll?.addEventListener("click", () => {
    markAllAsRead();
  });
}

if (session) {
  renderSidebar("dashboard", session.role);
  renderTopbar({ title: "Notificaciones", eyebrow: "Alertas", showSearch: false });
  render();
}
