// Cafe Fusiones - Toma de pedido V4
// Pantalla dedicada para mozos / tablet.
// Ruta esperada: js/pages/ventas-pedido.js
//
// Flujo:
// Mesa -> cliente -> carta -> personalizacion -> borrador -> produccion KDS
// -> entrega -> solicitar cuenta -> Caja.
//
// IMPORTANTE:
// El mozo NO registra el pago final desde esta pantalla.
// "Solicitar cuenta" genera una cola pendiente para Caja.

import { requireAuth } from "../core/auth.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState, nextId, addAuditEvent } from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import {
  icon,
  money,
  escapeHtml,
  matchesSearch,
  statusClass,
  emptyState,
  tableSubtotal,
  tableTotal,
  IGV_RATE
} from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");

const params = new URLSearchParams(window.location.search);

const FAVORITES = [
  "caf-cappuccino",
  "caf-latte",
  "caf-americano",
  "caf-coldbrew",
  "des-sinchi",
  "des-regional",
  "san-acevichado",
  "pos-brownie"
];

const ui = {
  tableId: null,
  channel: "Local",
  category: "Favoritos",
  search: "",
  customerId: "",
  people: 2,
  cart: [],
  loadingDraft: false
};

if (session) init();

/* ==========================================================================
   INICIO
   ========================================================================== */

function init() {
  normalizeState();
  resolveInitialContext();

  renderSidebar("ventas", session.role);
  renderTopbar({
    title: "Tomar pedido",
    eyebrow: "Ventas · Vista mozo",
    searchPlaceholder: "Buscar cafe, desayuno, sandwich...",
    onSearch: (query) => {
      ui.search = query || "";
      render();
    }
  });

  render();
}

function normalizeState() {
  state.tables ||= [];
  state.menuItems ||= [];
  state.menuCategories ||= ["Todos"];
  state.customers ||= [];
  state.kitchenOrders ||= [];
  state.orderDrafts ||= [];
  state.cashQueue ||= [];
  state.auditEvents ||= [];

  state.tables.forEach((table) => {
    table.items ||= [];
    table.customerId ||= null;
    table.people ||= table.seats > 0 ? Math.min(table.seats || 2, 2) : null;
  });

  state.kitchenOrders.forEach((order) => {
    order.items ||= [];
    order.items.forEach((item) => {
      item.status = normalizeProductionStatus(item.status || order.status);
      item.modifiers ||= [];
      item.note ||= "";
    });
  });

  saveState(state);
}

function resolveInitialContext() {
  const requestedId =
    params.get("mesa") ||
    params.get("table") ||
    params.get("tableId");

  const requestedChannel = params.get("canal") || params.get("channel");

  if (String(requestedChannel || "").toLowerCase() === "delivery") {
    ui.channel = "Delivery";
    ui.tableId = state.tables.find((table) => table.seats === 0)?.id || null;
  } else {
    ui.channel = "Local";
    const requested = state.tables.find((table) => table.id === requestedId && table.seats > 0);
    const fallback =
      state.tables.find((table) => table.seats > 0 && table.status === "Ocupada") ||
      state.tables.find((table) => table.seats > 0 && table.status === "Libre") ||
      state.tables.find((table) => table.seats > 0);

    ui.tableId = requested?.id || fallback?.id || null;
  }

  const table = currentTable();
  ui.customerId = table?.customerId || "";
  ui.people = table?.people || Math.min(table?.seats || 2, 2);

  loadDraftForCurrentContext();
}

function currentTable() {
  return state.tables.find((table) => table.id === ui.tableId) || null;
}

function customerById(id) {
  return state.customers.find((customer) => customer.id === id) || null;
}

/* ==========================================================================
   RENDER PRINCIPAL
   ========================================================================== */

function render() {
  const table = currentTable();

  if (!table) {
    view.innerHTML = `
      <section class="panel">
        ${emptyState("No encontramos una mesa disponible para iniciar el pedido.")}
        <a class="button button--secondary" href="ventas.html">Volver a Ventas</a>
      </section>`;
    return;
  }

  view.innerHTML = `
    <div class="order-entry-v4">
      ${contextHeader(table)}

      <div class="order-pos-layout">
        ${categoryRail()}
        ${productCatalog()}
        ${ticketPanel(table)}
      </div>
    </div>`;

  wire();
}

