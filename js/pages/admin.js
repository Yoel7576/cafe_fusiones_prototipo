// Cafe Fusiones - Administracion (solo la logica de esta pantalla).
// Mejoras del jefe: "Lote de cafe" + "Trazabilidad de cafe" agrupados en un
// solo bloque. Los usuarios se administran
// en Configuracion > Usuarios y permisos.
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import {
  getState,
  saveState,
  nextId,
  addAuditEvent,
  activeBranches,
  branchById,
  categoriesByScope,
  CATEGORY_SCOPES
} from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { confirmAction } from "../components/confirm.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, statusClass, matchesSearch } from "../core/utils.js";

const session = requireAuth();
if (session && !canAccess(session.role, "admin")) window.location.replace("dashboard.html");
const state = getState();
const view = document.getElementById("view");
const adminTabs = [
  { id: "carta", label: "Gestión de carta" },
  { id: "recetas", label: "Recetas" },
  { id: "categorias", label: "Categorías" },
  { id: "trazabilidad", label: "Trazabilidad" },
  { id: "historial", label: "Historial" }
];
const params = new URLSearchParams(location.search);
let activeAdminTab = adminTabs.some((tab) => tab.id === params.get("tab")) ? params.get("tab") : "carta";
// Lote que se esta editando (null = alta) y borrador del formulario, para que
// agregar o quitar un paso no borre lo que el usuario ya escribio.
const loteUi = { editandoId: null, pasos: [], borrador: null };
// Historial: tabla paginada para no hacer un scroll infinito.
const HISTORY_PAGE_SIZE = 20;
const historyUi = { page: 1 };

// Sub-vista de Trazabilidad (?vista=): registro de lotes o paginas publicadas.
const traceUi = {
  vista: params.get("vista") === "paginas" ? "paginas" : "lotes",
  filtro: "publicadas"
};
// Tipo de categoria visible en la pestana Categorias (?scope=).
const categoryUi = {
  scope: CATEGORY_SCOPES.some((scope) => scope.id === params.get("scope")) ? params.get("scope") : CATEGORY_SCOPES[0].id
};

// Respaldo para recetas sin plato (preparaciones base): `section` viene de la semilla.
const RECIPE_CATEGORIES = [
  { section: "CAFÉS", label: "Cafés" },
  { section: "CHOCOLATES", label: "Chocolates" },
  { section: "MÉTODOS", label: "Métodos" },
  { section: "BEBIDAS VEGETALES", label: "Bebidas Vegetales" },
  { section: "DESAYUNOS", label: "Desayunos" },
  { section: "SANDWICHES", label: "Sandwiches" },
  { section: "SOPAS", label: "Sopas" },
  { section: "ENSALADAS", label: "Ensaladas" },
  { section: "PASTAS", label: "Pastas" },
  { section: "PLATOS ESPECIALES", label: "Platos Especiales" },
  { section: "BRUNCHES", label: "Brunches" },
  { section: "POSTRES", label: "Postres" },
  { section: "INFUSIONES", label: "Infusiones" },
  { section: "JUGOS/BATIDOS", label: "Jugos/Batidos" },
  { section: "TRAGOS/CÓCTELES", label: "Tragos/Cócteles" }
];
const NO_CATEGORY = "Sin categoría";
const ALL = "Todas";
const recipeFilters = { search: "", station: ALL, category: ALL };
const PUBLISH_FILTERS = [ALL, "En landing", "Solo sistema", "No disponible"];
const cartaFilters = { search: "", category: ALL, station: ALL, publish: ALL };
const PHOTO_MAX_SIZE = 800;
const MISSING_COST = {
  "sin-receta": "Sin receta",
  "directo-sin-costo": "Sin costo en inventario"
};

// Lista unica de categorias: la misma para carta, recetas y landing.
function categoryList() {
  return (state.menuCategories || []).filter((c) => c !== "Todos");
}

// Categorias en orden, mas las que usen platos o recetas y no esten en la lista.
function categoriesInUse(names) {
  const list = categoryList();
  names.forEach((name) => { if (!list.includes(name)) list.push(name); });
  return list;
}

function recipeCategoryOptions() {
  return categoriesInUse(state.recipes.map(recipeCategory));
}

function recipePlatoIds(recipe) {
  return [...new Set([...(recipe.productIds || []), recipe.productId].filter(Boolean))];
}

function recipeOfPlato(platoId) {
  return state.recipes.find((recipe) => recipePlatoIds(recipe).includes(platoId)) || null;
}

function filteredRecipes() {
  return state.recipes.filter((recipe) =>
    (recipeFilters.station === ALL || (recipe.station || "Barra") === recipeFilters.station) &&
    (recipeFilters.category === ALL || recipeCategory(recipe) === recipeFilters.category) &&
    matchesSearch(recipeFilters.search, recipe.name));
}

// La categoria de una receta es la de su plato; solo las preparaciones base
// (sin plato en la carta) usan la seccion del recetario.
function recipeCategory(recipe) {
  const plato = recipePlatoIds(recipe).map((id) => state.menuItems.find((item) => item.id === id)).find(Boolean);
  if (plato?.category) return plato.category;
  if (recipe.category) return recipe.category;
  const match = RECIPE_CATEGORIES.find((c) => c.section === String(recipe.section || "").toUpperCase());
  return match ? match.label : NO_CATEGORY;
}

if (session && canAccess(session.role, "admin")) {
  renderSidebar("admin", session.role);
  renderTopbar({ title: "Administracion", eyebrow: "Modulo", showSearch: false });
  render();
}

