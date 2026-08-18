// Cafe Fusiones - Administracion (solo la logica de esta pantalla).
// Mejoras del jefe: alta de usuario en FILAS (no dos columnas), y "Lote de cafe" +
// "Trazabilidad de cafe" agrupados en un solo bloque. Usuarios y roles se mantienen.
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState } from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, statusClass } from "../core/utils.js";
import { auditEvents } from "../data/data.js";

const session = requireAuth();
if (session && !canAccess(session.role, "admin")) window.location.replace("dashboard.html");
const state = getState();
const view = document.getElementById("view");
const adminTabs = [
  { id: "platos", label: "Gestion de platos" },
  { id: "categorias", label: "Categorias" },
  { id: "recetas", label: "Recetas" },
  { id: "trazabilidad", label: "Trazabilidad" },
  { id: "usuarios", label: "Usuarios" },
  { id: "historial", label: "Historial" }
];
let activeAdminTab = "platos";

if (!Array.isArray(state.recipes) || state.recipes.length === 0) {
  state.recipes = [
    { id: "RCP-001", productId: "caf-cappuccino", name: "Cappuccino", station: "Barra", yieldQty: 1, yieldUnit: "porción", targetMinutes: 5, expectedWastePct: 2, version: "1.1", status: "Activa", ingredients: [{ inventoryId: "INS-01", qty: 0.018, unit: "kg", note: "18 g café tostado" }, { inventoryId: "INS-02", qty: 0.18, unit: "L", note: "180 ml leche fresca" }], variants: [] },
    { id: "RCP-002", productId: "caf-latte", name: "Café Latte", station: "Barra", yieldQty: 1, yieldUnit: "porción", targetMinutes: 5, expectedWastePct: 2, version: "1.0", status: "Activa", ingredients: [{ inventoryId: "INS-01", qty: 0.018, unit: "kg", note: "18 g café tostado" }, { inventoryId: "INS-02", qty: 0.22, unit: "L", note: "220 ml leche fresca" }], variants: [] },
    { id: "RCP-003", productId: "san-acevichado", name: "Sándwich Acevichado", station: "Cocina", yieldQty: 1, yieldUnit: "porción", targetMinutes: 9, expectedWastePct: 4, version: "1.0", status: "Activa", ingredients: [{ inventoryId: "INS-05", qty: 1, unit: "un", note: "Pan artesanal" }, { inventoryId: "INS-06", qty: 0.08, unit: "kg", note: "Palta" }], variants: [] },
    { id: "RCP-004", productId: "cho-caliente", name: "Chocolate caliente", station: "Barra", yieldQty: 1, yieldUnit: "porción", targetMinutes: 6, expectedWastePct: 2, version: "1.0", status: "Activa", ingredients: [{ inventoryId: "INS-08", qty: 0.035, unit: "kg", note: "Chocolate regional" }, { inventoryId: "INS-02", qty: 0.2, unit: "L", note: "Leche fresca" }], variants: [] }
  ];
  saveState(state);
}

if (session && canAccess(session.role, "admin")) {
  renderSidebar("admin", session.role);
  renderTopbar({ title: "Administracion", eyebrow: "Modulo", showSearch: false });
  render();
}

function render() {
  view.innerHTML = `
    <div class="view-stack admin-view">
      <div class="admin-tabbar" role="tablist" aria-label="Administracion">
        ${adminTabs.map((tab) => `
          <button
            type="button"
            class="admin-tab ${activeAdminTab === tab.id ? "is-active" : ""}"
            data-admin-tab="${tab.id}"
            role="tab"
            aria-selected="${activeAdminTab === tab.id ? "true" : "false"}"
          >${tab.label}</button>
        `).join("")}
      </div>
      ${renderAdminTabContent(activeAdminTab)}
    </div>`;
  wire();
}