function contextHeader(table) {
  const customer = customerById(ui.customerId);
  const activeOrder = latestOrderForTable(table.id);
  const orderState = table.accountRequested
    ? "Por cobrar"
    : activeOrder?.status || (table.items.length ? "En atencion" : "Nueva atencion");

  return `
    <section class="panel order-context-bar">
      <div class="order-context-bar__left">
        <a class="mini-button order-back-link" href="ventas.html" aria-label="Volver al salon">
          ← Salon
        </a>

        <div class="order-context-title">
          <p class="eyebrow">${escapeHtml(ui.channel)}</p>
          <div>
            <h2>${ui.channel === "Delivery" ? "Pedido Delivery" : escapeHtml(table.name)}</h2>
            <span class="${statusClass(orderState)}">${escapeHtml(orderState)}</span>
          </div>
          <small>
            ${ui.channel === "Local"
              ? `${escapeHtml(table.area || "Salon")} · ${Number(ui.people || 1)} persona${Number(ui.people || 1) === 1 ? "" : "s"}`
              : "Atencion sin mesa"}
          </small>
        </div>
      </div>

      <div class="order-context-bar__right">
        ${customer ? `
          <div class="order-customer-chip">
            <span>${escapeHtml(customer.level || "Cliente")}</span>
            <strong>${escapeHtml(customer.name)}</strong>
            <small>${Number(customer.points || 0)} pts · ${Number(customer.visits || 0)} visitas</small>
          </div>
        ` : `
          <div class="order-customer-chip is-empty">
            <span>Cliente</span>
            <strong>Consumidor final</strong>
            <small>Puede asociarse durante el pedido</small>
          </div>
        `}

        ${ui.cart.length ? `
          <div class="order-unsent-chip">
            <span>Sin enviar</span>
            <strong>${cartQuantity()} producto${cartQuantity() === 1 ? "" : "s"}</strong>
          </div>
        ` : ""}
      </div>
    </section>`;
}

function categoryRail() {
  const source = Array.isArray(state.menuCategories) ? state.menuCategories : [];
  const categories = [
    "Favoritos",
    ...source.filter((category) => category !== "Todos")
  ];

  return `
    <aside class="panel order-category-rail" aria-label="Categorias de la carta">
      <div class="order-category-rail__head">
        <p class="eyebrow">Carta</p>
        <h3>Categorias</h3>
      </div>

      <nav class="order-category-list">
        ${categories.map((category) => `
          <button
            class="order-category-button ${ui.category === category ? "is-active" : ""}"
            type="button"
            data-category="${escapeHtml(category)}"
          >
            <span>${categoryEmoji(category)}</span>
            <strong>${escapeHtml(category)}</strong>
            <small>${countCategoryProducts(category)}</small>
          </button>
        `).join("")}
      </nav>
    </aside>`;
}

function productCatalog() {
  const products = filteredProducts();

  return `
    <section class="panel order-products-panel">
      <div class="order-products-head">
        <div>
          <p class="eyebrow">${escapeHtml(ui.category)}</p>
          <h2>Seleccionar productos</h2>
          <p class="muted">
            ${products.length} producto${products.length === 1 ? "" : "s"} ·
            Barra y Cocina se asignan automaticamente.
          </p>
        </div>

        <label class="order-local-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value="${escapeHtml(ui.search)}"
            placeholder="Buscar en la carta"
            data-local-search
          >
        </label>
      </div>

      <div class="order-product-grid">
        ${products.map(productCard).join("") || emptyState("No encontramos productos con este filtro.")}
      </div>
    </section>`;
}