function render() {
  closeLotMenu();
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
      return renderCategories();
    case "recetas":
      return `
        <section class="panel admin-toolbar">
          <label class="admin-toolbar__search"><span>Buscar</span><input type="search" data-recipe-search placeholder="Buscar receta..." value="${escapeHtml(recipeFilters.search)}"></label>
          <label><span>Estación</span><select data-recipe-station>${[ALL, "Barra", "Cocina"].map((s) => `<option ${recipeFilters.station === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label><span>Categoría</span><select data-recipe-category>${[ALL, ...recipeCategoryOptions()].map((c) => `<option ${recipeFilters.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
          <button class="button button--primary" type="button" data-new-recipe>${icon("plus")}<span>Nueva receta</span></button>
        </section>
        <section class="panel">
          <div class="panel__header panel__header--wrap">
            <div><p class="eyebrow">Recetas</p><h2>Listado de preparación</h2></div>
            <span class="status status--info" data-recipe-count>${filteredRecipes().length}</span>
          </div>
          <div class="table-wrap"><table class="data-table recipe-table"><thead><tr><th>Receta</th><th>Estación</th><th>Categoría</th><th>Costo</th><th>Venta</th><th>Margen</th><th>Merma</th><th>Acciones</th></tr></thead><tbody data-recipe-body>${recipeRows()}</tbody></table></div>
        </section>
      `;
    case "trazabilidad":
      return `
        ${traceSubtabs()}
        ${traceUi.vista === "paginas" ? publishedPages() : `
          <section class="panel">
            <div class="panel__header"><h2>Trazabilidad del café</h2><span class="status status--ok">Lotes</span></div>
            <p class="muted" style="margin-bottom:14px;">Registro de lotes, origen y recorrido del café desde la recepción hasta la preparación.</p>
            ${coffeeLotForm()}
            <div class="traceability-list" style="margin-top:18px;">${coffeeLots()}</div>
          </section>
        `}
      `;
    case "historial":
      return `
        <section class="panel admin-history">
          <div class="panel__header"><h2>Bitácora</h2><span class="status">Auditoría</span></div>
          ${auditTable()}
        </section>
      `;
    case "carta":
    default:
      return `
        <section class="panel admin-toolbar">
          <label class="admin-toolbar__search"><span>Buscar</span><input type="search" data-carta-search placeholder="Buscar plato..." value="${escapeHtml(cartaFilters.search)}"></label>
          <label><span>Categoría</span><select data-carta-category>${[ALL, ...categoriesInUse(state.menuItems.map((item) => item.category))].map((c) => `<option ${cartaFilters.category === c ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
          <label><span>Estación</span><select data-carta-station>${[ALL, "Barra", "Cocina"].map((s) => `<option ${cartaFilters.station === s ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label><span>Publicación</span><select data-carta-publish>${PUBLISH_FILTERS.map((p) => `<option ${cartaFilters.publish === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
          <button class="button button--primary" type="button" data-new-plato>${icon("plus")}<span>Nuevo plato</span></button>
        </section>
        <section class="panel">
          <div class="panel__header panel__header--wrap">
            <div><p class="eyebrow">Carta</p><h2>Platos del sistema y la landing</h2></div>
            <span class="status status--info" data-carta-count>${filteredPlatos().length}</span>
          </div>
          <div class="table-wrap"><table class="data-table carta-table"><thead><tr><th>Plato</th><th>Categoría</th><th>Precio</th><th>Costo</th><th>Margen</th><th>Sistema</th><th>Landing</th><th>Acciones</th></tr></thead><tbody data-carta-body>${cartaRows()}</tbody></table></div>
        </section>
      `;
  }
}

/* ==========================================================================
   GESTION DE CARTA: el plato une venta (sistema), publicacion (landing) y receta
   ========================================================================== */

/* ==========================================================================
   CATEGORIAS
   Catalogo dinamico por tipo (carta, landing, inventario, gastos). Antes vivia
   en Configuracion; se administra aqui junto a la lista de la carta.
   ========================================================================== */

function renderCategories() {
  const categories = categoriesByScope(state, categoryUi.scope, { activeOnly: false });
  const menuList = categoryList();

  return `
    <section class="panel admin-cat-toolbar">
      <h2>Categorías</h2>
      <button class="button button--primary" type="button" data-new-category>
        ${icon("plus")}<span>Nueva categoría</span>
      </button>
    </section>

    <nav class="panel admin-subtabs" aria-label="Tipos de categoría">
      ${CATEGORY_SCOPES.map((scope) => `
        <button
          class="admin-subtab ${categoryUi.scope === scope.id ? "is-active" : ""}"
          type="button"
          data-category-scope="${scope.id}"
        >
          ${escapeHtml(scope.label)}
        </button>
      `).join("")}
    </nav>

    <section class="panel admin-cat-list">
      <div class="panel__header">
        <h2>Categorías configuradas</h2>
        <span class="status status--info">${categories.length} registro(s)</span>
      </div>
      ${categories.length ? `
        <div class="table-wrap">
          <table class="data-table admin-cat-table">
            <thead>
              <tr><th>Orden</th><th>Categoría</th><th>Aplica en</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              ${categories.map((category, index) => categoryRow(category, index, categories.length)).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="admin-cat-empty">
          <strong>No hay categorías creadas</strong>
          <p>Crea la primera categoría para ${escapeHtml(scopeLabel(categoryUi.scope).toLowerCase())}.</p>
          <button class="button button--primary" type="button" data-new-category>Crear primera categoría</button>
        </div>
      `}
    </section>

    <section class="panel category-panel">
      <div class="panel__header">
        <h2>Categorías de la carta</h2>
        <span class="status status--info">${menuList.length}</span>
      </div>
      <p class="muted admin-cat-note">Lista que usan Ventas, las recetas y la landing para agrupar los platos.</p>
      <form class="category-form" data-category-form><label>Nueva categoria<input name="category" required placeholder="Nombre de categoria"></label><button class="button button--secondary" type="submit">Agregar categoria</button></form>
      <div class="category-list">${menuList.map((c) => `<span class="category-pill">${escapeHtml(c)}</span>`).join("")}</div>
    </section>
  `;
}

function categoryRow(category, index, total) {
  const active = category.status !== "Inactiva";
  return `
    <tr>
      <td>
        <div class="admin-cat-order">
          <button class="icon-button" type="button" data-move-category="${category.id}" data-direction="-1" ${index === 0 ? "disabled" : ""} aria-label="Subir categoría">↑</button>
          <button class="icon-button" type="button" data-move-category="${category.id}" data-direction="1" ${index === total - 1 ? "disabled" : ""} aria-label="Bajar categoría">↓</button>
        </div>
      </td>
      <td>
        <strong>${escapeHtml(category.name)}</strong>
        ${category.code ? `<br><small class="muted">${escapeHtml(category.code)}</small>` : ""}
      </td>
      <td>${escapeHtml(categoryBranchesLabel(category))}</td>
      <td><span class="${statusClass(active ? "Activa" : "Inactiva")}">${active ? "Activa" : "Inactiva"}</span></td>
      <td>
        <div class="table-actions">
          <button class="mini-button" type="button" data-edit-category="${category.id}">Editar</button>
          <button class="mini-button" type="button" data-toggle-category="${category.id}">${active ? "Desactivar" : "Activar"}</button>
        </div>
      </td>
    </tr>`;
}

function wireCategories() {
  view.querySelectorAll("[data-category-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      categoryUi.scope = button.dataset.categoryScope;
      const url = new URL(location.href);
      url.searchParams.set("tab", "categorias");
      url.searchParams.set("scope", categoryUi.scope);
      history.replaceState({}, "", url);
      render();
    });
  });

  view.querySelectorAll("[data-new-category]").forEach((button) => {
    button.addEventListener("click", () => openCategoryModal());
  });
  view.querySelectorAll("[data-edit-category]").forEach((button) => {
    button.addEventListener("click", () => openCategoryModal(button.dataset.editCategory));
  });
  view.querySelectorAll("[data-toggle-category]").forEach((button) => {
    button.addEventListener("click", () => toggleCategory(button.dataset.toggleCategory));
  });
  view.querySelectorAll("[data-move-category]").forEach((button) => {
    button.addEventListener("click", () => moveCategory(button.dataset.moveCategory, Number(button.dataset.direction || 0)));
  });
}

function openCategoryModal(categoryId = null) {
  const category = categoryId ? state.categories.find((item) => item.id === categoryId) : null;
  const scope = category?.scope || categoryUi.scope;
  const branchIds = Array.isArray(category?.branchIds) && category.branchIds.length ? category.branchIds : ["ALL"];
  const appliesAll = branchIds.includes("ALL");

  const modal = openModal(`
    <section class="modal admin-cat-modal" role="dialog" aria-modal="true">
      <div class="modal__header">
        <div><p class="eyebrow">Categorías</p><h2>${category ? "Editar categoría" : "Nueva categoría"}</h2></div>
        <button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button>
      </div>
      <form class="form-grid admin-cat-form" data-scoped-category-form>
        <label>Tipo de categoría
          <select name="scope">
            ${CATEGORY_SCOPES.map((item) => `<option value="${item.id}" ${scope === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
          </select>
        </label>
        <label>Nombre *<input name="name" value="${escapeHtml(category?.name || "")}" placeholder="Ej. Cafés" required></label>
        <label>Código <span class="muted">(opcional)</span><input name="code" value="${escapeHtml(category?.code || "")}" placeholder="Ej. CAF"></label>
        <label>Orden<input name="order" type="number" min="0" step="1" value="${Number(category?.order ?? nextCategoryOrder(scope))}"></label>
        <label class="admin-cat-check span-2">
          <input name="allBranches" type="checkbox" value="1" ${appliesAll ? "checked" : ""} data-all-category-branches>
          <span>
            <strong>Disponible en todas las sucursales</strong>
            <small class="muted">Desmarca esta opción únicamente si la categoría pertenece a sedes específicas.</small>
          </span>
        </label>
        <div class="admin-cat-branches span-2" data-category-branches ${appliesAll ? "hidden" : ""}>
          ${activeBranches(state).map((branch) => `
            <label><input type="checkbox" name="branchIds" value="${branch.id}" ${branchIds.includes(branch.id) ? "checked" : ""}><span>${escapeHtml(branch.name)}</span></label>
          `).join("")}
        </div>
        <div class="confirm-actions span-2">
          <button class="button" type="button" data-close-modal>Cancelar</button>
          <button class="button button--primary" type="submit">${category ? "Guardar cambios" : "Crear categoría"}</button>
        </div>
      </form>
    </section>`);

  const form = modal.querySelector("[data-scoped-category-form]");
  const allBranches = modal.querySelector("[data-all-category-branches]");
  const branchBox = modal.querySelector("[data-category-branches]");
  allBranches?.addEventListener("change", () => { if (branchBox) branchBox.hidden = allBranches.checked; });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextScope = String(data.get("scope") || "").trim();
    const name = String(data.get("name") || "").trim();
    if (!name) { showToast("Ingresa el nombre de la categoría."); return; }

    // Se vuelve a buscar por id: saveState reemplaza los objetos del array.
    const current = categoryId ? state.categories.find((item) => item.id === categoryId) : null;
    const duplicate = state.categories.find((item) =>
      item.id !== current?.id && item.scope === nextScope && normalizeText(item.name) === normalizeText(name));
    if (duplicate) { showToast("Ya existe una categoría con ese nombre en este tipo."); return; }

    let selectedBranches = ["ALL"];
    if (data.get("allBranches") !== "1") {
      selectedBranches = data.getAll("branchIds").filter(Boolean);
      if (!selectedBranches.length) { showToast("Selecciona al menos una sucursal o marca 'todas'."); return; }
    }

    const payload = {
      scope: nextScope,
      name,
      code: String(data.get("code") || "").trim().toUpperCase(),
      order: Number(data.get("order") || 0),
      branchIds: selectedBranches,
      updatedAt: new Date().toISOString()
    };

    if (current) {
      Object.assign(current, payload);
    } else {
      state.categories.push({ id: nextId(state, "category", "CAT", 4), ...payload, status: "Activa", createdAt: new Date().toISOString() });
    }

    categoryUi.scope = nextScope;
    addAuditEvent(state, {
      user: session.name,
      action: current ? "Categoría actualizada" : "Categoría creada",
      module: "Administracion",
      detail: `${scopeLabel(nextScope)} · ${name}`
    });
    saveState(state);
    closeModal();
    showToast(current ? "Categoría actualizada." : "Categoría creada.");
    render();
  });
}

async function toggleCategory(categoryId) {
  const category = state.categories.find((item) => item.id === categoryId);
  if (!category) return;
  const active = category.status !== "Inactiva";

  if (active) {
    const ok = await confirmAction({
      title: "Desactivar categoría",
      message: "Los registros históricos conservarán su categoría, pero ya no estará disponible para nuevas asignaciones.",
      label: "Desactivar"
    });
    if (!ok) return;
  }

  const target = state.categories.find((item) => item.id === categoryId);
  if (!target) return;
  target.status = active ? "Inactiva" : "Activa";
  target.updatedAt = new Date().toISOString();
  addAuditEvent(state, {
    user: session.name,
    action: active ? "Categoría desactivada" : "Categoría activada",
    module: "Administracion",
    detail: target.name
  });
  saveState(state);
  showToast(active ? "Categoría desactivada." : "Categoría activada.");
  render();
}

function moveCategory(categoryId, direction) {
  if (!direction) return;
  const list = categoriesByScope(state, categoryUi.scope, { activeOnly: false });
  const index = list.findIndex((category) => category.id === categoryId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return;

  // Se renumera toda la lista y se intercambian las dos posiciones.
  list.forEach((category, position) => { category.order = (position + 1) * 10; });
  const a = list[index];
  const b = list[targetIndex];
  [a.order, b.order] = [b.order, a.order];

  saveState(state);
  render();
}

function scopeLabel(scopeId) {
  return CATEGORY_SCOPES.find((scope) => scope.id === scopeId)?.label || "Categorías";
}

function categoryBranchesLabel(category) {
  const ids = Array.isArray(category.branchIds) ? category.branchIds : ["ALL"];
  if (ids.includes("ALL")) return "Todas las sucursales";
  const names = ids.map((id) => branchById(state, id)?.shortName || branchById(state, id)?.name).filter(Boolean);
  return names.join(", ") || "Sin sucursal";
}

function nextCategoryOrder(scope) {
  const list = categoriesByScope(state, scope, { activeOnly: false });
  if (!list.length) return 10;
  return Math.max(...list.map((category) => Number(category.order || 0))) + 10;
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isDirectPlato(plato) {
  return plato.inventoryMode === "direct" && Boolean(plato.inventoryItemId);
}

// Costo del plato: de su receta, o del insumo si se despacha directo (botellas).
function platoCost(plato) {
  const recipe = recipeOfPlato(plato.id);
  if (recipe) return { cost: recipeCost(recipe), source: "receta", recipe };
  if (isDirectPlato(plato)) {
    const supply = getInventoryItemById(plato.inventoryItemId);
    const cost = Number(supply?.cost || 0);
    // Costo 0 = aun no cargado en Inventario; un margen de 100% seria engañoso.
    return cost > 0 ? { cost, source: "directo", supply } : { cost: null, source: "directo-sin-costo", supply };
  }
  return { cost: null, source: "sin-receta" };
}

function marginOf(price, cost) {
  return price && cost !== null ? ((price - cost) / price) * 100 : null;
}

function isAvailable(plato) {
  return plato.status !== "Inactivo";
}

// La landing solo muestra platos disponibles y marcados para publicar.
function isOnLanding(plato) {
  return isAvailable(plato) && plato.publishLanding !== false;
}

function filteredPlatos() {
  return state.menuItems.filter((plato) => {
    const publish =
      cartaFilters.publish === ALL ||
      (cartaFilters.publish === "En landing" && isOnLanding(plato)) ||
      (cartaFilters.publish === "Solo sistema" && isAvailable(plato) && !isOnLanding(plato)) ||
      (cartaFilters.publish === "No disponible" && !isAvailable(plato));
    return publish &&
      (cartaFilters.category === ALL || plato.category === cartaFilters.category) &&
      (cartaFilters.station === ALL || plato.station === cartaFilters.station) &&
      matchesSearch(cartaFilters.search, plato.name);
  });
}

function cartaRow(plato) {
  const price = Number(plato.price || 0);
  const { cost, source } = platoCost(plato);
  const margin = marginOf(price, cost);
  const costCell = cost === null ? `<span class="carta-warning">${MISSING_COST[source]}</span>` :`<strong>${money(cost)}</strong>${source === "directo" ? '<span class="carta-note">Insumo directo</span>' : ""}`;
  return `<tr>
    <td><strong>${escapeHtml(plato.name)}</strong></td>
    <td>${escapeHtml(plato.category || NO_CATEGORY)}</td>
    <td>${money(price)}</td>
    <td>${costCell}</td>
    <td>${margin === null ? "-" : `${margin.toFixed(1)}%`}</td>
    <td><strong>${isAvailable(plato) ? "Disponible" : "No disponible"}</strong></td>
    <td><strong>${isOnLanding(plato) ? "Publicado" : "Oculto"}</strong></td>
    <td><div class="table-actions"><button class="mini-button" type="button" data-plato-edit="${plato.id}">Editar</button></div></td>
  </tr>`;
}

function cartaRows() {
  if (!state.menuItems.length) return '<tr><td colspan="8" class="muted text-center">La carta no tiene platos.</td></tr>';
  const platos = filteredPlatos();
  if (!platos.length) return '<tr><td colspan="8" class="muted text-center">No hay platos que coincidan con los filtros.</td></tr>';
  return groupedRows(platos, (plato) => plato.category || NO_CATEGORY, cartaRow, 8);
}

function recipeLabel(recipe) {
  return `${recipe.name} · ${money(recipeCost(recipe))}`;
}

function platoRecipeSection(plato) {
  if (plato && isDirectPlato(plato)) {
    const supply = getInventoryItemById(plato.inventoryItemId);
    return `<div class="plato-info span-2"><strong>Despacho directo</strong><p>Al venderse descuenta el insumo <b>${escapeHtml(supply?.item || plato.inventoryItemId)}</b>. No usa receta.</p></div>`;
  }
  const current = plato ? recipeOfPlato(plato.id) : null;
  const recipes = [...state.recipes].sort((a, b) => a.name.localeCompare(b.name));
  return `
    <label class="span-2">Receta vinculada<select name="recipeId" data-plato-recipe>
      <option value="">Sin receta</option>
      ${recipes.map((r) => `<option value="${r.id}" ${current?.id === r.id ? "selected" : ""}>${escapeHtml(recipeLabel(r))}</option>`).join("")}
    </select></label>
    <p class="plato-hint span-2">Los insumos y cantidades se editan en la pestaña Recetas. Una receta puede cubrir varios platos (por ejemplo los métodos de café).</p>`;
}

function openPlatoEditor(id = null) {
  const plato = id ? state.menuItems.find((item) => item.id === id) || null : null;
  const categories = categoryList();
  const station = plato?.station || "Cocina";
  const modalHtml = `
    <section class="modal plato-modal" role="dialog" aria-modal="true" aria-labelledby="plato-title">
      <div class="modal__header"><div><p class="eyebrow">Gestión de carta</p><h2 id="plato-title">${plato ? escapeHtml(plato.name) : "Nuevo plato"}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="plato-form" data-plato-form>
        <fieldset class="plato-section form-grid">
          <legend>Datos de venta</legend>
          <label>Nombre<input name="name" required value="${escapeHtml(plato?.name || "")}" placeholder="Nombre del plato"></label>
          <label>Categoría<select name="category">${categories.map((c) => `<option ${c === (plato?.category || categories[0]) ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}</select></label>
          <label>Precio (S/)<input name="price" type="number" min="0" step="0.01" required value="${plato ? Number(plato.price || 0).toFixed(2) : ""}" placeholder="0.00" data-plato-price></label>
          <label>Estación<select name="station"><option ${station === "Cocina" ? "selected" : ""}>Cocina</option><option ${station === "Barra" ? "selected" : ""}>Barra</option></select></label>
        </fieldset>
        <fieldset class="plato-section form-grid">
          <legend>Receta y costo</legend>
          ${platoRecipeSection(plato)}
          <div class="plato-cost span-2" data-plato-cost></div>
        </fieldset>
        <fieldset class="plato-section form-grid">
          <legend>Publicación</legend>
          <label class="check-inline span-2"><input type="checkbox" name="available" ${!plato || isAvailable(plato) ? "checked" : ""}> Disponible para vender en el sistema</label>
          <label class="check-inline span-2"><input type="checkbox" name="publishLanding" ${!plato || plato.publishLanding !== false ? "checked" : ""}> Mostrar en la landing</label>
          <p class="plato-hint span-2">La landing solo muestra los platos disponibles para vender.</p>
          <label class="span-2">Descripción<textarea class="textarea" name="description" placeholder="Descripción visible en la carta y la landing">${escapeHtml(plato?.description || "")}</textarea></label>
          <div class="plato-photo span-2">
            <span class="plato-photo__label">Fotografía</span>
            <div class="plato-photo__row">
              <div class="plato-photo__preview" data-plato-photo-preview></div>
              <div class="plato-photo__actions">
                <input type="file" accept="image/jpeg,image/png" data-plato-photo hidden>
                <button class="button button--secondary" type="button" data-plato-photo-pick>Adjuntar foto</button>
                <button class="button" type="button" data-plato-photo-remove>Quitar foto</button>
                <p class="plato-hint">JPG o PNG. Se reduce a ${PHOTO_MAX_SIZE} px para guardarla en el navegador.</p>
              </div>
            </div>
          </div>
        </fieldset>
        <div class="confirm-actions"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Guardar plato</button></div>
      </form>
    </section>`;

  const modal = openModal(modalHtml);
  const form = modal.querySelector("[data-plato-form]");
  const costBox = modal.querySelector("[data-plato-cost]");
  const recipeSelect = modal.querySelector("[data-plato-recipe]");

  const paintCost = () => {
    const price = Number(form.elements.price.value || 0);
    let cost = null;
    let missing = "Sin receta: no se puede calcular el costo ni el margen.";
    if (plato && isDirectPlato(plato)) {
      cost = platoCost(plato).cost;
      missing = "El insumo aún no tiene costo cargado en Inventario: no se puede calcular el margen.";
    } else if (recipeSelect?.value) {
      cost = recipeCost(state.recipes.find((r) => r.id === recipeSelect.value));
    }
    const margin = marginOf(price, cost);
    costBox.innerHTML = cost === null
      ? `<span class="carta-warning">${missing}</span>`
      :`<span>Costo <strong>${money(cost)}</strong></span><span>Margen <strong>${margin === null ? "-" : `${margin.toFixed(1)}%`}</strong></span>`;
  };
  paintCost();
  form.elements.price.addEventListener("input", paintCost);
  recipeSelect?.addEventListener("change", paintCost);

  let photo = plato?.image || "";
  const photoInput = modal.querySelector("[data-plato-photo]");
  const photoPreview = modal.querySelector("[data-plato-photo-preview]");
  const removePhotoButton = modal.querySelector("[data-plato-photo-remove]");
  const paintPhoto = () => {
    photoPreview.innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt="Foto del plato">` : "<span>Sin foto</span>";
    removePhotoButton.hidden = !photo;
  };
  paintPhoto();
  modal.querySelector("[data-plato-photo-pick]").addEventListener("click", () => photoInput.click());
  removePhotoButton.addEventListener("click", () => { photo = ""; paintPhoto(); });
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files[0];
    photoInput.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) { showToast("La foto debe ser JPG o PNG."); return; }
    try {
      photo = await compressPhoto(file);
      paintPhoto();
    } catch {
      showToast("No se pudo leer la imagen. Prueba con otro archivo.");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const name = String(data.name || "").trim();
    if (!name) { showToast("Escribe el nombre del plato."); return; }

    const fields = {
      name,
      category: String(data.category || categories[0]),
      price: Number(data.price || 0),
      station: data.station === "Barra" ? "Barra" : "Cocina",
      status: data.available ? "Activo" : "Inactivo",
      publishLanding: Boolean(data.publishLanding),
      description: String(data.description || "").trim(),
      image: photo
    };
    const previousImage = plato?.image || "";
    fields.dispatchStation = fields.station;

    let target = plato;
    if (target) {
      Object.assign(target, fields);
    } else {
      target = {
        id: nextId(state, "menuItem", "PRD", 4),
        ...fields,
        channel: "Local", descriptionEn: "",
        operationType: "preparation", requiresPreparation: true,
        inventoryMode: "none", editUntil: "Nuevo", estimatedTime: 10,
        dietary: [], modifiers: [], branchIds: ["ALL"]
      };
      state.menuItems.push(target);
    }

    if (!isDirectPlato(target)) {
      linkRecipe(target.id, String(data.recipeId || ""));
      target.inventoryMode = recipeOfPlato(target.id) ? "recipe" : "none";
    }

    addAuditEvent(state, {
      user: session.name,
      action: plato ? "Plato actualizado" : "Plato creado",
      module: "Administracion",
      detail: `${target.name} · ${isAvailable(target) ? "Disponible" : "No disponible"} · Landing: ${isOnLanding(target) ? "publicado" : "oculto"}`
    });
    // localStorage lleno: se guarda el plato sin la foto nueva.
    if (!saveState(state)) {
      target.image = previousImage;
      saveState(state);
      showToast("La foto no cabe en el almacenamiento del navegador. El plato se guardó sin cambiar la foto.");
    } else {
      showToast(plato ? "Plato actualizado." : "Plato creado en la carta.");
    }
    closeModal();
    render();
  });
}

// Sin backend la foto se guarda como data URL en localStorage (~5 MB en total):
// se reduce y se pasa a JPEG para que cada foto pese decenas de KB.
function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, PHOTO_MAX_SIZE / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // fondo para PNG con transparencia
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen invalida")); };
    img.src = url;
  });
}

// Un plato tiene como maximo una receta; una receta puede cubrir varios platos.
function linkRecipe(platoId, recipeId) {
  state.recipes.forEach((recipe) => {
    const ids = recipePlatoIds(recipe);
    if (!ids.includes(platoId) || recipe.id === recipeId) return;
    const rest = ids.filter((id) => id !== platoId);
    recipe.productIds = rest;
    recipe.productId = rest[0] || "";
  });

  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;
  const ids = recipePlatoIds(recipe);
  if (!ids.includes(platoId)) ids.push(platoId);
  recipe.productIds = ids;
  recipe.productId = recipe.productId || platoId;
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

function recipeRow(recipe) {
  const product = state.menuItems.find((item) => item.id === recipe.productId) || { price: 0 };
  const cost = recipeCost(recipe);
  const salePrice = Number(product.price || 0);
  const margin = salePrice ? ((salePrice - cost) / salePrice) * 100 : 0;
  return `<tr>
    <td><div class="recipe-name-cell"><strong>${escapeHtml(recipe.name)}</strong><span class="${statusClass(recipe.status || "Activa")}">${recipe.status || "Activa"}</span></div></td>
    <td>${escapeHtml(recipe.station || "Barra")}</td>
    <td>${escapeHtml(recipeCategory(recipe))}</td>
    <td><strong>${money(cost)}</strong></td>
    <td>${money(salePrice)}</td>
    <td>${margin.toFixed(1)}%</td>
    <td>${recipe.expectedWastePct || 0}%</td>
    <td><div class="table-actions"><button class="mini-button" type="button" data-recipe-view="${recipe.id}">Ver</button><button class="mini-button" type="button" data-recipe-edit="${recipe.id}">Editar</button></div></td>
  </tr>`;
}

function recipeRows() {
  if (!state.recipes.length) return '<tr><td colspan="8" class="muted text-center">Sin recetas registradas.</td></tr>';
  const recipes = filteredRecipes();
  if (!recipes.length) return '<tr><td colspan="8" class="muted text-center">No hay recetas que coincidan con los filtros.</td></tr>';
  return groupedRows(recipes, recipeCategory, recipeRow, 8);
}

// Filas agrupadas por categoria, en el orden de la lista unica de categorias.
function groupedRows(records, categoryOf, rowOf, columns) {
  const groups = new Map();
  records.forEach((record) => {
    const category = categoryOf(record);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(record);
  });
  return categoriesInUse([...groups.keys()]).filter((category) => groups.has(category)).map((category) => {
    const items = groups.get(category).sort((a, b) => a.name.localeCompare(b.name));
    return `<tr class="table-group-row"><td colspan="${columns}">${escapeHtml(category)} <span>${items.length}</span></td></tr>${items.map(rowOf).join("")}`;
  }).join("");
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
    <section class="modal recipe-view-modal" role="dialog" aria-modal="true">
      <div class="modal__header"><div><p class="eyebrow">Receta</p><h2>${escapeHtml(recipe.name)}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div style="padding:20px;">
        <p class="muted">${escapeHtml(product?.name || recipe.name)} · ${escapeHtml(recipe.station || "Barra")} · ${recipe.targetMinutes || 0} min</p>
        <div class="table-wrap"><table class="data-table recipe-view-table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo</th></tr></thead><tbody>${rows}</tbody></table></div>
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
    <section class="modal recipe-edit-modal" role="dialog" aria-modal="true">
      <div class="modal__header"><div><p class="eyebrow">Recetas</p><h2>${recipe ? "Editar receta" : "Nueva receta"}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid recipe-edit-form" data-recipe-form>
        <label>Producto<select name="productId">${state.menuItems.map((item) => `<option value="${item.id}" ${item.id === selectedProduct ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label>Estación<select name="station"><option ${selectedStation === "Barra" ? "selected" : ""}>Barra</option><option ${selectedStation === "Cocina" ? "selected" : ""}>Cocina</option></select></label>        <label>Rendimiento<input name="yieldQty" type="number" min="1" step="1" value="${recipe?.yieldQty || 1}"></label>
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
    linkRecipe(productId, payload.id);
    saveState(state);
    closeModal();
    showToast(recipe ? "Receta actualizada." : "Receta creada.");
    render();
  });
}

// La bitacora se arma con los eventos reales que registra addAuditEvent().
function auditDate(event) {
  if (!event.at) return "—";
  const date = new Date(event.at);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function auditTable() {
  const events = state.auditEvents || [];

  if (!events.length) {
    return '<p class="muted">Aun no hay movimientos registrados. Las acciones sensibles del sistema apareceran aqui.</p>';
  }

  const pages = Math.max(1, Math.ceil(events.length / HISTORY_PAGE_SIZE));
  historyUi.page = Math.min(Math.max(1, historyUi.page), pages);
  const start = (historyUi.page - 1) * HISTORY_PAGE_SIZE;
  const rows = events.slice(start, start + HISTORY_PAGE_SIZE);

  return `
    <div class="table-wrap">
      <table class="data-table admin-history-table">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Detalle</th></tr></thead>
        <tbody>
          ${rows.map((event) => `
            <tr>
              <td>${auditDate(event)}</td>
              <td>${escapeHtml(event.time || String(event.at || "").slice(11, 16) || "--:--")}</td>
              <td><strong>${escapeHtml(event.user || "Sistema")}</strong></td>
              <td>${escapeHtml(event.action || "")}</td>
              <td>${escapeHtml(event.module || "")}</td>
              <td>${escapeHtml(event.detail || "—")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${historyPager(events.length, pages, start, rows.length)}`;
}

// Numeros de pagina visibles: primera, ultima y las vecinas de la actual.
function historyPageNumbers(current, pages) {
  const nums = [...new Set([1, pages, current - 1, current, current + 1])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, index) => {
    if (index && n - nums[index - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function historyPager(total, pages, start, shown) {
  const page = historyUi.page;
  return `
    <nav class="admin-pager" aria-label="Paginación del historial">
      <span class="admin-pager__info">Mostrando ${start + 1}–${start + shown} de ${total}</span>
      <div class="admin-pager__buttons">
        <button type="button" data-history-page="${page - 1}" ${page === 1 ? "disabled" : ""} aria-label="Página anterior">‹ Anterior</button>
        ${historyPageNumbers(page, pages).map((n) => n === "…"
          ? '<span class="admin-pager__gap">…</span>'
          : `<button type="button" class="${n === page ? "is-active" : ""}" data-history-page="${n}" ${n === page ? 'aria-current="page"' : ""}>${n}</button>`).join("")}
        <button type="button" data-history-page="${page + 1}" ${page === pages ? "disabled" : ""} aria-label="Página siguiente">Siguiente ›</button>
      </div>
    </nav>`;
}

/* ==========================================================================
   TRAZABILIDAD - FICHA DE LOTE
   El formulario cubre todos los campos que muestra la landing publica, para
   que lo que se carga aqui sea exactamente lo que ve el cliente al escanear
   el QR. Los pasos del recorrido son una lista editable.
   ========================================================================== */

function loteEnEdicion() {
  return loteUi.editandoId
    ? state.coffeeLots.find((lot) => lot.id === loteUi.editandoId) || null
    : null;
}

function pasosDelFormulario() {
  const lote = loteEnEdicion();
  if (loteUi.pasos.length) return loteUi.pasos;
  if (lote?.steps?.length) return lote.steps.map((paso) => ({ ...paso }));
  return [{ title: "", date: "", text: "" }];
}

function coffeeLotForm() {
  const lote = { ...(loteEnEdicion() || {}), ...(loteUi.borrador || {}) };
  const editando = Boolean(loteEnEdicion());
  const v = (campo, porDefecto = "") => escapeHtml(String(lote?.[campo] ?? porDefecto));
  const pasos = pasosDelFormulario();

  return `
    <form class="form-grid lot-form" data-lot-form>
      <div class="span-2 lot-form__section">
        <strong>Producto</strong>
        <small>Lo que se ve primero en la ficha publica del lote.</small>
      </div>

      <label>Codigo publico *
        <input name="code" required value="${v("code")}" placeholder="Caficultores_Valle_Huayabamba">
        <small class="muted">Es lo que se escribe en el buscador y lo que lleva el QR.</small>
      </label>
      <label>Codigo de lote *
        <input name="lotCode" required value="${v("lotCode")}" placeholder="AMZ-2608-01">
      </label>
      <label>Nombre del producto *
        <input name="name" required value="${v("name")}" placeholder="Caficultores del Valle del Huayabamba">
      </label>
      <label>Tipo
        <input name="type" value="${v("type", "Granos de cafe de especialidad")}">
      </label>
      <label class="span-2">Descripcion
        <textarea class="textarea" name="description" placeholder="Como se usa este lote en la barra">${v("description")}</textarea>
      </label>

      <div class="span-2 lot-form__section">
        <strong>Origen</strong>
        <small>De donde viene el cafe y quien lo produce.</small>
      </div>

      <label>Region
        <input name="region" value="${v("region")}" placeholder="Andes orientales de Peru">
      </label>
      <label>Valle
        <input name="valley" value="${v("valley")}" placeholder="Valle del Huayabamba, Amazonas">
      </label>
      <label>Altitud
        <input name="altitude" value="${v("altitude")}" placeholder="1200-1800 m s. n. m.">
      </label>
      <label>Productor
        <input name="producer" value="${v("producer")}" placeholder="Nombre de la asociacion o productor">
      </label>

      <div class="span-2 lot-form__section">
        <strong>Proceso</strong>
      </div>

      <label>Variedad
        <input name="variety" value="${v("variety")}" placeholder="Caturra, Typica...">
      </label>
      <label>Tostado
        <input name="roast" value="${v("roast")}" placeholder="Medio, artesanal">
      </label>
      <label>Fecha de recepcion
        <input name="received" type="date" value="${v("received")}">
      </label>
      <label>Fecha de tostado
        <input name="roastedAt" type="date" value="${v("roastedAt")}">
      </label>
      <label>Stock
        <input name="stock" type="number" min="0" step="0.01" value="${Number(lote?.stock ?? 0)}">
      </label>
      <label>Unidad
        <input name="unit" value="${v("unit", "kg")}">
      </label>

      <div class="span-2 lot-form__section">
        <strong>Contenido de la ficha publica</strong>
      </div>

      <label>Imagen del producto
        <input name="image" value="${v("image")}" placeholder="../assets/img/site/hero-3.webp">
      </label>
      <label>Imagen del productor
        <input name="producerImage" value="${v("producerImage")}" placeholder="../assets/img/menu-cafe.jpg">
      </label>
      <label class="span-2">Preparaciones
        <input name="preparations" value="${escapeHtml((lote?.preparations || []).join(", "))}" placeholder="Espresso, V60, Chemex">
        <small class="muted">Separadas por comas.</small>
      </label>
      <label class="span-2">Recomendaciones de almacenamiento
        <textarea class="textarea" name="storage" placeholder="Conservar en envase hermetico, fresco y seco">${v("storage")}</textarea>
      </label>

      <div class="span-2 lot-form__section lot-form__section--row">
        <div>
          <strong>Recorrido del cafe</strong>
          <small>Los pasos que se muestran en la linea de tiempo de la ficha.</small>
        </div>
        <button class="mini-button" type="button" data-lot-add-step>Agregar paso</button>
      </div>

      <div class="span-2 lot-steps" data-lot-steps>
        ${pasos.map(pasoHtml).join("")}
      </div>

      <label class="span-2 check-inline">
        <input type="checkbox" name="publishWeb" ${lote.publishWeb === false ? "" : "checked"}>
        Publicar en la web
      </label>

      <label class="span-2">Notas internas
        <textarea class="textarea" name="notes" placeholder="Proceso, perfil de taza, observaciones">${v("notes")}</textarea>
      </label>

      <div class="span-2 lot-form__actions">
        <button class="button button--primary" type="submit">
          ${editando ? "Guardar cambios" : "Registrar lote"}
        </button>
        ${editando ? '<button class="mini-button" type="button" data-lot-cancel>Cancelar</button>' : ""}
      </div>
    </form>`;
}

function pasoHtml(paso, indice) {
  return `
    <div class="lot-step" data-lot-step="${indice}">
      <span class="lot-step__num">${String(indice + 1).padStart(2, "0")}</span>
      <input data-step-title placeholder="Titulo (Cultivo, Cosecha...)" value="${escapeHtml(paso.title || "")}">
      <input data-step-date type="date" value="${escapeHtml(paso.date || "")}" title="Fecha (opcional)">
      <input data-step-text placeholder="Que pasa en este paso" value="${escapeHtml(paso.text || "")}">
      <button class="mini-button mini-button--danger" type="button" data-step-remove="${indice}" aria-label="Quitar paso">✕</button>
    </div>`;
}

// Guarda lo escrito en el formulario antes de repintarlo.
function guardarBorradorDeLote() {
  const formulario = view.querySelector("[data-lot-form]");
  if (!formulario) return;

  const datos = Object.fromEntries(new FormData(formulario));
  loteUi.borrador = {
    ...datos,
    stock: Number(datos.stock || 0),
    publishWeb: !!datos.publishWeb,
    preparations: String(datos.preparations || "").split(",").map((t) => t.trim()).filter(Boolean)
  };
  loteUi.pasos = leerPasosDelDom({ conservarVacios: true });
}

function leerPasosDelDom({ conservarVacios = false } = {}) {
  return [...view.querySelectorAll("[data-lot-step]")]
    .map((fila) => ({
      title: fila.querySelector("[data-step-title]").value.trim(),
      date: fila.querySelector("[data-step-date]").value,
      text: fila.querySelector("[data-step-text]").value.trim()
    }))
    .filter((paso) => conservarVacios || paso.title || paso.text);
}

/* ==========================================================================
   TRAZABILIDAD - PAGINAS PUBLICADAS
   Cada lote con publishWeb activo es una pagina en landing-lote.html?codigo=.
   Desde aqui se ven todas, se abren, se editan y se publican o retiran.
   ========================================================================== */

function traceSubtabs() {
  return `
    <nav class="panel admin-subtabs" aria-label="Trazabilidad">
      <button class="admin-subtab ${traceUi.vista === "lotes" ? "is-active" : ""}" type="button" data-trace-vista="lotes">
        Registro de lotes
      </button>
      <button class="admin-subtab ${traceUi.vista === "paginas" ? "is-active" : ""}" type="button" data-trace-vista="paginas">
        Páginas publicadas
      </button>
    </nav>`;
}

function setTraceVista(vista) {
  traceUi.vista = vista;
  const url = new URL(location.href);
  url.searchParams.set("tab", "trazabilidad");
  url.searchParams.set("vista", vista);
  history.replaceState({}, "", url);
  render();
}

function isLotPublished(lot) {
  return lot.publishWeb !== false;
}

function lotPageUrl(lot) {
  return `landing-lote.html?codigo=${encodeURIComponent(lot.code || lot.lotCode || lot.id)}`;
}

function formatLotDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function publishedPages() {
  const publicadas = state.coffeeLots.filter(isLotPublished);
  const sinPublicar = state.coffeeLots.filter((lot) => !isLotPublished(lot));
  const lista = traceUi.filtro === "publicadas" ? publicadas : sinPublicar;

  return `
    <section class="panel admin-pages">
      <div class="panel__header panel__header--wrap">
        <h2>Páginas de trazabilidad</h2>
        <a class="button button--secondary" href="landing-trazabilidad.html" target="_blank" rel="noopener">Ver listado público</a>
      </div>
      <p class="muted admin-cat-note">Cada lote publicado tiene su propia página en la web. Retirar una página no borra el lote: solo deja de mostrarse.</p>

      <div class="admin-pages__filters" role="group" aria-label="Filtrar páginas">
        <button class="admin-subtab ${traceUi.filtro === "publicadas" ? "is-active" : ""}" type="button" data-pages-filter="publicadas">En la web</button>
        <button class="admin-subtab ${traceUi.filtro === "sin-publicar" ? "is-active" : ""}" type="button" data-pages-filter="sin-publicar">Sin publicar</button>
      </div>

      ${lista.length ? `
        <div class="table-wrap">
          <table class="data-table admin-pages-table">
            <thead>
              <tr><th>Lote</th><th>Origen</th><th>Contenido</th><th>Actualizado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              ${lista.map(publishedPageRow).join("")}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="admin-cat-empty">
          <strong>${traceUi.filtro === "publicadas" ? "No hay páginas publicadas" : "Todos los lotes están publicados"}</strong>
          <p>${traceUi.filtro === "publicadas" ? "Publica un lote para que aparezca en la web." : "No hay lotes retirados de la web."}</p>
        </div>
      `}
    </section>`;
}

function publishedPageRow(lot) {
  const faltantes = [
    !lot.image && "imagen",
    !lot.description && "descripción",
    !(lot.steps || []).length && "recorrido"
  ].filter(Boolean);

  return `
    <tr>
      <td>
        <strong>${escapeHtml(lot.name || lot.lotCode || lot.code)}</strong>
        <br><small class="muted">${escapeHtml(lot.lotCode || lot.code || "")}</small>
      </td>
      <td>${escapeHtml([lot.valley || lot.origin, lot.region].filter(Boolean).join(", ") || "Sin origen")}</td>
      <td>
        ${(lot.steps || []).length} pasos
        ${faltantes.length ? `<br><small class="admin-pages__warn">Falta: ${escapeHtml(faltantes.join(", "))}</small>` : ""}
      </td>
      <td>${formatLotDate(lot.updatedAt)}</td>
      <td>
        <button
          class="icon-button admin-row-menu__trigger"
          type="button"
          data-lot-menu="${escapeHtml(lot.id)}"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-label="Acciones de ${escapeHtml(lot.name || lot.lotCode || lot.code)}"
        >⋯</button>
      </td>
    </tr>`;
}

function wirePublishedPages() {
  view.querySelectorAll("[data-trace-vista]").forEach((boton) => {
    boton.addEventListener("click", () => setTraceVista(boton.dataset.traceVista));
  });

  view.querySelectorAll("[data-pages-filter]").forEach((boton) => {
    boton.addEventListener("click", () => {
      traceUi.filtro = boton.dataset.pagesFilter;
      render();
    });
  });

  view.querySelectorAll("[data-lot-menu]").forEach((boton) => {
    boton.addEventListener("click", (event) => {
      event.stopPropagation();
      const abierto = boton.getAttribute("aria-expanded") === "true";
      closeLotMenu();
      if (!abierto) openLotMenu(boton);
    });
  });
}

/* Menu de acciones de una pagina. Se pinta en <body> con position: fixed para
   que el scroll horizontal de la tabla no lo recorte. */
function openLotMenu(boton) {
  const id = boton.dataset.lotMenu;
  const lot = state.coffeeLots.find((item) => item.id === id);
  if (!lot) return;
  const publicado = isLotPublished(lot);

  const menu = document.createElement("div");
  menu.className = "admin-row-menu";
  menu.setAttribute("role", "menu");
  menu.innerHTML = `
    ${publicado ? `<a role="menuitem" href="${lotPageUrl(lot)}" target="_blank" rel="noopener" data-menu-action="ver">Ver página</a>` : ""}
    <button role="menuitem" type="button" data-menu-action="copiar">Copiar enlace</button>
    <button role="menuitem" type="button" data-menu-action="editar">Editar</button>
    ${publicado
      ? `<button role="menuitem" type="button" class="is-danger" data-menu-action="eliminar">Eliminar</button>`
      : `<button role="menuitem" type="button" data-menu-action="publicar">Publicar</button>`}
  `;
  document.body.appendChild(menu);

  const rect = boton.getBoundingClientRect();
  const ancho = menu.offsetWidth;
  const alto = menu.offsetHeight;
  const abajo = rect.bottom + 6 + alto <= window.innerHeight;
  menu.style.top = `${abajo ? rect.bottom + 6 : rect.top - alto - 6}px`;
  menu.style.left = `${Math.max(8, rect.right - ancho)}px`;
  boton.setAttribute("aria-expanded", "true");

  menu.addEventListener("click", (event) => {
    const item = event.target.closest("[data-menu-action]");
    if (!item) return;
    const accion = item.dataset.menuAction;
    closeLotMenu();
    if (accion === "copiar") copyLotLink(id);
    if (accion === "editar") editLot(id);
    if (accion === "eliminar") setLotPublished(id, false);
    if (accion === "publicar") setLotPublished(id, true);
  });

  menu.querySelector("[role='menuitem']")?.focus();
  setTimeout(() => {
    document.addEventListener("click", closeLotMenu);
    document.addEventListener("keydown", closeLotMenuOnEscape);
    window.addEventListener("scroll", closeLotMenu, true);
    window.addEventListener("resize", closeLotMenu);
  });
}

function closeLotMenu() {
  document.querySelectorAll(".admin-row-menu").forEach((menu) => menu.remove());
  view.querySelectorAll("[data-lot-menu][aria-expanded='true']").forEach((boton) => boton.setAttribute("aria-expanded", "false"));
  document.removeEventListener("click", closeLotMenu);
  document.removeEventListener("keydown", closeLotMenuOnEscape);
  window.removeEventListener("scroll", closeLotMenu, true);
  window.removeEventListener("resize", closeLotMenu);
}

function closeLotMenuOnEscape(event) {
  if (event.key === "Escape") closeLotMenu();
}

async function copyLotLink(id) {
  const lot = state.coffeeLots.find((item) => item.id === id);
  if (!lot) return;
  const enlace = new URL(lotPageUrl(lot), location.href).href;
  try {
    await navigator.clipboard.writeText(enlace);
    showToast("Enlace copiado.");
  } catch {
    showToast(enlace);
  }
}

function editLot(id) {
  loteUi.editandoId = id;
  loteUi.pasos = [];
  loteUi.borrador = null;
  setTraceVista("lotes");
  view.querySelector("[data-lot-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// "Eliminar" retira la pagina de la web; el lote y su ficha se conservan
// (los registros con historial no se borran).
async function setLotPublished(id, publicar) {
  if (!publicar) {
    const ok = await confirmAction({
      title: "Eliminar página",
      message: "La página del lote deja de mostrarse en la web. El lote y su ficha se conservan y puedes volver a publicarla desde \"Sin publicar\".",
      label: "Eliminar"
    });
    if (!ok) return;
  }

  // Se vuelve a buscar por id: saveState reemplaza los objetos del array.
  const target = state.coffeeLots.find((item) => item.id === id);
  if (!target) return;
  target.publishWeb = publicar;
  target.updatedAt = new Date().toISOString();
  addAuditEvent(state, {
    user: session.name,
    action: publicar ? "Página de lote publicada" : "Página de lote eliminada de la web",
    module: "Administracion",
    detail: target.lotCode || target.code
  });
  saveState(state);
  showToast(publicar ? "Página publicada." : "Página eliminada de la web.");
  render();
}

function coffeeLots() {
  if (!state.coffeeLots.length) {
    return '<p class="muted">Aun no hay lotes registrados.</p>';
  }

  return state.coffeeLots.map((lot) => `
    <article class="trace-card">
      <div class="trace-card__head">
        <strong>${escapeHtml(lot.lotCode || lot.code)}</strong>
        <span class="${lot.publishWeb === false ? "status" : "status status--ok"}">
          ${lot.publishWeb === false ? "Sin publicar" : "En la web"}
        </span>
      </div>
      <p><strong>${escapeHtml(lot.name || lot.producer || "")}</strong></p>
      <p class="muted">${escapeHtml(lot.valley || lot.origin || "Sin origen")}${lot.variety ? ` · ${escapeHtml(lot.variety)}` : ""}${lot.roast ? ` · Tostado ${escapeHtml(lot.roast)}` : ""}</p>
      <p class="muted">${Number(lot.stock || 0)} ${escapeHtml(lot.unit || "kg")} · ${(lot.steps || []).length} pasos de recorrido</p>
      <div class="trace-card__actions">
        <button class="mini-button" type="button" data-lot-edit="${escapeHtml(lot.id)}">Editar</button>
        <a class="mini-button" href="landing-lote.html?codigo=${encodeURIComponent(lot.code || lot.lotCode)}" target="_blank" rel="noopener">Ver en la web</a>
      </div>
    </article>`).join("");
}

function wireRecipeRows(root) {
  root.querySelectorAll("[data-recipe-view]").forEach((b) => b.addEventListener("click", () => openRecipeView(b.dataset.recipeView)));
  root.querySelectorAll("[data-recipe-edit]").forEach((b) => b.addEventListener("click", () => openRecipeEditor(b.dataset.recipeEdit)));
}

function refreshRecipeTable() {
  const body = view.querySelector("[data-recipe-body]");
  if (!body) return;
  body.innerHTML = recipeRows();
  wireRecipeRows(body);
  const count = view.querySelector("[data-recipe-count]");
  if (count) count.textContent = filteredRecipes().length;
}

function wirePlatoRows(root) {
  root.querySelectorAll("[data-plato-edit]").forEach((b) => b.addEventListener("click", () => openPlatoEditor(b.dataset.platoEdit)));
}

function refreshCartaTable() {
  const body = view.querySelector("[data-carta-body]");
  if (!body) return;
  body.innerHTML = cartaRows();
  wirePlatoRows(body);
  const count = view.querySelector("[data-carta-count]");
  if (count) count.textContent = filteredPlatos().length;
}

function wire() {
  view.querySelectorAll("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      activeAdminTab = button.dataset.adminTab;
      const url = new URL(location.href);
      url.searchParams.set("tab", activeAdminTab);
      if (activeAdminTab !== "categorias") url.searchParams.delete("scope");
      if (activeAdminTab !== "trazabilidad") url.searchParams.delete("vista");
      history.replaceState({}, "", url);
      render();
    });
  });

  view.querySelector("[data-new-plato]")?.addEventListener("click", () => openPlatoEditor());
  wirePlatoRows(view);
  view.querySelector("[data-carta-search]")?.addEventListener("input", (event) => { cartaFilters.search = event.target.value; refreshCartaTable(); });
  view.querySelector("[data-carta-category]")?.addEventListener("change", (event) => { cartaFilters.category = event.target.value; refreshCartaTable(); });
  view.querySelector("[data-carta-station]")?.addEventListener("change", (event) => { cartaFilters.station = event.target.value; refreshCartaTable(); });
  view.querySelector("[data-carta-publish]")?.addEventListener("change", (event) => { cartaFilters.publish = event.target.value; refreshCartaTable(); });

  const newRecipeButton = view.querySelector("[data-new-recipe]");
  newRecipeButton?.addEventListener("click", () => openRecipeEditor());

  wireRecipeRows(view);

  // Filtros en vivo: solo se repinta la tabla para no perder el foco del buscador.
  view.querySelector("[data-recipe-search]")?.addEventListener("input", (event) => { recipeFilters.search = event.target.value; refreshRecipeTable(); });
  view.querySelector("[data-recipe-station]")?.addEventListener("change", (event) => { recipeFilters.station = event.target.value; refreshRecipeTable(); });
  view.querySelector("[data-recipe-category]")?.addEventListener("change", (event) => { recipeFilters.category = event.target.value; refreshRecipeTable(); });

  const categoryForm = view.querySelector("[data-category-form]");
  categoryForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const c = String(new FormData(event.target).get("category") || "").trim();
    if (!c || state.menuCategories.includes(c)) { showToast("La categoria ya existe o esta vacia."); return; }
    state.menuCategories.push(c); saveState(state); showToast("Categoria agregada."); render();
  });
  wireCategories();
  const lotForm = view.querySelector("[data-lot-form]");
  lotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    const editando = loteEnEdicion();

    const ficha = {
      code: String(d.code || "").trim(),
      lotCode: String(d.lotCode || "").trim(),
      name: String(d.name || "").trim(),
      type: String(d.type || "").trim(),
      description: String(d.description || "").trim(),
      region: String(d.region || "").trim(),
      valley: String(d.valley || "").trim(),
      altitude: String(d.altitude || "").trim(),
      producer: String(d.producer || "").trim(),
      variety: String(d.variety || "").trim(),
      roast: String(d.roast || "").trim(),
      received: d.received || "",
      roastedAt: d.roastedAt || "",
      stock: Number(d.stock || 0),
      unit: String(d.unit || "kg").trim(),
      image: String(d.image || "").trim(),
      producerImage: String(d.producerImage || "").trim(),
      preparations: String(d.preparations || "")
        .split(",")
        .map((texto) => texto.trim())
        .filter(Boolean),
      storage: String(d.storage || "").trim(),
      steps: leerPasosDelDom(),
      updatedAt: new Date().toISOString(),
      publishWeb: !!d.publishWeb,
      notes: String(d.notes || "").trim()
    };

    if (editando) {
      Object.assign(editando, ficha);
    } else {
      state.coffeeLots.unshift({
        id: nextId(state, "coffeeLot", "LOT-CAF", 3),
        status: "Activo",
        ...ficha
      });
    }

    addAuditEvent(state, {
      user: session.name,
      action: editando ? "Lote de cafe actualizado" : "Lote de cafe registrado",
      module: "Administracion",
      detail: `${ficha.lotCode || ficha.code}${ficha.publishWeb ? " · publicado en la web" : ""}`
    });

    loteUi.editandoId = null;
    loteUi.pasos = [];
    loteUi.borrador = null;
    saveState(state);
    showToast(editando ? "Lote actualizado." : "Lote de café registrado correctamente.");
    render();
  });

  // Lista editable de pasos del recorrido.
  view.querySelector("[data-lot-add-step]")?.addEventListener("click", () => {
    guardarBorradorDeLote();
    loteUi.pasos = [...loteUi.pasos, { title: "", date: "", text: "" }];
    render();
  });

  view.querySelectorAll("[data-step-remove]").forEach((boton) => {
    boton.addEventListener("click", () => {
      guardarBorradorDeLote();
      const indice = Number(boton.dataset.stepRemove);
      const pasos = loteUi.pasos.filter((_, i) => i !== indice);
      loteUi.pasos = pasos.length ? pasos : [{ title: "", date: "", text: "" }];
      render();
    });
  });

  view.querySelectorAll("[data-lot-edit]").forEach((boton) => {
    boton.addEventListener("click", () => editLot(boton.dataset.lotEdit));
  });

  wirePublishedPages();

  view.querySelectorAll("[data-history-page]").forEach((boton) => {
    boton.addEventListener("click", () => {
      historyUi.page = Number(boton.dataset.historyPage);
      render();
      view.querySelector(".admin-history")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  view.querySelector("[data-lot-cancel]")?.addEventListener("click", () => {
    loteUi.editandoId = null;
    loteUi.pasos = [];
    loteUi.borrador = null;
    render();
  });
}
