// Cafe Fusiones - Modulo de Caja (independiente de Ventas).
// Mejoras del jefe: vista propia de caja (solo caja), cierre amplio con seleccion de
// reportes, y egresos con mas campos (producto, unidad, cantidad, descripcion).
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, saveState } from "../core/storage.js";
import { openModal, closeModal, closeIcon } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { icon, money, escapeHtml, trendClass, unitOptions, buildSimplePdf, downloadBlob } from "../core/utils.js";

const session = requireAuth();
if (session && !canAccess(session.role, "caja")) window.location.replace("dashboard.html");
const state = getState();
const view = document.getElementById("view");

if (session && canAccess(session.role, "caja")) {
  renderSidebar("caja", session.role);
  renderTopbar({ title: "Caja", eyebrow: "Modulo", showSearch: false });
  render();
}

function summary() {
  const c = state.cashBox;
  const efectivoVentas = c.movements.filter((m) => m.type === "venta" && m.method === "Efectivo").reduce((a, m) => a + m.amount, 0);
  const posVentas = c.movements.filter((m) => m.type === "venta" && m.method === "POS").reduce((a, m) => a + m.amount, 0);
  const ingresos = c.movements.filter((m) => m.type === "ingreso").reduce((a, m) => a + m.amount, 0);
  const egresos = c.movements.filter((m) => m.type === "egreso").reduce((a, m) => a + m.amount, 0);
  const ventasTotal = efectivoVentas + posVentas;
  const ventasCount = c.movements.filter((m) => m.type === "venta").length;
  const efectivoFinal = c.opening + efectivoVentas + ingresos - egresos;
  return { efectivoVentas, posVentas, ingresos, egresos, ventasTotal, ventasCount, efectivoFinal };
}

function soldProducts() {
  const map = {};
  state.cashBox.movements.filter((m) => m.type === "venta").forEach((m) => {
    (m.items || []).forEach((it) => {
      map[it.name] ??= { name: it.name, qty: 0, total: 0 };
      map[it.name].qty += it.qty;
      map[it.name].total += it.price * it.qty;
    });
  });
  return Object.values(map).sort((a, b) => b.qty - a.qty);
}