function ticketPanel(table) {
  const customer = customerById(ui.customerId);
  const existingSubtotal = tableSubtotal(table);
  const newSubtotal = cartSubtotal();
  const estimatedSubtotal = existingSubtotal + newSubtotal;
  const estimatedIgv = estimatedSubtotal * IGV_RATE;
  const estimatedTotal = estimatedSubtotal + estimatedIgv;
  const hasExisting = table.items.length > 0;
  const accountDisabled = !hasExisting || ui.cart.length > 0;

  return `
    <aside class="panel order-ticket-panel">
      <div class="order-ticket-head">
        <div>
          <p class="eyebrow">Pedido</p>
          <h2>${ui.channel === "Delivery" ? "Delivery" : escapeHtml(table.name)}</h2>
        </div>
        ${ui.cart.length
          ? `<button class="mini-button" type="button" data-clear-cart>Limpiar nuevos</button>`
          : ""}
      </div>

      ${ui.channel === "Local" ? tableSelector(table) : ""}

      <div class="order-service-fields">
        ${ui.channel === "Local" ? `
          <label>
            <span>Personas</span>
            <input
              type="number"
              min="1"
              max="${Math.max(Number(table.seats || 20), 20)}"
              value="${Number(ui.people || 1)}"
              data-people
            >
          </label>
        ` : ""}

        <label class="order-customer-field">
          <span>Cliente</span>
          <select data-customer>
            <option value="">Consumidor final</option>
            ${state.customers.map((item) => `
              <option value="${item.id}" ${ui.customerId === item.id ? "selected" : ""}>
                ${escapeHtml(item.name)} · ${escapeHtml(item.level || "Cliente")} · ${Number(item.points || 0)} pts
              </option>
            `).join("")}
          </select>
        </label>

        <button class="mini-button order-new-customer" type="button" data-new-customer>
          + Registrar cliente
        </button>
      </div>

      ${customer ? loyaltyMiniCard(customer) : ""}

      <div class="order-ticket-scroll">
        ${hasExisting ? existingOrderLines(table) : ""}

        <div class="order-ticket-section">
          <div class="order-ticket-section__title">
            <strong>Por enviar</strong>
            <span>${cartQuantity()} item${cartQuantity() === 1 ? "" : "s"}</span>
          </div>

          <div class="order-new-lines">
            ${ui.cart.map(cartLine).join("") || `
              <div class="order-empty-cart">
                <span>☕</span>
                <strong>Agrega productos</strong>
                <p>Selecciona un producto de la carta para iniciar.</p>
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="order-ticket-summary">
        ${hasExisting ? `
          <div>
            <span>Consumo enviado</span>
            <strong>${money(tableTotal(table))}</strong>
          </div>
        ` : ""}
        <div>
          <span>Nuevos productos</span>
          <strong>${money(newSubtotal + newSubtotal * IGV_RATE)}</strong>
        </div>
        <div class="order-ticket-summary__total">
          <span>Total estimado</span>
          <strong>${money(estimatedTotal)}</strong>
        </div>
      </div>

      <div class="order-ticket-actions">
        <button
          class="button button--secondary button--block"
          type="button"
          data-save-draft
          ${ui.cart.length ? "" : "disabled"}
        >
          Guardar borrador
        </button>

        <button
          class="button button--primary button--block"
          type="button"
          data-send-production
          ${ui.cart.length ? "" : "disabled"}
        >
          ${icon("chef")}
          <span>Enviar a produccion</span>
        </button>

        <button
          class="button button--secondary button--block order-request-account"
          type="button"
          data-request-account
          ${accountDisabled ? "disabled" : ""}
        >
          ${icon("cash")}
          <span>${table.accountRequested ? "Cuenta enviada a Caja" : "Solicitar cuenta"}</span>
        </button>

        ${ui.cart.length ? `
          <p class="order-action-help">
            Envia primero los productos pendientes antes de solicitar la cuenta.
          </p>
        ` : !hasExisting ? `
          <p class="order-action-help">
            La cuenta se habilita cuando exista consumo enviado.
          </p>
        ` : `
          <p class="order-action-help">
            Caja realizara el pago, comprobante y cierre final.
          </p>
        `}
      </div>
    </aside>`;
}

function tableSelector(table) {
  const tables = state.tables.filter((item) => item.seats > 0);
  return `
    <label class="order-table-selector">
      <span>Mesa</span>
      <select data-table-select>
        ${tables.map((item) => `
          <option value="${item.id}" ${item.id === table.id ? "selected" : ""}>
            ${escapeHtml(item.name)} · ${escapeHtml(item.status)}
          </option>
        `).join("")}
      </select>
    </label>`;
}

function loyaltyMiniCard(customer) {
  const rewards = (state.rewards || [])
    .filter((reward) => reward.status === "Activo" && Number(customer.points || 0) >= Number(reward.points || 0))
    .length;

  return `
    <div class="order-loyalty-mini">
      <div>
        <span>${escapeHtml(customer.level || "Cliente frecuente")}</span>
        <strong>${Number(customer.points || 0)} puntos</strong>
      </div>
      <small>
        ${rewards
          ? `${rewards} recompensa${rewards === 1 ? "" : "s"} disponible${rewards === 1 ? "" : "s"}`
          : "Acumulara puntos al completar la venta"}
      </small>
    </div>`;
}

/* ==========================================================================
   PRODUCTOS
   ========================================================================== */

function filteredProducts() {
  return state.menuItems
    .filter((item) => {
      const categoryMatches =
        ui.category === "Favoritos"
          ? FAVORITES.includes(item.id)
          : item.category === ui.category;

      return categoryMatches &&
        matchesSearch(ui.search, item.name, item.category, item.description, item.station);
    })
    .sort((a, b) => {
      const aFav = FAVORITES.indexOf(a.id);
      const bFav = FAVORITES.indexOf(b.id);
      if (ui.category === "Favoritos") return aFav - bFav;
      return String(a.name).localeCompare(String(b.name), "es");
    });
}

function countCategoryProducts(category) {
  if (category === "Favoritos") {
    return state.menuItems.filter((item) => FAVORITES.includes(item.id)).length;
  }
  return state.menuItems.filter((item) => item.category === category).length;
}

function productCard(product) {
  const soldOut = Number(product.stock || 0) <= 0;
  const configurable = hasProductConfiguration(product);
  const tags = dietaryTags(product);

  return `
    <button
      class="order-product-card ${soldOut ? "is-sold-out" : ""}"
      type="button"
      data-product="${product.id}"
      ${soldOut ? "disabled" : ""}
    >
      <div class="order-product-card__visual">
        <span class="order-product-emoji">${productEmoji(product.category)}</span>
        <span class="order-station-badge">${escapeHtml(product.station || "Produccion")}</span>
      </div>

      <div class="order-product-card__body">
        <div class="order-product-card__name">
          <strong>${escapeHtml(product.name)}</strong>
          <b>${money(product.price)}</b>
        </div>

        <p>${escapeHtml(product.description || "")}</p>

        <div class="order-product-card__meta">
          <span>${Number(product.estimatedTime || 0)} min</span>
          ${configurable ? `<span>Personalizable</span>` : ""}
          ${tags}
        </div>
      </div>
    </button>`;
}

function dietaryTags(product) {
  const tags = Array.isArray(product.dietary) ? product.dietary : [];
  const result = [];

  if (tags.includes("vegano")) result.push(`<span class="diet-tag diet-tag--vegan">Vegano</span>`);
  if (tags.includes("vegetariano")) result.push(`<span class="diet-tag">Vegetariano</span>`);
  if (tags.includes("adaptable_vegano")) result.push(`<span class="diet-tag diet-tag--adaptable">Opcion vegana</span>`);

  return result.join("");
}

function categoryEmoji(category) {
  const value = String(category || "").toLowerCase();
  if (value === "favoritos") return "★";
  if (value.includes("cafe") || value.includes("metodo")) return "☕";
  if (value.includes("chocolate")) return "🍫";
  if (value.includes("desay")) return "🍳";
  if (value.includes("sand")) return "🥪";
  if (value.includes("sopa") || value.includes("crema")) return "🥣";
  if (value.includes("ensalada")) return "🥗";
  if (value.includes("pasta")) return "🍝";
  if (value.includes("postre")) return "🍰";
  if (value.includes("infusion") || value.includes("te")) return "🫖";
  if (value.includes("jugo") || value.includes("batido")) return "🥤";
  if (value.includes("coct")) return "🍹";
  return "🍽️";
}

function productEmoji(category) {
  return categoryEmoji(category);
}

function hasProductConfiguration(product) {
  return Boolean(
    (Array.isArray(product.modifiers) && product.modifiers.length) ||
    (Array.isArray(product.dietary) && product.dietary.includes("adaptable_vegano"))
  );
}

/* ==========================================================================
   TICKET
   ========================================================================== */

function existingOrderLines(table) {
  return `
    <div class="order-ticket-section order-ticket-section--existing">
      <div class="order-ticket-section__title">
        <strong>Ya enviado</strong>
        <span>${table.items.reduce((sum, item) => sum + Number(item.qty || 0), 0)} item(s)</span>
      </div>

      <div class="order-existing-lines">
        ${table.items.map((item) => {
          const detail = [
            ...(Array.isArray(item.modifiers) ? item.modifiers : []),
            item.note
          ].filter(Boolean).join(" · ");

          const status = normalizeProductionStatus(
            item.productionStatus || item.status || "Nuevo"
          );

          return `
            <article class="order-existing-line">
              <div>
                <strong>${Number(item.qty || 1)}× ${escapeHtml(item.name)}</strong>
                ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
                <span>${escapeHtml(item.station || "Produccion")}</span>
              </div>
              <div>
                <span class="${statusClass(status)}">${escapeHtml(status)}</span>
                <strong>${money(Number(item.price || 0) * Number(item.qty || 1))}</strong>
              </div>
            </article>`;
        }).join("")}
      </div>
    </div>`;
}

function cartLine(item) {
  const detail = [
    ...(item.modifiers || []),
    item.note
  ].filter(Boolean).join(" · ");

  return `
    <article class="order-cart-line">
      <div class="order-cart-line__main">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
          <span>${escapeHtml(item.station)} · ${money(item.price)} c/u</span>
        </div>

        <button
          class="order-line-remove"
          type="button"
          data-remove-line="${item.lineId}"
          aria-label="Eliminar ${escapeHtml(item.name)}"
        >
          ×
        </button>
      </div>

      <div class="order-cart-line__footer">
        <div class="qty-control">
          <button type="button" data-line-qty="${item.lineId}" data-delta="-1">−</button>
          <span>${Number(item.qty || 1)}</span>
          <button type="button" data-line-qty="${item.lineId}" data-delta="1">+</button>
        </div>

        <button class="mini-button" type="button" data-edit-line="${item.lineId}">
          Nota
        </button>

        <strong>${money(Number(item.price || 0) * Number(item.qty || 1))}</strong>
      </div>
    </article>`;
}

function cartSubtotal() {
  return ui.cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );
}

function cartQuantity() {
  return ui.cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */

function wire() {
  view.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.category = button.dataset.category;
      render();
    });
  });

  view.querySelector("[data-local-search]")?.addEventListener("input", (event) => {
    ui.search = event.target.value || "";
    render();
  });

  view.querySelectorAll("[data-product]").forEach((button) => {
    button.addEventListener("click", () => selectProduct(button.dataset.product));
  });

  view.querySelectorAll("[data-line-qty]").forEach((button) => {
    button.addEventListener("click", () => {
      updateLineQuantity(button.dataset.lineQty, Number(button.dataset.delta || 0));
    });
  });

  view.querySelectorAll("[data-remove-line]").forEach((button) => {
    button.addEventListener("click", () => {
      ui.cart = ui.cart.filter((line) => line.lineId !== button.dataset.removeLine);
      render();
    });
  });

  view.querySelectorAll("[data-edit-line]").forEach((button) => {
    button.addEventListener("click", () => openLineNote(button.dataset.editLine));
  });

  view.querySelector("[data-clear-cart]")?.addEventListener("click", () => {
    ui.cart = [];
    removeDraftForCurrentContext();
    saveState(state);
    render();
  });

  view.querySelector("[data-people]")?.addEventListener("change", (event) => {
    ui.people = Math.max(1, Number(event.target.value || 1));
  });

  view.querySelector("[data-customer]")?.addEventListener("change", (event) => {
    ui.customerId = event.target.value || "";
    render();
  });

  view.querySelector("[data-new-customer]")?.addEventListener("click", openQuickCustomerModal);

  view.querySelector("[data-table-select]")?.addEventListener("change", (event) => {
    switchTable(event.target.value);
  });

  view.querySelector("[data-save-draft]")?.addEventListener("click", () => saveDraft(true));
  view.querySelector("[data-send-production]")?.addEventListener("click", sendToProduction);
  view.querySelector("[data-request-account]")?.addEventListener("click", requestAccount);
}

/* ==========================================================================
   CAMBIO DE MESA / BORRADORES
   ========================================================================== */

function switchTable(nextTableId) {
  if (nextTableId === ui.tableId) return;

  if (ui.cart.length) saveDraft(false);

  ui.tableId = nextTableId;
  const table = currentTable();
  ui.customerId = table?.customerId || "";
  ui.people = table?.people || Math.min(table?.seats || 2, 2);
  ui.cart = [];

  history.replaceState({}, "", `ventas-pedido.html?mesa=${encodeURIComponent(nextTableId)}`);
  loadDraftForCurrentContext();
  render();
}

function draftKey() {
  return ui.channel === "Delivery" ? "D1" : ui.tableId;
}

function loadDraftForCurrentContext() {
  const draft = state.orderDrafts.find((item) => item.contextId === draftKey());
  if (!draft) return;

  ui.loadingDraft = true;
  ui.cart = clone(draft.cart || []);
  ui.customerId = draft.customerId || ui.customerId;
  ui.people = Number(draft.people || ui.people || 1);
  ui.loadingDraft = false;
}

function saveDraft(withToast = false) {
  if (!ui.cart.length) {
    if (withToast) showToast("No hay productos nuevos para guardar.");
    return;
  }

  const table = currentTable();
  const now = new Date().toISOString();
  const key = draftKey();
  let draft = state.orderDrafts.find((item) => item.contextId === key);

  if (!draft) {
    draft = {
      id: `DRF-${Date.now()}`,
      contextId: key,
      tableId: ui.channel === "Local" ? table?.id : null,
      channel: ui.channel,
      createdAt: now
    };
    state.orderDrafts.unshift(draft);
  }

  draft.customerId = ui.customerId || null;
  draft.people = ui.channel === "Local" ? Number(ui.people || 1) : null;
  draft.cart = clone(ui.cart);
  draft.updatedAt = now;
  draft.user = session.name;

  saveState(state);

  if (withToast) {
    showToast(`Borrador guardado para ${ui.channel === "Local" ? table?.name : "Delivery"}.`);
  }
}

function removeDraftForCurrentContext() {
  const key = draftKey();
  state.orderDrafts = state.orderDrafts.filter((draft) => draft.contextId !== key);
}

/* ==========================================================================
   PRODUCTO / MODIFICADORES
   ========================================================================== */

function selectProduct(productId) {
  const product = state.menuItems.find((item) => item.id === productId);
  if (!product) return;

  if (Number(product.stock || 0) <= 0) {
    showToast("Este producto no esta disponible.");
    return;
  }

  if (hasProductConfiguration(product)) {
    openProductConfigurator(product);
    return;
  }

  addLine(product, [], "", Number(product.price || 0));
  showToast(`${product.name} agregado.`);
  render();
}

function openProductConfigurator(product) {
  const groups = buildModifierGroups(product);

  const html = `
    <section class="modal order-config-modal" role="dialog" aria-modal="true" aria-labelledby="config-title">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Personalizar</p>
          <h2 id="config-title">${escapeHtml(product.name)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">
          ${closeIcon}
        </button>
      </div>

      <form class="order-config-form" data-config-form>
        <div class="order-config-product">
          <span>${productEmoji(product.category)}</span>
          <div>
            <strong>${money(product.price)}</strong>
            <p>${escapeHtml(product.description || "")}</p>
            <small>${escapeHtml(product.station || "Produccion")} · ${Number(product.estimatedTime || 0)} min</small>
          </div>
        </div>

        <div class="order-config-groups">
          ${groups.map(renderModifierGroup).join("")}

          <label class="order-config-note">
            <span>Observaciones para ${escapeHtml(product.station || "produccion")}</span>
            <textarea
              rows="3"
              name="note"
              placeholder="Ej. sin azucar, poco hielo, servir aparte..."
            ></textarea>
          </label>
        </div>

        <div class="order-config-footer">
          <div>
            <span>Total producto</span>
            <strong data-config-total>${money(product.price)}</strong>
          </div>

          <button class="button button--primary" type="submit">
            Agregar al pedido
          </button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);
  const form = modal.querySelector("[data-config-form]");

  const updateTotal = () => {
    const extra = calculateFormModifierPrice(form, groups);
    const total = modal.querySelector("[data-config-total]");
    if (total) total.textContent = money(Number(product.price || 0) + extra);
  };

  form?.querySelectorAll("[data-modifier-option]").forEach((input) => {
    input.addEventListener("change", updateTotal);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = collectModifierForm(form, groups);
    if (result.missing) {
      showToast(`Selecciona ${result.missing.toLowerCase()}.`);
      return;
    }

    const note = String(new FormData(form).get("note") || "").trim();
    const price = Number(product.price || 0) + result.extraPrice;

    addLine(product, result.labels, note, price);
    closeModal();
    showToast(`${product.name} agregado al pedido.`);
    render();
  });
}