function renderAdminTabContent(tabId) {
  switch (tabId) {
    case "categorias":
      return `
        <section class="panel category-panel">
          <div class="panel__header"><h2>Categorias</h2><span class="status status--info">${state.menuCategories.length - 1}</span></div>
          <form class="category-form" data-category-form><label>Nueva categoria<input name="category" required placeholder="Nombre de categoria"></label><button class="button button--secondary" type="submit">Agregar categoria</button></form>
          <div class="category-list">${state.menuCategories.filter((c) => c !== "Todos").map((c) => `<span class="category-pill">${escapeHtml(c)}</span>`).join("")}</div>
        </section>
      `;
    case "recetas":
      return `
        <section class="panel">
          <div class="panel__header panel__header--wrap">
            <div><p class="eyebrow">Recetas</p><h2>Listado de preparación</h2></div>
            <button class="button button--primary" type="button" data-new-recipe>${icon("plus")}<span>Nueva receta</span></button>
          </div>
          <div class="table-wrap"><table class="data-table recipe-table"><thead><tr><th>Receta</th><th>Estación</th><th>Costo</th><th>Venta</th><th>Margen</th><th>Tiempo</th><th>Merma</th><th>Acciones</th></tr></thead><tbody>${recipeRows()}</tbody></table></div>
        </section>
      `;
    case "trazabilidad":
      return `
        <section class="panel">
          <div class="panel__header"><h2>Trazabilidad del café</h2><span class="status status--ok">Lotes</span></div>
          <p class="muted" style="margin-bottom:14px;">Registro de lotes, origen y recorrido del café desde la recepción hasta la preparación.</p>
          ${coffeeLotForm()}
          <div class="traceability-list" style="margin-top:18px;">${coffeeLots()}</div>
        </section>
      `;
    case "usuarios":
      return `
        <section class="panel">
          <div class="panel__header panel__header--wrap">
            <div><p class="eyebrow">Usuarios</p><h2>Usuarios y roles</h2></div>
            <button class="button button--primary" type="button" data-new-user>${icon("plus")}<span>Nuevo usuario</span></button>
          </div>
          ${userEditor()}
        </section>
      `;
    case "historial":
      return `
        <section class="panel">
          <div class="panel__header"><h2>Bitacora</h2><span class="status">Auditoria</span></div>
          <div class="timeline">${auditEvents.map((e) => `<div class="timeline-item"><time>${e.time}</time><p><strong>${e.user}</strong><br><span class="muted">${e.action} · ${e.module}</span></p></div>`).join("")}</div>
        </section>
      `;
    case "platos":
    default:
      return `
        <section class="panel">
          <div class="panel__header"><h2>Gestion de platos</h2><span class="status">Carta</span></div>
          <form class="form-grid" data-menu-form>
            <label>Nombre<input name="name" required placeholder="Producto"></label>
            <label>Categoria<select name="category">${state.menuCategories.filter((c) => c !== "Todos").map((c) => `<option value="${c}">${c}</option>`).join("")}</select></label>
            <label>Precio<input name="price" type="number" min="0" step="0.01" required></label>
            <label>Stock<input name="stock" type="number" min="0" step="1" required></label>
            <label class="span-2">Descripcion<textarea class="textarea" name="description" required placeholder="Descripcion visible en la carta"></textarea></label>
            <label class="span-2">Fotografia (URL)<input name="image" placeholder="https://... (opcional)"></label>
            <label class="span-2 check-inline"><input type="checkbox" name="publishLanding" checked> Publicar tambien en la landing page</label>
            <button class="button button--primary" type="submit">${icon("plus")}<span>Guardar plato</span></button>
          </form>
        </section>
      `;
  }
}

function getInventoryItemById(id) {
  return state.inventory.find((item) => item.id === id) || null;
}

function ingredientCost(item, ingredient) {
  if (!item) return 0;
  const qty = Number(ingredient.qty || 0);
  const inventoryUnit = String(item.unit || "").toLowerCase();
  const ingredientUnit = String(ingredient.unit || "").toLowerCase();
  let normalizedQty = qty;

  if (inventoryUnit === "kg" && ingredientUnit === "g") normalizedQty /= 1000;
  if (inventoryUnit === "l" && ingredientUnit === "ml") normalizedQty /= 1000;
  if (inventoryUnit === "g" && ingredientUnit === "kg") normalizedQty *= 1000;
  if (inventoryUnit === "ml" && ingredientUnit === "l") normalizedQty *= 1000;

  return normalizedQty * Number(item.cost || 0);
}