function render() {
  const c = state.cashBox;
  if (!c.open) {
    view.innerHTML = `
      <div class="view-stack">
        <section class="panel cash-open-panel">
          <div class="cash-open-panel__body">
            <div><p class="eyebrow">Caja</p><h2>Caja cerrada</h2><p class="muted">Cajero: <strong>${escapeHtml(session.name)}</strong>. Abre la caja para iniciar el turno.</p></div>
            <button class="button button--primary button--xl" type="button" data-open-cash>${icon("cash")}<span>Abrir caja</span></button>
          </div>
        </section>
      </div>`;
    view.querySelector("[data-open-cash]").addEventListener("click", openCashModal);
    return;
  }

  const s = summary();
  const movs = c.movements.slice().reverse().map((m) => {
    const cls = m.type === "egreso" ? "mov-egreso" : m.type === "ingreso" ? "mov-ingreso" : "mov-venta";
    const sign = m.type === "egreso" ? "-" : "+";
    return `<tr><td><span class="mov-tag ${cls}">${m.type}</span></td><td>${escapeHtml(m.concept)}</td><td>${m.method || "-"}</td><td><strong>${sign} ${money(m.amount)}</strong></td></tr>`;
  }).join("") || '<tr><td colspan="4" class="muted text-center">Sin movimientos aun.</td></tr>';

  const voids = c.voids.slice().reverse().map((v) => `<tr><td>${escapeHtml(v.item)}</td><td>${v.qty}</td><td>${escapeHtml(v.motivo)}</td><td>${escapeHtml(v.table || "-")}</td></tr>`).join("")
    || '<tr><td colspan="4" class="muted text-center">Sin anulaciones.</td></tr>';

  view.innerHTML = `
    <div class="view-stack">
      <section class="panel">
        <div class="panel__header panel__header--wrap">
          <div><h2>Caja abierta</h2><p class="muted">Turno de: <strong>${escapeHtml(c.user || "-")}</strong></p></div>
          <div class="report-actions">
            <button class="button button--secondary" type="button" data-cash-in>${icon("plus")}<span>Registrar ingreso</span></button>
            <button class="button button--secondary" type="button" data-cash-out>Registrar egreso</button>
            <button class="button button--primary" type="button" data-close-cash>${icon("cash")}<span>Cerrar caja</span></button>
          </div>
        </div>
        <div class="grid grid--4 caja-kpis">
          <article class="metric-card"><div class="metric-card__top"><p>Efectivo en caja</p><span class="trend">Fisico</span></div><strong>${money(s.efectivoFinal)}</strong><span class="muted">Apertura ${money(c.opening)}</span></article>
          <article class="metric-card metric-card--income"><div class="metric-card__top"><p class="txt-income">Ingresos (ventas + aportes)</p></div><strong>${money(s.efectivoVentas + s.posVentas + s.ingresos)}</strong><span class="muted">Efectivo ${money(s.efectivoVentas)} · POS ${money(s.posVentas)}</span></article>
          <article class="metric-card metric-card--expense"><div class="metric-card__top"><p class="txt-expense">Egresos</p></div><strong>${money(s.egresos)}</strong><span class="muted">Salidas de caja</span></article>
          <article class="metric-card"><div class="metric-card__top"><p>Ventas del turno</p><span class="trend">${s.ventasCount}</span></div><strong>${money(s.ventasTotal)}</strong><span class="muted">Efectivo + POS</span></article>
        </div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2>Movimientos del turno</h2><span class="status">${c.movements.length}</span></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Tipo</th><th>Concepto</th><th>Metodo</th><th>Monto</th></tr></thead><tbody>${movs}</tbody></table></div>
      </section>

      <section class="panel">
        <div class="panel__header"><h2>Productos anulados</h2><span class="status">${c.voids.length}</span></div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Motivo</th><th>Mesa</th></tr></thead><tbody>${voids}</tbody></table></div>
      </section>
    </div>`;

  view.querySelector("[data-cash-in]").addEventListener("click", ingresoModal);
  view.querySelector("[data-cash-out]").addEventListener("click", egresoModal);
  view.querySelector("[data-close-cash]").addEventListener("click", cerrarModal);
}

function openCashModal() {
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="ct">
      <div class="modal__header"><div><p class="eyebrow">Caja</p><h2 id="ct">Abrir caja</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid" data-cash-form style="padding:20px;">
        <label class="span-2">Cajero del turno<input value="${escapeHtml(session.name)}" disabled></label>
        <label class="span-2">Monto inicial (S/) — se registra como ingreso<input name="opening" type="number" min="0" step="0.01" value="200" required autofocus></label>
        <div class="confirm-actions span-2"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Abrir caja</button></div>
      </form>
    </section>`;
  openModal(html).querySelector("[data-cash-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const opening = Number(new FormData(e.target).get("opening")) || 0;
    state.cashBox = { open: true, user: session.name, opening, openedAt: new Date().toISOString(), movements: [], voids: [] };
    saveState(state); closeModal(); showToast(`Caja abierta por ${session.name}.`); render();
  });
}

function ingresoModal() {
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="it">
      <div class="modal__header"><div><p class="eyebrow">Caja</p><h2 id="it" class="txt-income">Registrar ingreso</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid" data-mov-form style="padding:20px;">
        <label class="span-2">Concepto<input name="concept" required placeholder="Aporte a caja, cambio, propina..."></label>
        <label class="span-2">Monto (S/)<input name="amount" type="number" min="0.01" step="0.01" required></label>
        <div class="confirm-actions span-2"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Registrar ingreso</button></div>
      </form>
    </section>`;
  openModal(html).querySelector("[data-mov-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const amount = Number(d.amount) || 0;
    if (amount <= 0) return;
    state.cashBox.movements.push({ type: "ingreso", concept: d.concept, method: "Efectivo", amount, user: session.name, at: new Date().toISOString() });
    saveState(state); closeModal(); showToast("Ingreso registrado."); render();
  });
}

