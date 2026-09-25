// Cafe Fusiones - Inicio (solo la logica de esta pantalla).
//
// Tablero del dia: responde "que necesita mi atencion ahora". Por ahora es la
// vista completa (Administrador / Gerencia); despues se adapta por rol. Cada
// bloque enlaza a donde se resuelve y solo se muestra si el rol puede abrir
// ese modulo.
//
// Bloques, de arriba a abajo:
//   1. Primeros pasos      - solo mientras falte cargar algo del negocio
//   2. Estado del turno    - caja, sucursal y fecha
//   3. Indicadores del dia - comparados con el mismo dia de la semana pasada
//   4. Salon ahora         - mesas por estado y pedidos por estacion
//   5. Pendientes          - alertas accionables
//   6. Mas vendidos hoy y reservas de hoy
//
// Todo se calcula sobre el estado real: sin datos simulados.
import { requireAuth } from "../core/auth.js";
import { canAccess } from "../core/router.js";
import { renderSidebar } from "../components/sidebar.js";
import { renderTopbar } from "../components/topbar.js";
import { getState, getActiveBranch } from "../core/storage.js";
import { icon, money, escapeHtml } from "../core/utils.js";

const session = requireAuth();
const state = getState();
const view = document.getElementById("view");

// Un pedido se considera demorado al pasar 1.35 veces el tiempo objetivo de su
// estacion (mismo criterio que la pantalla de Produccion).
const DEMORA_FACTOR = 1.35;
const TOP_PRODUCTOS = 5;
// Dia local de hoy y el mismo dia de la semana pasada (para comparar).
// localDay es una declaracion de funcion, asi que ya existe aqui.
const HOY = localDay();
const HACE_7 = localDay(new Date(Date.now() - 7 * 86400000));

if (session) init(session.role);

function init(role) {
  renderSidebar("dashboard", role);
  // Acceso rapido a Ventas: boton normal en la cabecera, no un bloque aparte.
  renderTopbar({
    title: "Inicio",
    eyebrow: "Panel",
    showSearch: false,
    actions: canAccess(role, "ventas")
      ? `<a class="button button--primary" href="ventas.html?tab=salon&mode=map">${icon("receipt")}<span>Nueva venta</span></a>`
      : ""
  });

  view.innerHTML = `
    <div class="view-stack home-view">
      ${renderSetup()}
      ${renderShift()}
      <section class="grid grid--4 home-kpis" aria-label="Indicadores del día">${kpis().map(renderKpi).join("")}</section>
      <section class="home-grid">
        ${renderFloor()}
        ${renderAlerts()}
      </section>
      <section class="home-grid">
        ${renderTopProducts()}
        ${renderReservations()}
      </section>
    </div>`;
}

/* ==========================================================================
   FECHAS (dia local, no UTC: en Peru el dia UTC cambia a las 7 p. m.)
   ========================================================================== */