function recipeCost(recipe) {
  return Number((recipe.ingredients || []).reduce((sum, ingredient) => sum + ingredientCost(getInventoryItemById(ingredient.inventoryId), ingredient), 0).toFixed(2));
}

function recipeMargin(recipe) {
  const product = state.menuItems.find((item) => item.id === recipe.productId);
  const price = Number(product?.price || 0);
  const cost = recipeCost(recipe);
  return price ? ((price - cost) / price) * 100 : 0;
}

function recipeRows() {
  const rows = [...state.recipes].sort((a, b) => a.name.localeCompare(b.name));
  return rows.map((recipe) => {
    const product = state.menuItems.find((item) => item.id === recipe.productId) || { price: 0 };
    const cost = recipeCost(recipe);
    const salePrice = Number(product.price || 0);
    const margin = salePrice ? ((salePrice - cost) / salePrice) * 100 : 0;
    return `<tr>
      <td><div class="recipe-name-cell"><strong>${escapeHtml(recipe.name)}</strong><span class="${statusClass(recipe.status || "Activa")}">${recipe.status || "Activa"}</span></div></td>
      <td>${escapeHtml(recipe.station || "Barra")}</td>
      <td><strong>${money(cost)}</strong></td>
      <td>${money(salePrice)}</td>
      <td>${margin.toFixed(1)}%</td>
      <td>${recipe.targetMinutes || 0} min</td>
      <td>${recipe.expectedWastePct || 0}%</td>
      <td><div class="table-actions"><button class="mini-button" type="button" data-recipe-view="${recipe.id}">Ver</button><button class="mini-button" type="button" data-recipe-edit="${recipe.id}">Editar</button></div></td>
    </tr>`;
  }).join("") || '<tr><td colspan="8" class="muted text-center">Sin recetas registradas.</td></tr>';
}

function openRecipeView(id) {
  const recipe = state.recipes.find((item) => item.id === id);
  if (!recipe) return;
  const product = state.menuItems.find((item) => item.id === recipe.productId);
  const rows = (recipe.ingredients || []).map((ingredient) => {
    const inventoryItem = getInventoryItemById(ingredient.inventoryId);
    return `<tr><td>${escapeHtml(inventoryItem?.item || ingredient.inventoryId)}</td><td>${ingredient.qty} ${escapeHtml(inventoryItem?.unit || ingredient.unit || "")}</td><td>${money(ingredientCost(inventoryItem, ingredient))}</td></tr>`;
  }).join("") || '<tr><td colspan="3" class="muted text-center">Sin insumos.</td></tr>';

  const modalHtml = `
    <section class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__header"><div><p class="eyebrow">Receta / BOM</p><h2>${escapeHtml(recipe.name)}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div style="padding:20px;">
        <p class="muted">${escapeHtml(product?.name || recipe.name)} · ${escapeHtml(recipe.station || "Barra")} · ${recipe.targetMinutes || 0} min</p>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="confirm-actions" style="margin-top:16px;"><button class="button button--primary" type="button" data-close-modal>Cerrar</button></div>
      </div>
    </section>`;
  openModal(modalHtml);
}