function egresoModal() {
  const list = state.inventory.map((i) => `<option value="${escapeHtml(i.item)}">`).join("");
  const html = `
    <section class="modal modal--small" role="dialog" aria-modal="true" aria-labelledby="et">
      <div class="modal__header"><div><p class="eyebrow">Caja</p><h2 id="et" class="txt-expense">Registrar egreso</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <form class="form-grid" data-egreso-form style="padding:20px;">
        <label class="span-2">Producto (elige del sistema o escribe uno nuevo)<input name="product" list="egreso-products" required placeholder="Ej. Pollo, Bombilla de luz..."><datalist id="egreso-products">${list}</datalist></label>
        <label>Unidad de medida<select name="unit" required>${unitOptions("un")}</select></label>
        <label>Cantidad<input name="qty" type="number" min="0.01" step="0.01" value="1" required></label>
        <label>Monto (S/)<input name="amount" type="number" min="0.01" step="0.01" required></label>
        <label class="span-2">Descripcion<textarea class="textarea" name="description" placeholder="Detalle de la compra o salida de caja"></textarea></label>
        <div class="confirm-actions span-2"><button class="button" type="button" data-close-modal>Cancelar</button><button class="button button--primary" type="submit">Registrar egreso</button></div>
      </form>
    </section>`;
  openModal(html).querySelector("[data-egreso-form]").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const amount = Number(d.amount) || 0;
    if (amount <= 0 || !d.product.trim()) return;
    state.cashBox.movements.push({
      type: "egreso", concept: `${d.product} (${d.qty} ${d.unit})`, product: d.product.trim(),
      unit: d.unit, qty: Number(d.qty), method: "Efectivo", amount, description: d.description || "",
      user: session.name, at: new Date().toISOString()
    });
    saveState(state); closeModal(); showToast("Egreso registrado."); render();
  });
}

/* ---- Cierre de caja (amplio + seleccion de reportes) ---- */
const REPORTS = [
  { id: "vendidos", label: "Productos vendidos del dia" },
  { id: "ingresos", label: "Ingresos diarios (por medio de pago)" },
  { id: "resumen", label: "Resumen de ventas" },
  { id: "eliminados", label: "Productos eliminados y egresos" },
  { id: "efectivo", label: "Calculo de efectivo final" },
  { id: "stock", label: "Stock en almacen (Kardex)" }
];

function cerrarModal() {
  const s = summary();
  const c = state.cashBox;
  const checks = REPORTS.map((r) => `<label class="check-row"><input type="checkbox" data-report="${r.id}" checked><span>${r.label}</span></label>`).join("");
  const html = `
    <section class="modal cierre-modal" role="dialog" aria-modal="true" aria-labelledby="cz">
      <div class="modal__header"><div><p class="eyebrow">Caja</p><h2 id="cz">Cierre de caja</h2></div><button class="icon-button" type="button" data-close-modal aria-label="Cerrar">${closeIcon}</button></div>
      <div class="cierre-body">
        <section class="cierre-col">
          <h3>Cuadre del turno</h3>
          <div class="cierre-lines">
            <div class="cierre-line"><span>Cajero</span><strong>${escapeHtml(c.user || "-")}</strong></div>
            <div class="cierre-line"><span>Apertura</span><strong>${money(c.opening)}</strong></div>
            <div class="cierre-line"><span>Ventas efectivo</span><strong>${money(s.efectivoVentas)}</strong></div>
            <div class="cierre-line"><span>Ventas POS</span><strong>${money(s.posVentas)}</strong></div>
            <div class="cierre-line txt-income"><span>Ingresos</span><strong>${money(s.ingresos)}</strong></div>
            <div class="cierre-line txt-expense"><span>Egresos</span><strong>${money(s.egresos)}</strong></div>
            <div class="cierre-line cierre-line--total"><span>Efectivo esperado</span><strong>${money(s.efectivoFinal)}</strong></div>
          </div>
          <label class="cierre-field"><span>Efectivo contado (S/)</span><input name="counted" type="number" min="0" step="0.01" value="${s.efectivoFinal}"></label>
        </section>
        <section class="cierre-col">
          <h3>Reportes a generar</h3>
          <div class="check-list">${checks}</div>
          <button class="button button--secondary button--block" type="button" data-generate-reports>Generar reportes seleccionados (PDF)</button>
        </section>
      </div>
      <div class="cierre-footer">
        <button class="button" type="button" data-close-modal>Cancelar</button>
        <button class="button button--primary" type="button" data-confirm-close>Cerrar caja</button>
      </div>
    </section>`;
  const backdrop = openModal(html);
  backdrop.querySelector("[data-generate-reports]").addEventListener("click", () => {
    const ids = [...backdrop.querySelectorAll("[data-report]:checked")].map((cb) => cb.dataset.report);
    if (!ids.length) { showToast("Selecciona al menos un reporte."); return; }
    generateReports(ids);
  });
  backdrop.querySelector("[data-confirm-close]").addEventListener("click", () => {
    const counted = Number(backdrop.querySelector('[name="counted"]').value) || 0;
    const diff = Math.round((counted - s.efectivoFinal) * 100) / 100;
    state.cashBox = { open: false, user: null, opening: 0, openedAt: null, movements: [], voids: [] };
    saveState(state); closeModal();
    showToast(diff === 0 ? "Caja cerrada sin diferencias." : `Caja cerrada. Diferencia: ${money(diff)}.`);
    render();
  });
}

