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

if (session && canAccess(session.role, "admin")) {
  renderSidebar("admin", session.role);
  renderTopbar({ title: "Administracion", eyebrow: "Modulo", showSearch: false });
  render();
}

function render() {
  view.innerHTML = `
    <div class="view-stack admin-view">
      <section class="grid grid--2">
        <article class="panel">
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
        </article>
        <article class="panel category-panel">
          <div class="panel__header"><h2>Categorias</h2><span class="status status--info">${state.menuCategories.length - 1}</span></div>
          <form class="category-form" data-category-form><label>Nueva categoria<input name="category" required placeholder="Nombre de categoria"></label><button class="button button--secondary" type="submit">Agregar categoria</button></form>
          <div class="category-list">${state.menuCategories.filter((c) => c !== "Todos").map((c) => `<span class="category-pill">${escapeHtml(c)}</span>`).join("")}</div>
        </article>
      </section>

      <section class="panel">
        <div class="panel__header panel__header--wrap"><h2>Recetas y costos</h2><span class="status">Costo de elaboracion</span></div>
        <p class="muted" style="margin-bottom:12px;">Define los insumos y el costo de fabricacion de cada plato para calcular la utilidad real.</p>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Plato</th><th>Precio</th><th>Costo elaboracion</th><th>Margen</th><th>Insumos</th><th>Accion</th></tr></thead><tbody>${recipeRows()}</tbody></table></div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2>Lote y trazabilidad de cafe</h2><span class="status status--ok">Farm-to-Cup</span></div>
        <p class="muted" style="margin-bottom:14px;">Registro de lotes y su trazabilidad. Gestionado por Administracion.</p>
        ${coffeeLotForm()}
        <div class="traceability-list" style="margin-top:18px;">${coffeeLots()}</div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2>Usuarios y roles</h2><span class="status status--ok">Activo</span></div>
        ${userEditor()}
      </section>

      <section class="panel">
        <div class="panel__header"><h2>Bitacora</h2><span class="status">Auditoria</span></div>
        <div class="timeline">${auditEvents.map((e) => `<div class="timeline-item"><time>${e.time}</time><p><strong>${e.user}</strong><br><span class="muted">${e.action} · ${e.module}</span></p></div>`).join("")}</div>
      </section>
    </div>`;
  wire();
}

function coffeeLotForm() {
  return `<form class="form-grid" data-lot-form><label>Codigo de lote<input name="code" required placeholder="AMZ-2607-02"></label><label>Origen<input name="origin" required placeholder="Provincia / finca"></label><label>Productor<input name="producer" required placeholder="Nombre del productor"></label><label>Variedad<input name="variety" required placeholder="Typica, Caturra..."></label><label>Tostado<select name="roast"><option>Ligero</option><option>Media</option><option>Oscuro</option></select></label><label>Recepcion<input name="received" type="date" required></label><label>Cantidad<input name="stock" type="number" min="0.01" step="0.01" required></label><label>Unidad<input name="unit" value="kg" required></label><label class="span-2">Notas de trazabilidad<textarea class="textarea" name="notes" placeholder="Finca, altura, proceso, perfil de taza"></textarea></label><button class="button button--primary" type="submit">Guardar lote</button></form>`;
}

function coffeeLots() {
  return state.coffeeLots.map((lot) => `<article class="trace-card"><div class="trace-card__head"><strong>${escapeHtml(lot.code)}</strong><span class="status status--info">${lot.stock} ${lot.unit}</span></div><p><strong>${escapeHtml(lot.origin)}</strong> · ${escapeHtml(lot.producer)}</p><p class="muted">${escapeHtml(lot.variety)} · Tostado ${lot.roast} · Recibido ${lot.received}</p><p class="muted">${escapeHtml(lot.notes || "Sin notas adicionales")}</p></article>`).join("");
}

function recipeRows() {
  return state.menuItems.map((m) => {
    const cost = m.recipe?.cost || 0;
    const ing = m.recipe?.ingredients?.length || 0;
    return `<tr><td><strong>${escapeHtml(m.name)}</strong>${m.publishLanding ? ' <span class="status status--info">landing</span>' : ""}</td><td>${money(m.price)}</td><td>${cost ? money(cost) : '<span class="muted">Sin definir</span>'}</td><td>${cost ? money(m.price - cost) : "-"}</td><td>${ing} insumos</td><td><button class="mini-button" type="button" data-recipe="${m.id}">${icon("edit")}<span>Editar receta</span></button></td></tr>`;
  }).join("") || '<tr><td colspan="6" class="muted text-center">Sin platos.</td></tr>';
}

let recipeDraft = null;

function openRecipeModal(id) {
  const item = state.menuItems.find((m) => m.id === id);
  if (!item) return;
  recipeDraft = { ingredients: (item.recipe?.ingredients || []).map((x) => ({ ...x })), cost: item.recipe?.cost || 0 };
  renderRecipeModal(item);
}