function buildModifierGroups(product) {
  const groups = clone(product.modifiers || []);

  if (Array.isArray(product.dietary) && product.dietary.includes("adaptable_vegano")) {
    groups.push({
      id: "dietary_adaptation",
      label: "Preparacion",
      required: false,
      options: [
        { id: "original", label: "Receta original", price: 0 },
        { id: "vegano", label: "Adaptar a opcion vegana", price: 0 }
      ]
    });
  }

  return groups;
}

function renderModifierGroup(group) {
  const type = group.multiple ? "checkbox" : "radio";

  return `
    <fieldset class="order-config-group">
      <legend>
        ${escapeHtml(group.label)}
        ${group.required ? `<span>Obligatorio</span>` : `<small>Opcional</small>`}
      </legend>

      <div class="order-config-options">
        ${(group.options || []).map((option, index) => {
          const defaultChecked =
            !group.multiple &&
            !group.required &&
            index === 0 &&
            (option.id === "regular" || option.id === "original");

          return `
            <label class="order-config-option">
              <input
                type="${type}"
                name="modifier-${escapeHtml(group.id)}"
                value="${escapeHtml(option.id)}"
                data-modifier-option
                data-group-id="${escapeHtml(group.id)}"
                ${defaultChecked ? "checked" : ""}
              >
              <span>${escapeHtml(option.label)}</span>
              <strong>${Number(option.price || 0) ? `+ ${money(option.price)}` : "Incluido"}</strong>
            </label>`;
        }).join("")}
      </div>
    </fieldset>`;
}