function generateReports(ids) {
  const s = summary();
  const c = state.cashBox;
  const lines = ["Cafe Fusiones - Reportes de cierre de caja", `Cajero: ${c.user || "-"}`, `Generado: ${new Date().toLocaleString("es-PE")}`, ""];
  if (ids.includes("vendidos")) {
    lines.push("PRODUCTOS VENDIDOS DEL DIA");
    const sp = soldProducts();
    if (sp.length) sp.forEach((p) => lines.push(`${p.qty} x ${p.name} = ${money(p.total)}`));
    else lines.push("Sin ventas registradas.");
    lines.push("");
  }
  if (ids.includes("ingresos")) {
    lines.push("INGRESOS DIARIOS POR MEDIO DE PAGO", `Efectivo (ventas): ${money(s.efectivoVentas)}`, `POS (tarjeta/yape/plin): ${money(s.posVentas)}`, `Ingresos manuales: ${money(s.ingresos)}`, "");
  }
  if (ids.includes("resumen")) {
    lines.push("RESUMEN DE VENTAS", `Ventas del turno: ${s.ventasCount}`, `Total vendido: ${money(s.ventasTotal)}`, `Ticket promedio: ${money(s.ventasCount ? s.ventasTotal / s.ventasCount : 0)}`, "");
  }
  if (ids.includes("eliminados")) {
    lines.push("PRODUCTOS ELIMINADOS Y EGRESOS");
    if (c.voids.length) c.voids.forEach((v) => lines.push(`Anulado: ${v.qty} x ${v.item} — ${v.motivo} (${v.table || "-"})`));
    else lines.push("Sin anulaciones.");
    c.movements.filter((m) => m.type === "egreso").forEach((m) => lines.push(`Egreso: ${m.concept} = ${money(m.amount)}${m.description ? " — " + m.description : ""}`));
    lines.push("");
  }
  if (ids.includes("efectivo")) {
    lines.push("CALCULO DE EFECTIVO FINAL", `Apertura: ${money(c.opening)}`, `+ Ventas efectivo: ${money(s.efectivoVentas)}`, `+ Ingresos: ${money(s.ingresos)}`, `- Egresos: ${money(s.egresos)}`, `= Efectivo esperado: ${money(s.efectivoFinal)}`, "");
  }
  if (ids.includes("stock")) {
    lines.push("STOCK EN ALMACEN");
    state.inventory.forEach((i) => lines.push(`${i.item}: ${i.stock} ${i.unit} (minimo ${i.min})`));
    lines.push("");
  }
  downloadBlob(buildSimplePdf(lines), "Cafe_Fusiones_Cierre_Caja.pdf", "application/pdf");
  showToast("Reportes generados en PDF.");
}