function renderRecipeModal(item) {
  const invOptions = state.inventory.map((i) => `<option value="${i.id}">${escapeHtml(i.item)} (${i.unit})</option>`).join("");
  const rows = recipeDraft.ingredients.map((ing, idx) => {
    const inv = state.inventory.find((i) => i.id === ing.id);
    return `<tr><td>${escapeHtml(inv?.item || ing.id)}</td><td>${ing.qty} ${inv?.unit || ""}</td><td>${money((inv?.cost || 0) * ing.qty)}</td><td><button class="mini-button mini-button--danger" type="button" data-ing-del="${idx}">Quitar</button></td></tr>`;
  }).join("") || '<tr><td colspan="4" class="muted text-center">Sin insumos aun.</td></tr>';
  const suggested = recipeDraft.ingredients.reduce((a, ing) => a + (state.inventory.find((i) => i.id === ing.id)?.cost || 0) * ing.qty, 0);
  const html = `
    <section class="modal modal--small recipe-modal" role="dialog" aria-modal="true" aria-labelledby="rt">
      <div class="modal__header"><div><p class="eyebrow">Receta</p><h2 id="rt">Receta de ${escapeHtml(item.name)}</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div style="padding:20px;">
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Insumo</th><th>Cantidad</th><th>Costo</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="recipe-add">
          <select data-ing-id>${invOptions}</select>
          <input data-ing-qty type="number" min="0.01" step="0.01" value="1">
          <button class="button button--secondary" type="button" data-ing-add>Agregar insumo</button>
        </div>
        <p class="muted">Costo sugerido por insumos: <strong>${money(suggested)}</strong></p>
        <label class="sale-field"><span>Costo de elaboracion (S/)</span><input data-recipe-cost type="number" min="0" step="0.01" value="${recipeDraft.cost}"></label>
        <div class="confirm-actions"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="button" data-recipe-save>Guardar receta</button></div>
      </div>
    </section>`;
  const backdrop = openModal(html);
  backdrop.querySelector("[data-ing-add]").addEventListener("click", () => {
    const id = backdrop.querySelector("[data-ing-id]").value;
    const qty = Number(backdrop.querySelector("[data-ing-qty]").value);
    if (!id || !qty || qty <= 0) return;
    const existing = recipeDraft.ingredients.find((x) => x.id === id);
    if (existing) existing.qty += qty; else recipeDraft.ingredients.push({ id, qty });
    renderRecipeModal(item);
  });
  backdrop.querySelectorAll("[data-ing-del]").forEach((b) => b.addEventListener("click", () => {
    recipeDraft.ingredients.splice(Number(b.dataset.ingDel), 1);
    renderRecipeModal(item);
  }));
  backdrop.querySelector("[data-recipe-cost]").addEventListener("input", (e) => { recipeDraft.cost = Number(e.target.value) || 0; });
  backdrop.querySelector("[data-recipe-save]").addEventListener("click", () => {
    item.recipe = { ingredients: recipeDraft.ingredients, cost: recipeDraft.cost };
    saveState(state); closeModal(); showToast("Receta guardada."); render();
  });
}

function userEditor() {
  const rows = state.users.map((user, index) => `
    <div class="admin-row">
      <div><strong>${escapeHtml(user.name)}</strong><p class="muted">${user.role}</p></div>
      <span class="${statusClass(user.status)}">${user.status}</span>
      <div><button class="mini-button" type="button" data-toggle-user="${index}">${user.status === "Activo" ? "Desactivar" : "Activar"}</button></div>
    </div>`).join("");
  return `
    <div class="admin-list">${rows}</div>
    <form class="admin-user-form" data-user-form>
      <h3>Agregar nuevo usuario</h3>
      <label>Nombre<input name="name" required placeholder="Nombre del usuario"></label>
      <label>Rol<select name="role"><option>Administrador</option><option>Cajero</option><option>Cocina</option><option>Operaciones</option></select></label>
      <button class="button button--secondary" type="submit">Guardar usuario</button>
    </form>`;
}

function wire() {
  view.querySelector("[data-menu-form]").addEventListener("submit", (event) => {
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
  view.querySelectorAll("[data-recipe]").forEach((b) => b.addEventListener("click", () => openRecipeModal(b.dataset.recipe)));
  view.querySelector("[data-category-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const c = String(new FormData(event.target).get("category") || "").trim();
    if (!c || state.menuCategories.includes(c)) { showToast("La categoria ya existe o esta vacia."); return; }
    state.menuCategories.push(c); saveState(state); showToast("Categoria agregada."); render();
  });
  view.querySelector("[data-lot-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    state.coffeeLots.unshift({ id: `LOT-CAF-${String(state.coffeeLots.length + 1).padStart(3, "0")}`, code: d.code, origin: d.origin, producer: d.producer, variety: d.variety, roast: d.roast, received: d.received, stock: Number(d.stock), unit: d.unit, notes: d.notes });
    saveState(state); showToast("Lote de cafe registrado para trazabilidad Farm-to-Cup."); render();
  });
  view.querySelector("[data-user-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const d = Object.fromEntries(new FormData(event.target));
    state.users.push({ name: d.name, role: d.role, status: "Activo" });
    saveState(state); showToast("Usuario agregado."); render();
  });
  view.querySelectorAll("[data-toggle-user]").forEach((b) => b.addEventListener("click", () => {
    const user = state.users[Number(b.dataset.toggleUser)];
    if (user) { user.status = user.status === "Activo" ? "Inactivo" : "Activo"; saveState(state); showToast("Estado de usuario actualizado."); render(); }
  }));
}