function collectModifierForm(form, groups) {
  const labels = [];
  let extraPrice = 0;
  let missing = null;

  for (const group of groups) {
    const inputs = [...form.querySelectorAll("[data-modifier-option]")]
      .filter((input) => input.dataset.groupId === group.id && input.checked);

    if (group.required && !inputs.length) {
      missing = group.label;
      break;
    }

    inputs.forEach((input) => {
      const option = (group.options || []).find((item) => item.id === input.value);
      if (!option) return;

      if (
        option.id !== "regular" &&
        option.id !== "original"
      ) {
        labels.push(option.label);
      }

      extraPrice += Number(option.price || 0);
    });
  }

  return { labels, extraPrice, missing };
}

function calculateFormModifierPrice(form, groups) {
  let extra = 0;

  groups.forEach((group) => {
    [...form.querySelectorAll("[data-modifier-option]")]
      .filter((input) => input.dataset.groupId === group.id && input.checked)
      .forEach((input) => {
        const option = (group.options || []).find((item) => item.id === input.value);
        extra += Number(option?.price || 0);
      });
  });

  return extra;
}

function addLine(product, modifiers, note, price) {
  const key = `${product.id}|${modifiers.join("|")}|${note}`;
  const existing = ui.cart.find((line) => line.key === key);

  if (existing) {
    existing.qty += 1;
    return;
  }

  ui.cart.push({
    lineId: `LINE-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    key,
    id: product.id,
    productId: product.id,
    name: product.name,
    category: product.category,
    price: Number(price || product.price || 0),
    basePrice: Number(product.price || 0),
    qty: 1,
    station: product.station || "Cocina",
    estimatedTime: Number(product.estimatedTime || 0),
    modifiers: [...modifiers],
    note: note || ""
  });
}

function updateLineQuantity(lineId, delta) {
  const line = ui.cart.find((item) => item.lineId === lineId);
  if (!line) return;

  line.qty += delta;
  if (line.qty <= 0) {
    ui.cart = ui.cart.filter((item) => item.lineId !== lineId);
  }

  render();
}

function openLineNote(lineId) {
  const line = ui.cart.find((item) => item.lineId === lineId);
  if (!line) return;

  const html = `
    <section class="modal order-line-note-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Observacion</p>
          <h2>${escapeHtml(line.name)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="order-line-note-form" data-line-note-form>
        <label>
          <span>Nota para ${escapeHtml(line.station || "produccion")}</span>
          <textarea name="note" rows="4" placeholder="Ej. sin sal, servir aparte...">${escapeHtml(line.note || "")}</textarea>
        </label>

        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar nota</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-line-note-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    line.note = String(new FormData(event.currentTarget).get("note") || "").trim();
    closeModal();
    render();
  });
}

/* ==========================================================================
   CLIENTE RAPIDO
   ========================================================================== */

function openQuickCustomerModal() {
  const html = `
    <section class="modal quick-customer-modal" role="dialog" aria-modal="true" aria-labelledby="new-customer-title">
      <div class="modal__header">
        <div>
          <p class="eyebrow">CRM</p>
          <h2 id="new-customer-title">Registrar cliente rapido</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <form class="quick-customer-form" data-customer-form>
        <label>
          <span>Nombre *</span>
          <input name="name" required autocomplete="name" placeholder="Nombre y apellido">
        </label>

        <label>
          <span>Telefono *</span>
          <input name="phone" required autocomplete="tel" placeholder="999 999 999">
        </label>

        <label>
          <span>Segmentación <small>(opcional)</small></span>
          <select name="segment">
            <option value="No especificado" selected>No especificado</option>
            <option value="Local">Local</option>
            <option value="Turista">Turista</option>
          </select>
          <small class="muted">
            No es necesario preguntarlo durante la atención. Completa este dato solo si ya se conoce.
          </small>
        </label>

        <div class="modal__actions">
          <button class="button button--secondary" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar y asociar</button>
        </div>
      </form>
    </section>`;

  const modal = openModal(html);

  modal.querySelector("[data-customer-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const segment = String(data.get("segment") || "No especificado");

    if (!name || !phone) {
      showToast("Completa nombre y telefono.");
      return;
    }

    const existing = state.customers.find(
      (customer) => String(customer.phone || "").replace(/\s/g, "") === phone.replace(/\s/g, "")
    );

    if (existing) {
      ui.customerId = existing.id;
      closeModal();
      showToast("El cliente ya existia y fue asociado al pedido.");
      render();
      return;
    }

    const customer = {
      id: nextId(state, "customer", "CLI", 2),
      name,
      phone,
      email: "",
      birthdate: "",
      segment,
      level: "Bronce",
      points: 0,
      visits: 0,
      last: "",
      satisfaction: null,
      lifetimeSpend: 0,
      avgTicket: 0,
      preferences: [],
      tags: []
    };

    state.customers.unshift(customer);
    ui.customerId = customer.id;

    addAuditEvent(state, {
      user: session.name,
      action: "Cliente registrado",
      module: "Clientes",
      detail: customer.segment === "No especificado" ? customer.name : `${customer.name} · ${customer.segment}`
    });

    saveState(state);
    closeModal();
    showToast(`${customer.name} registrado y asociado.`);
    render();
  });
}