function openRecipeEditor(id) {
  const recipe = id ? state.recipes.find((item) => item.id === id) || null : null;
  const selectedProduct = recipe?.productId || state.menuItems[0]?.id || "";
  const selectedStation = recipe?.station || "Barra";
  const modalHtml = `
    <section class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__header"><div><p class="eyebrow">Recetas / BOM</p><h2>${recipe ? "Editar receta" : "Nueva receta"}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid" data-recipe-form style="padding:20px;">
        <label>Producto<select name="productId">${state.menuItems.map((item) => `<option value="${item.id}" ${item.id === selectedProduct ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Estación<select name="station"><option ${selectedStation === "Barra" ? "selected" : ""}>Barra</option><option ${selectedStation === "Cocina" ? "selected" : ""}>Cocina</option></select></label>
        <label>Rendimiento<input name="yieldQty" type="number" min="1" step="1" value="${recipe?.yieldQty || 1}"></label>
        <label>Unidad<select name="yieldUnit"><option ${recipe?.yieldUnit === "porción" ? "selected" : ""}>porción</option><option ${recipe?.yieldUnit === "kg" ? "selected" : ""}>kg</option></select></label>
        <label>Tiempo objetivo<input name="targetMinutes" type="number" min="1" step="1" value="${recipe?.targetMinutes || 5}"></label>
        <label>Merma técnica %<input name="expectedWastePct" type="number" min="0" step="0.1" value="${recipe?.expectedWastePct || 2}"></label>
        <label class="span-2">Ingredientes (solo prototipo)<textarea class="textarea" name="ingredients" placeholder="Se gestionan desde el inventario y se convierten en la receta final.">${(recipe?.ingredients || []).map((ingredient) => `${ingredient.inventoryId}:${ingredient.qty}${ingredient.unit}`).join("; ")}</textarea></label>
        <div class="confirm-actions span-2"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Guardar receta</button></div>
      </form>
    </section>`;

  const modal = openModal(modalHtml);
  const form = modal.querySelector("[data-recipe-form]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const productId = String(data.productId || "");
    const product = state.menuItems.find((item) => item.id === productId);
    if (!product) {
      showToast("Selecciona un producto válido.");
      return;
    }

    const lastRecipeId = state.recipes.length ? state.recipes[state.recipes.length - 1].id : "RCP-000";
    const nextIdNumber = Number(String(lastRecipeId).match(/(\d+)$/)?.[1] || 0) + 1;
    const payload = {
      id: recipe?.id || `RCP-${String(nextIdNumber).padStart(3, "0")}`,
      productId,
      name: product.name,
      station: String(data.station || "Barra"),
      yieldQty: Number(data.yieldQty || 1),
      yieldUnit: String(data.yieldUnit || "porción").trim(),
      targetMinutes: Number(data.targetMinutes || 5),
      expectedWastePct: Number(data.expectedWastePct || 0),
      version: recipe?.version || "1.0",
      status: "Activa",
      ingredients: recipe?.ingredients || [{ inventoryId: "INS-01", qty: 0.018, unit: "kg", note: "Ingrediente principal" }],
      variants: recipe?.variants || []
    };

    if (recipe) {
      Object.assign(recipe, payload);
    } else {
      state.recipes.push(payload);
    }
    saveState(state);
    closeModal();
    showToast(recipe ? "Receta actualizada." : "Receta creada.");
    render();
  });
}

function coffeeLotForm() {
  return `<form class="form-grid" data-lot-form><label>Codigo de lote<input name="code" required placeholder="AMZ-2607-02"></label><label>Origen<input name="origin" required placeholder="Provincia / finca"></label><label>Productor<input name="producer" required placeholder="Nombre del productor"></label><label>Variedad<input name="variety" required placeholder="Typica, Caturra..."></label><label>Tostado<select name="roast"><option>Ligero</option><option>Media</option><option>Oscuro</option></select></label><label>Recepcion<input name="received" type="date" required></label><label>Cantidad<input name="stock" type="number" min="0.01" step="0.01" required></label><label>Unidad<input name="unit" value="kg" required></label><label class="span-2">Notas de trazabilidad<textarea class="textarea" name="notes" placeholder="Finca, altura, proceso, perfil de taza"></textarea></label><button class="button button--primary" type="submit">Guardar lote</button></form>`;
}

function coffeeLots() {
  return state.coffeeLots.map((lot) => `<article class="trace-card"><div class="trace-card__head"><strong>${escapeHtml(lot.code)}</strong><span class="status status--info">${lot.stock} ${lot.unit}</span></div><p><strong>${escapeHtml(lot.origin)}</strong> · ${escapeHtml(lot.producer)}</p><p class="muted">${escapeHtml(lot.variety)} · Tostado ${lot.roast} · Recibido ${lot.received}</p><p class="muted">${escapeHtml(lot.notes || "Sin notas adicionales")}</p></article>`).join("");
}

function userEditor() {
  const rows = state.users.map((user, index) => `
    <div class="admin-row">
      <div><strong>${escapeHtml(user.name)}</strong><p class="muted">${user.role}</p></div>
      <span class="${statusClass(user.status)}">${user.status}</span>
      <div><button class="mini-button" type="button" data-toggle-user="${index}">${user.status === "Activo" ? "Desactivar" : "Activar"}</button></div>
    </div>`).join("");
  return `<div class="admin-list">${rows}</div>`;
}

function openUserModal() {
  const modalHtml = `
    <section class="modal modal--small" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div><p class="eyebrow">Usuarios</p><h2>Nuevo usuario</h2></div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button>
      </div>
      <form class="form-grid" data-user-form style="padding:20px;">
        <label>Nombre<input name="name" required placeholder="Nombre del usuario"></label>
        <label>Rol<select name="role"><option>Administrador</option><option>Cajero</option><option>Cocina</option><option>Operaciones</option></select></label>
        <div class="confirm-actions span-2">
          <button class="button" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">Guardar usuario</button>
        </div>
      </form>
    </section>
  `;

  const modal = openModal(modalHtml);
  const form = modal.querySelector("[data-user-form]");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    state.users.push({ name: d.name, role: d.role, status: "Activo" });
    saveState(state);
    closeModal();
    showToast("Usuario agregado.");
    render();
  });
}

function wire() {
  view.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminTab = button.dataset.adminTab;
      render();
    });
  });

  const menuForm = view.querySelector("[data-menu-form]");
  menuForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    state.menuItems.push({
      id: `prd-${Date.now().toString(36)}`, name: d.name, category: d.category,
      price: Number(d.price), stock: Number(d.stock), channel: "Local", description: d.description,
      image: (d.image || "").trim(), publishLanding: !!d.publishLanding
    });
    saveState(state);
    showToast(d.publishLanding ? "Plato guardado y publicado en la landing." : "Plato guardado en la carta.");
    render();
  });

  const newRecipeButton = view.querySelector("[data-new-recipe]");
  newRecipeButton?.addEventListener("click", () => openRecipeEditor());

  view.querySelectorAll("[data-recipe-view]").forEach((b) => b.addEventListener("click", () => openRecipeView(b.dataset.recipeView)));
  view.querySelectorAll("[data-recipe-edit]").forEach((b) => b.addEventListener("click", () => openRecipeEditor(b.dataset.recipeEdit)));

  const categoryForm = view.querySelector("[data-category-form]");
  categoryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const c = String(new FormData(event.target).get("category") || "").trim();
    if (!c || state.menuCategories.includes(c)) { showToast("La categoria ya existe o esta vacia."); return; }
    state.menuCategories.push(c); saveState(state); showToast("Categoria agregada."); render();
  });
  const lotForm = view.querySelector("[data-lot-form]");
  lotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    state.coffeeLots.unshift({ id: `LOT-CAF-${String(state.coffeeLots.length + 1).padStart(3, "0")}`, code: d.code, origin: d.origin, producer: d.producer, variety: d.variety, roast: d.roast, received: d.received, stock: Number(d.stock), unit: d.unit, notes: d.notes });
    saveState(state); showToast("Lote de café registrado correctamente."); render();
  });
  const userForm = view.querySelector("[data-user-form]");
  userForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    state.users.push({ name: d.name, role: d.role, status: "Activo" });
    saveState(state); showToast("Usuario agregado."); render();
  });

  const newUserButton = view.querySelector("[data-new-user]");
  newUserButton?.addEventListener("click", () => openUserModal());

  view.querySelectorAll("[data-toggle-user]").forEach((b) => b.addEventListener("click", () => {
    const user = state.users[Number(b.dataset.toggleUser)];
    if (user) { user.status = user.status === "Activo" ? "Inactivo" : "Activo"; saveState(state); showToast("Estado de usuario actualizado."); render(); }
  }));
}