function localDay(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function minutesSince(iso) {
  const time = new Date(iso || 0).getTime();
  return time > 0 ? Math.max(0, Math.floor((Date.now() - time) / 60000)) : 0;
}

function timeLabel(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

/* ==========================================================================
   DATOS
   ========================================================================== */

function branchId() {
  return getActiveBranch(state)?.id || state.settings?.activeBranchId || null;
}

// Registros sin sucursal (estados viejos) cuentan para la sucursal activa.
function inBranch(record) {
  return !record.branchId || !branchId() || record.branchId === branchId();
}

function salesOn(day) {
  return (state.salesHistory || []).filter((sale) => localDay(sale.closedAt) === day && inBranch(sale));
}

function dayTotals(day) {
  const sales = salesOn(day);
  const total = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const units = sales.reduce((sum, sale) =>
    sum + (sale.items || []).reduce((acc, item) => acc + Number(item.qty || 0), 0), 0);
  const tables = new Set(sales.map((sale) => sale.tableId).filter(Boolean)).size;
  return { count: sales.length, total, ticket: sales.length ? total / sales.length : 0, units, tables };
}

function branchTables() {
  return (state.tables || []).filter((table) => Number(table.seats || 0) > 0 && inBranch(table));
}

function stationTarget(station) {
  const record = (state.stations || []).find(
    (item) => String(item.name || "").toLowerCase() === String(station || "").toLowerCase()
  );
  return Number(record?.targetMinutes || 10);
}

// Mismo ajuste que Produccion: los pedidos sembrados traen `elapsed` para que
// una demo abierta horas despues no los muestre a todos como demorados.
function orderElapsed(order) {
  const actual = minutesSince(order.createdAt);
  const seeded = Number(order.elapsed);
  if (Number.isFinite(seeded) && seeded >= 0 && actual > 90) return seeded;
  return actual;
}

// Lineas de produccion abiertas agrupadas por estacion.
function productionByStation() {
  const stations = new Map();
  (state.kitchenOrders || [])
    .filter((order) => order.status !== "Entregado")
    .forEach((order) => {
      const elapsed = orderElapsed(order);
      (order.items || []).forEach((item) => {
        const status = item.status || order.status;
        if (status === "Entregado") return;
        const name = item.station || "Cocina";
        if (!stations.has(name)) stations.set(name, { name, pending: 0, ready: 0, delayed: 0 });
        const entry = stations.get(name);
        if (status === "Listo") {
          entry.ready += Number(item.qty || 1);
        } else {
          entry.pending += Number(item.qty || 1);
          if (elapsed > stationTarget(name) * DEMORA_FACTOR) entry.delayed += Number(item.qty || 1);
        }
      });
    });
  return [...stations.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function isDirectPlato(plato) {
  return plato.inventoryMode === "direct" || Boolean(plato.inventoryItemId && plato.inventoryMode !== "recipe");
}

// Platos activos que al venderse no descuentan inventario.
function platosSinReceta() {
  const conReceta = new Set();
  (state.recipes || []).forEach((recipe) => {
    if (recipe.productId) conReceta.add(recipe.productId);
    (recipe.productIds || []).forEach((id) => conReceta.add(id));
  });
  return (state.menuItems || []).filter((plato) =>
    plato.status !== "Inactivo" &&
    !conReceta.has(plato.id) &&
    !(isDirectPlato(plato) && plato.inventoryItemId));
}

function activeInventory() {
  return (state.inventory || []).filter((item) => item.active !== false);
}

/* ==========================================================================
   1. PRIMEROS PASOS
   Lista de puesta en marcha: cada paso se marca solo cuando el dato existe.
   Desaparece cuando todo esta completo.
   ========================================================================== */

function setupSteps() {
  const inventory = activeInventory();
  const sinReceta = platosSinReceta().length;
  const s = state.settings || {};

  return [
    {
      done: inventory.some((item) => Number(item.stock || 0) > 0),
      title: "Registrar el inventario inicial",
      detail: "Carga las existencias actuales de cada insumo para que el stock y el costo sean reales.",
      href: "inventario.html?tab=stock",
      module: "inventario"
    },
    {
      done: inventory.some((item) => Number(item.min || 0) > 0),
      title: "Definir los mínimos de stock",
      detail: "Sin mínimo, un insumo nunca avisa que se está acabando.",
      href: "inventario.html?tab=stock",
      module: "inventario"
    },
    {
      done: sinReceta === 0,
      title: "Asignar receta a todos los platos",
      detail: sinReceta
        ? `${sinReceta} plato${sinReceta === 1 ? "" : "s"} sin receta: al venderse no descuentan insumos.`
        : "Todos los platos descuentan sus insumos al venderse.",
      href: "admin.html?tab=recetas",
      module: "admin"
    },
    {
      done: Boolean(s.legalName && s.ruc && s.fiscalAddress),
      title: "Completar los datos fiscales",
      detail: "Razón social, RUC y dirección fiscal para los comprobantes.",
      href: "configuracion.html?tab=general",
      module: "configuracion"
    },
    {
      done: Boolean(state.cashBox?.openedAt) || (state.cashBoxes || []).length > 0,
      title: "Abrir la primera caja",
      detail: "Sin caja abierta no se puede cobrar.",
      href: "caja.html",
      module: "caja"
    }
  ];
}

function renderSetup() {
  const steps = setupSteps();
  const done = steps.filter((step) => step.done).length;
  if (done === steps.length) return "";

  return `
    <section class="panel home-setup" aria-label="Primeros pasos">
      <div class="home-setup__head">
        <div>
          <h2>Primeros pasos</h2>
          <p>Completa la puesta en marcha para que ventas, inventario y reportes muestren datos reales.</p>
        </div>
        <div class="home-setup__progress" aria-label="${done} de ${steps.length} pasos completos">
          <strong>${done}/${steps.length}</strong>
          <span class="home-progress"><span style="width:${(done / steps.length) * 100}%"></span></span>
        </div>
      </div>
      <ol class="home-setup__list">
        ${steps.map((step) => `
          <li class="${step.done ? "is-done" : ""}">
            <span class="home-setup__check" aria-hidden="true">${step.done ? "✓" : ""}</span>
            <div>
              <strong>${escapeHtml(step.title)}</strong>
              <small>${escapeHtml(step.detail)}</small>
            </div>
            ${!step.done && allowed(step.module) ? `<a class="mini-button" href="${step.href}">Ir</a>` : ""}
          </li>
        `).join("")}
      </ol>
    </section>`;
}

/* ==========================================================================
   2. ESTADO DEL TURNO
   ========================================================================== */

function renderShift() {
  const box = state.cashBox || {};
  const branch = getActiveBranch(state);
  const fecha = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  const caja = box.open
    ? `<span class="home-dot is-ok"></span><div><strong>Caja abierta</strong><small>Desde las ${timeLabel(box.openedAt)} · apertura ${money(box.opening || 0)}${box.user ? ` · ${escapeHtml(box.user)}` : ""}</small></div>`
    : `<span class="home-dot is-off"></span><div><strong>Caja cerrada</strong><small>Ábrela para poder cobrar las mesas.</small></div>`;

  let action = "";
  if (allowed("caja")) {
    action = box.open
      ? '<a class="mini-button" href="caja.html">Ver caja</a>'
      : `<a class="button button--primary" href="caja.html">${icon("cash")}<span>Abrir caja</span></a>`;
  }

  return `
    <section class="panel home-shift">
      <div class="home-shift__cash">${caja}</div>
      <div class="home-shift__meta">
        <span><small>Sucursal</small><strong>${escapeHtml(branch?.shortName || branch?.name || "Principal")}</strong></span>
        <span><small>Hoy</small><strong class="home-capitalize">${escapeHtml(fecha)}</strong></span>
      </div>
      ${action}
    </section>`;
}

/* ==========================================================================
   3. INDICADORES DEL DIA
   ========================================================================== */

function variation(now, before) {
  if (!before) return now ? { text: "Sin datos del mismo día la semana pasada", tone: "neutral" } : { text: "Sin ventas aún", tone: "neutral" };
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return { text: "Igual que el mismo día la semana pasada", tone: "neutral" };
  return {
    text: `${pct > 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs. el mismo día la semana pasada`,
    tone: pct > 0 ? "up" : "down"
  };
}

function kpis() {
  const hoy = dayTotals(HOY);
  const antes = dayTotals(HACE_7);
  return [
    { label: "Ventas de hoy", value: money(hoy.total), extra: `${hoy.count} ${hoy.count === 1 ? "venta" : "ventas"}`, trend: variation(hoy.total, antes.total) },
    { label: "Ticket promedio", value: money(hoy.ticket), extra: "Por venta", trend: variation(hoy.ticket, antes.ticket) },
    { label: "Mesas atendidas", value: String(hoy.tables), extra: "Cuentas cerradas en salón", trend: variation(hoy.tables, antes.tables) },
    { label: "Productos vendidos", value: String(hoy.units), extra: "Unidades", trend: variation(hoy.units, antes.units) }
  ];
}

function renderKpi(kpi) {
  return `
    <article class="metric-card home-kpi">
      <p>${escapeHtml(kpi.label)}</p>
      <strong>${escapeHtml(kpi.value)}</strong>
      <span class="home-kpi__extra">${escapeHtml(kpi.extra)}</span>
      <span class="home-kpi__trend is-${kpi.trend.tone}">${escapeHtml(kpi.trend.text)}</span>
    </article>`;
}

/* ==========================================================================
   4. SALON AHORA
   ========================================================================== */

function renderFloor() {
  const tables = branchTables();
  const porCobrar = tables.filter((t) => t.accountRequested && (t.items || []).length).length;
  const ocupadas = tables.filter((t) => t.status === "Ocupada").length - porCobrar;
  const reservadas = tables.filter((t) => t.status === "Reservada").length;
  const libres = tables.filter((t) => t.status === "Libre" || !t.status).length;
  const stations = productionByStation();

  const tile = (label, value, tone) => `
    <div class="home-tile is-${tone}"><strong>${value}</strong><span>${label}</span></div>`;

  return `
    <article class="panel home-card">
      <div class="home-card__head">
        <h2>Salón ahora</h2>
        ${allowed("ventas") ? '<a class="mini-button" href="ventas.html?tab=salon&mode=map">Ver plano</a>' : ""}
      </div>
      <div class="home-tiles">
        ${tile("Libres", libres, "free")}
        ${tile("Ocupadas", Math.max(0, ocupadas), "busy")}
        ${tile("Por cobrar", porCobrar, "bill")}
        ${tile("Reservadas", reservadas, "reserved")}
      </div>
      <h3 class="home-subtitle">Producción</h3>
      ${stations.length ? `
        <ul class="home-stations">
          ${stations.map((st) => `
            <li>
              <strong>${escapeHtml(st.name)}</strong>
              <span>${st.pending} en preparación</span>
              <span>${st.ready} listos para servir</span>
              ${st.delayed ? `<span class="home-flag">${st.delayed} demorado${st.delayed === 1 ? "" : "s"}</span>` : '<span class="home-ok">En tiempo</span>'}
            </li>
          `).join("")}
        </ul>
      ` : '<p class="home-empty">No hay pedidos en cocina ni en barra.</p>'}
    </article>`;
}

/* ==========================================================================
   5. PENDIENTES Y ALERTAS
   Solo lo que requiere una accion; cada fila lleva a donde se resuelve.
   ========================================================================== */

function alerts() {
  const list = [];
  const box = state.cashBox || {};
  const tables = branchTables();
  const add = (item) => { if (item.count > 0 && allowed(item.module)) list.push(item); };

  const porCobrar = tables.filter((t) => t.accountRequested && (t.items || []).length);
  add({
    tone: "danger", module: "ventas", count: porCobrar.length,
    title: `${porCobrar.length} cuenta${porCobrar.length === 1 ? "" : "s"} por cobrar`,
    detail: porCobrar.map((t) => t.name).slice(0, 4).join(", "),
    href: "ventas.html?tab=salon&mode=map"
  });

  const conConsumo = tables.filter((t) => (t.items || []).length).length;
  add({
    tone: "danger", module: "caja", count: !box.open && conConsumo ? 1 : 0,
    title: "La caja está cerrada",
    detail: `Hay ${conConsumo} mesa${conConsumo === 1 ? "" : "s"} con consumo que no se podrá${conConsumo === 1 ? "" : "n"} cobrar.`,
    href: "caja.html"
  });

  const stations = productionByStation();
  const listos = stations.reduce((sum, st) => sum + st.ready, 0);
  add({
    tone: "warn", module: "ventas", count: listos,
    title: `${listos} producto${listos === 1 ? "" : "s"} listo${listos === 1 ? "" : "s"} para servir`,
    detail: "Esperan en cocina o barra.",
    href: "ventas-kds.html"
  });

  const demorados = stations.reduce((sum, st) => sum + st.delayed, 0);
  add({
    tone: "danger", module: "ventas", count: demorados,
    title: `${demorados} producto${demorados === 1 ? "" : "s"} demorado${demorados === 1 ? "" : "s"}`,
    detail: "Superan el tiempo objetivo de su estación.",
    href: "ventas-kds.html"
  });

  const inventory = activeInventory();
  const negativos = inventory.filter((i) => Number(i.stock || 0) < 0);
  add({
    tone: "danger", module: "inventario", count: negativos.length,
    title: `${negativos.length} insumo${negativos.length === 1 ? "" : "s"} en negativo`,
    detail: "Se vendieron sin existencias registradas.",
    href: "inventario.html?tab=stock"
  });

  const bajoMinimo = inventory.filter((i) => Number(i.min || 0) > 0 && Number(i.stock || 0) >= 0 && Number(i.stock || 0) <= Number(i.min || 0));
  add({
    tone: "warn", module: "inventario", count: bajoMinimo.length,
    title: `${bajoMinimo.length} insumo${bajoMinimo.length === 1 ? "" : "s"} en su mínimo`,
    detail: bajoMinimo.map((i) => i.item).slice(0, 3).join(", "),
    href: "inventario.html?tab=stock"
  });

  const limite = localDay(new Date(Date.now() + 7 * 86400000));
  const porVencer = (state.inventoryLots || []).filter((lot) =>
    lot.expiry && lot.expiry >= HOY && lot.expiry <= limite && Number(lot.availableQty || 0) > 0);
  add({
    tone: "warn", module: "inventario", count: porVencer.length,
    title: `${porVencer.length} lote${porVencer.length === 1 ? "" : "s"} vence${porVencer.length === 1 ? "" : "n"} en 7 días`,
    detail: porVencer.map((lot) => lot.item).slice(0, 3).join(", "),
    href: "inventario.html?tab=lotes"
  });

  const reservasPorConfirmar = (state.reservations || []).filter((r) => r.date === HOY && r.status === "Pendiente" && inBranch(r));
  add({
    tone: "warn", module: "clientes", count: reservasPorConfirmar.length,
    title: `${reservasPorConfirmar.length} reserva${reservasPorConfirmar.length === 1 ? "" : "s"} de hoy sin confirmar`,
    detail: "Confírmalas o cancélalas.",
    href: "clientes.html?tab=reservas"
  });

  const anulaciones = (box.voids || []).filter((v) => localDay(v.at) === HOY);
  add({
    tone: "info", module: "caja", count: anulaciones.length,
    title: `${anulaciones.length} producto${anulaciones.length === 1 ? "" : "s"} anulado${anulaciones.length === 1 ? "" : "s"} hoy`,
    detail: "Revisa los motivos en el cierre de caja.",
    href: "caja.html"
  });

  const sinReceta = platosSinReceta().length;
  add({
    tone: "info", module: "admin", count: sinReceta,
    title: `${sinReceta} plato${sinReceta === 1 ? "" : "s"} sin receta`,
    detail: "Al venderse no descuentan insumos.",
    href: "admin.html?tab=recetas"
  });

  return list;
}

function renderAlerts() {
  const list = alerts();
  const order = { danger: 0, warn: 1, info: 2 };
  list.sort((a, b) => order[a.tone] - order[b.tone]);

  return `
    <article class="panel home-card">
      <div class="home-card__head">
        <h2>Pendientes</h2>
        <span class="home-count">${list.length}</span>
      </div>
      ${list.length ? `
        <ul class="home-alerts">
          ${list.map((item) => `
            <li>
              <a class="home-alert is-${item.tone}" href="${item.href}">
                <span class="home-alert__mark" aria-hidden="true">${item.tone === "danger" ? "!" : item.tone === "warn" ? "•" : "i"}</span>
                <span class="home-alert__text">
                  <strong>${escapeHtml(item.title)}</strong>
                  ${item.detail ? `<small>${escapeHtml(item.detail)}</small>` : ""}
                </span>
                <span class="home-alert__go" aria-hidden="true">›</span>
              </a>
            </li>
          `).join("")}
        </ul>
      ` : '<p class="home-empty home-empty--ok">Todo en orden: no hay pendientes.</p>'}
    </article>`;
}

/* ==========================================================================
   6. MAS VENDIDOS Y RESERVAS DE HOY
   ========================================================================== */

function renderTopProducts() {
  const grouped = new Map();
  salesOn(HOY).forEach((sale) => (sale.items || []).forEach((item) => {
    const key = item.name || item.id;
    const entry = grouped.get(key) || { name: key, qty: 0, income: 0 };
    entry.qty += Number(item.qty || 0);
    entry.income += Number(item.qty || 0) * Number(item.price || 0);
    grouped.set(key, entry);
  }));
  const top = [...grouped.values()].sort((a, b) => b.qty - a.qty).slice(0, TOP_PRODUCTOS);
  const max = Math.max(...top.map((p) => p.qty), 1);

  return `
    <article class="panel home-card">
      <div class="home-card__head">
        <h2>Más vendidos hoy</h2>
        ${allowed("reportes") ? '<a class="mini-button" href="reportes.html?tab=ventas">Ver reporte</a>' : ""}
      </div>
      ${top.length ? `
        <div class="home-bars">
          ${top.map((p) => `
            <div class="home-bars__row" title="${escapeHtml(p.name)} · ${p.qty} u. · ${escapeHtml(money(p.income))}">
              <span class="home-bars__label">${escapeHtml(p.name)}</span>
              <span class="home-bars__track"><span style="width:${(p.qty / max) * 100}%"></span></span>
              <strong>${p.qty} u.</strong>
            </div>
          `).join("")}
        </div>
      ` : '<p class="home-empty">Aún no hay ventas hoy.</p>'}
    </article>`;
}

function renderReservations() {
  const today = (state.reservations || [])
    .filter((r) => r.date === HOY && ["Pendiente", "Confirmada"].includes(r.status) && inBranch(r))
    .sort((a, b) => String(a.time).localeCompare(String(b.time)));

  return `
    <article class="panel home-card">
      <div class="home-card__head">
        <h2>Reservas de hoy</h2>
        ${allowed("clientes") ? '<a class="mini-button" href="clientes.html?tab=reservas">Ver reservas</a>' : ""}
      </div>
      ${today.length ? `
        <ul class="home-reservations">
          ${today.slice(0, 6).map((r) => {
            const table = (state.tables || []).find((t) => t.id === r.tableId);
            return `
              <li>
                <time>${escapeHtml(r.time || "—")}</time>
                <div>
                  <strong>${escapeHtml(`${r.name || ""} ${r.lastname || ""}`.trim() || "Sin nombre")}</strong>
                  <small>${Number(r.people || 1)} persona${Number(r.people || 1) === 1 ? "" : "s"}${table ? ` · ${escapeHtml(table.name)}` : ""}${r.motive ? ` · ${escapeHtml(r.motive)}` : ""}</small>
                </div>
                <span class="home-tag ${r.status === "Confirmada" ? "is-ok" : "is-pending"}">${escapeHtml(r.status)}</span>
              </li>`;
          }).join("")}
        </ul>
        ${today.length > 6 ? `<p class="home-more">y ${today.length - 6} más</p>` : ""}
      ` : '<p class="home-empty">No hay reservas para hoy.</p>'}
    </article>`;
}

/* ==========================================================================
   UTILIDADES
   ========================================================================== */

// Configuracion esta en el menu de todos los roles.
function allowed(moduleId) {
  if (!moduleId || moduleId === "configuracion") return true;
  return canAccess(session.role, moduleId);
}