/* ==========================================================================
   ENVIAR A PRODUCCION
   ========================================================================== */

function sendToProduction() {
  const table = currentTable();

  if (!table) {
    showToast("Selecciona una mesa.");
    return;
  }

  if (!ui.cart.length) {
    showToast("Agrega al menos un producto.");
    return;
  }

  const now = new Date().toISOString();
  const orderId = nextId(state, "order", "ORD", 4);

  const lines = ui.cart.map((item) => ({
    id: item.productId,
    lineId: item.lineId,
    name: item.name,
    category: item.category,
    price: Number(item.price || 0),
    basePrice: Number(item.basePrice || item.price || 0),
    qty: Number(item.qty || 1),
    station: item.station || "Cocina",
    estimatedTime: Number(item.estimatedTime || 0),
    modifiers: [...(item.modifiers || [])],
    note: item.note || "",
    orderId,
    status: "Nuevo",
    productionStatus: "Nuevo",
    sentAt: now
  }));

  table.items ||= [];
  table.items.push(...clone(lines));
  table.status = "Ocupada";
  table.openedAt ||= now;
  table.customerId = ui.customerId || table.customerId || null;
  table.people = ui.channel === "Local" ? Number(ui.people || 1) : null;

  // Si el cliente habia pedido la cuenta y luego agrega productos,
  // se retira temporalmente de Caja hasta finalizar el nuevo consumo.
  if (table.accountRequested) {
    table.accountRequested = false;
    table.paymentStatus = null;
    table.accountRequestedAt = null;
    state.cashQueue = state.cashQueue.filter((entry) => entry.tableId !== table.id);
  }

  state.kitchenOrders.push({
    id: orderId,
    tableId: ui.channel === "Local" ? table.id : null,
    table: ui.channel === "Local" ? table.name : "Delivery",
    customerId: ui.customerId || null,
    channel: ui.channel,
    status: "Nuevo",
    createdAt: now,
    elapsed: 0,
    items: lines.map((line) => ({
      id: line.id,
      lineId: line.lineId,
      name: line.name,
      qty: line.qty,
      station: line.station,
      estimatedTime: line.estimatedTime,
      modifiers: [...line.modifiers],
      note: line.note,
      price: line.price,
      status: "Nuevo"
    })),
    notes: "",
    user: session.name
  });

  removeDraftForCurrentContext();

  addAuditEvent(state, {
    user: session.name,
    action: "Pedido enviado a produccion",
    module: "Ventas",
    detail: `${orderId} · ${ui.channel === "Local" ? table.name : "Delivery"} · ${cartQuantity()} productos`
  });

  saveState(state);

  const stationCounts = lines.reduce((result, line) => {
    result[line.station] = (result[line.station] || 0) + Number(line.qty || 1);
    return result;
  }, {});

  ui.cart = [];

  openOrderSentModal(orderId, table, stationCounts);
  render();
}

function openOrderSentModal(orderId, table, stationCounts) {
  const stations = Object.entries(stationCounts)
    .map(([station, count]) => `
      <div class="order-sent-station">
        <span>${station === "Barra" ? "☕" : "🍳"}</span>
        <div>
          <strong>${escapeHtml(station)}</strong>
          <small>${count} producto${count === 1 ? "" : "s"} recibido${count === 1 ? "" : "s"}</small>
        </div>
      </div>`)
    .join("");

  const html = `
    <section class="modal order-sent-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Pedido enviado</p>
          <h2>${escapeHtml(orderId)}</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <div class="order-sent-body">
        <div class="order-sent-success">✓</div>
        <h3>${escapeHtml(table.name)} ya esta en produccion</h3>
        <p>Barra y Cocina reciben solamente los productos asignados a su estacion.</p>

        <div class="order-sent-stations">
          ${stations}
        </div>

        <div class="order-production-flow">
          <span class="is-active">Nuevo</span>
          <i>→</i>
          <span>En preparacion</span>
          <i>→</i>
          <span>Listo</span>
          <i>→</i>
          <span>Entregado</span>
        </div>
      </div>

      <div class="modal__actions">
        <a class="button button--secondary" href="ventas.html">Volver al salon</a>
        <button class="button button--primary" type="button" data-close-modal>Seguir agregando</button>
      </div>
    </section>`;

  openModal(html);
}

/* ==========================================================================
   SOLICITAR CUENTA / COLA DE CAJA
   ========================================================================== */

function requestAccount() {
  const table = currentTable();

  if (!table) return;

  if (ui.cart.length) {
    showToast("Envia primero los productos pendientes.");
    return;
  }

  if (!table.items.length) {
    showToast("La mesa aun no tiene consumo.");
    return;
  }

  const now = new Date().toISOString();
  const total = tableTotal(table);
  const customer = customerById(table.customerId);

  table.accountRequested = true;
  table.paymentStatus = "Por cobrar";
  table.accountRequestedAt = now;

  let queueEntry = state.cashQueue.find(
    (entry) => entry.tableId === table.id && entry.status !== "Cerrado"
  );

  if (!queueEntry) {
    queueEntry = {
      id: `PAY-${table.id}-${Date.now()}`,
      tableId: table.id,
      table: table.name,
      customerId: table.customerId || null,
      channel: ui.channel,
      status: "Pendiente",
      requestedAt: now
    };
    state.cashQueue.unshift(queueEntry);
  }

  queueEntry.total = total;
  queueEntry.requestedBy = session.name;
  queueEntry.orderIds = [...new Set(
    table.items.map((item) => item.orderId).filter(Boolean)
  )];

  addAuditEvent(state, {
    user: session.name,
    action: "Cuenta solicitada",
    module: "Ventas",
    detail: `${table.name} · ${money(total)} · enviada a Caja`
  });

  saveState(state);
  render();

  const html = `
    <section class="modal account-requested-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Cuenta solicitada</p>
          <h2>${escapeHtml(table.name)} → Caja</h2>
        </div>
        <button class="icon-button" type="button" data-close-modal>${closeIcon}</button>
      </div>

      <div class="account-requested-body">
        <div class="account-requested-icon">✓</div>

        <div class="account-requested-summary">
          <div>
            <span>Total estimado</span>
            <strong>${money(total)}</strong>
          </div>
          <div>
            <span>Cliente</span>
            <strong>${escapeHtml(customer?.name || "Consumidor final")}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>Por cobrar</strong>
          </div>
        </div>

        <p>
          El mozo termina aqui su flujo de cobro.
          Caja seleccionara el medio de pago, comprobante, descuentos autorizados
          y cerrara la venta.
        </p>
      </div>

      <div class="modal__actions">
        <a class="button button--secondary" href="ventas.html">Volver al salon</a>
        <a class="button button--primary" href="caja.html">Ver Caja</a>
      </div>
    </section>`;

  openModal(html);
}

/* ==========================================================================
   HELPERS
   ========================================================================== */

function latestOrderForTable(tableId) {
  return [...state.kitchenOrders]
    .filter((order) => order.tableId === tableId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
}

function normalizeProductionStatus(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("entreg")) return "Entregado";
  if (value.includes("list")) return "Listo";
  if (value.includes("prepar")) return "Preparando";
  if (value.includes("enviado") || value.includes("nuevo")) return "Nuevo";

  return "Nuevo";
}

function clone(value) {
  if (value === undefined) return undefined;

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // Fallback JSON debajo.
    }
  }

  return JSON.parse(JSON.stringify(value));
}
