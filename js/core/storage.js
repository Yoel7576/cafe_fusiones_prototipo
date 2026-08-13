// Cafe Fusiones - Estado persistente del prototipo V8.
// Ruta: js/core/storage.js
//
// Este archivo es la fuente central de estado del frontend multipagina.
// El estado se guarda en localStorage para conservar la demo al navegar entre:
// Ventas, Caja, Inventario, Clientes, Reportes y Administracion.
//
// PRINCIPIOS V7
// ---------------------------------------------------------------------------
// - Sucursales son una entidad transversal del ERP.
// - Cada operacion que depende de un local conserva branchId.
// - El cliente es global a Cafe Fusiones; ventas/reservas conservan sucursal.
// - Categorias son DINAMICAS y se administran desde Configuracion.
// - NO se crean categorias configurables por defecto.
// - Se conserva menuCategories solo como compatibilidad temporal con las
//   pantallas de Ventas existentes. No es el nuevo catalogo de categorias.
// - Marketing/campanas ya no se inicializan como parte del ERP.
// - La migracion intenta conservar el localStorage existente en vez de
//   borrar toda la demo al cambiar de version.
//
// ESQUEMA DE CATEGORIA CONFIGURABLE ESPERADO:
// {
//   id: "CAT-0001",
//   scope: "menu" | "public_menu" | "inventory" | "expenses",
//   name: "Nombre definido por el usuario",
//   code: "",
//   status: "Activa",
//   order: 10,
//   branchIds: ["ALL"],        // o ["SUC-01", "SUC-02"]
//   createdAt: "...",
//   updatedAt: "..."
// }
//
// Las categorias no se insertan aqui. Configuracion sera responsable de
// crearlas, editarlas, ordenarlas y desactivarlas.

import {
  inventory,
  tables,
  customers,
  users,
  menuItems,
  menuCategories,
  coffeeLotsSeed,
  reservations,
  tableItemsSeed,
  kitchenOrders,
  wasteRecordsSeed,
  loyaltyConfigSeed,
  rewardsSeed,
  loyaltyMovementsSeed,
  stationsSeed,
  auditEvents,
  reportOperationsSeed
} from "../data/data.js";

const STATE_KEY = "cafeFusionesState";
const VERSION = 8;

export const MAIN_BRANCH_ID = "SUC-01";

// Los scopes son tipos de catalogo, no categorias.
// Configuracion puede mostrar estos ambitos y crear las categorias que necesite.
export const CATEGORY_SCOPES = [
  { id: "menu", label: "Carta / productos" },
  { id: "public_menu", label: "Carta pública / Landing" },
  { id: "inventory", label: "Inventario / insumos" },
  { id: "expenses", label: "Gastos" }
];

// Fallback para navegadores/modos donde localStorage este bloqueado.
let memoryState = null;

/* ==========================================================================
   UTILIDADES INTERNAS
   ========================================================================== */

function clone(value) {
  if (value === undefined) return undefined;

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // fallback JSON
    }
  }

  return JSON.parse(JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function dateOnly(value = nowIso()) {
  return String(value).slice(0, 10);
}

function normalizeBranchStatus(value) {
  return String(value || "").toLowerCase() === "inactiva"
    ? "Inactiva"
    : "Activa";
}

function normalizeCategoryStatus(value) {
  return String(value || "").toLowerCase() === "inactiva"
    ? "Inactiva"
    : "Activa";
}

function defaultBranch() {
  return {
    id: MAIN_BRANCH_ID,
    code: "CHA-01",
    name: "Chachapoyas - Principal",
    shortName: "Principal",
    address: "Jr. Ortiz Arrieta 779, Chachapoyas",
    city: "Chachapoyas",
    region: "Amazonas",
    country: "Perú",
    status: "Activa",
    isMain: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
}

function branchExists(branches, branchId) {
  return (branches || []).some((branch) => branch.id === branchId);
}

function firstActiveBranchId(branches) {
  const active = (branches || []).filter(
    (branch) => normalizeBranchStatus(branch.status) === "Activa"
  );

  return (
    active.find((branch) => branch.isMain)?.id ||
    active[0]?.id ||
    branches?.[0]?.id ||
    MAIN_BRANCH_ID
  );
}

function wasteDate(record) {
  if (record?.date) return record.date;
  if (record?.at) return String(record.at).slice(0, 10);
  return dateOnly();
}

/* ==========================================================================
   CONSTRUCTORES DEL SEED
   ========================================================================== */

function buildBranches() {
  return [defaultBranch()];
}

function buildTables() {
  return tables.map((table) => {
    const items = clone(tableItemsSeed[table.id] || []);

    const next = {
      ...clone(table),
      branchId: table.branchId || MAIN_BRANCH_ID,
      items,
      customerId: table.customerId || null,
      openedAt: table.openedAt || (items.length ? nowIso() : null)
    };

    // Delivery no tiene asientos y se comporta como una cola operativa.
    if (table.seats === 0) {
      next.status = items.length ? "Ocupada" : "Libre";
      return next;
    }

    // Las reservas se respetan aunque todavia no tengan productos.
    if (table.status === "Reservada" && !items.length) {
      next.status = "Reservada";
      return next;
    }

    next.status = items.length ? "Ocupada" : "Libre";
    return next;
  });
}

function buildMenuItems() {
  // Carta/productos son catalogo global.
  // La disponibilidad especifica por sucursal se agregara posteriormente
  // mediante branchIds/availabilityByBranch desde Administracion.
  return menuItems.map((item) => ({
    ...clone(item),
    branchIds: Array.isArray(item.branchIds) ? clone(item.branchIds) : ["ALL"]
  }));
}

function buildKitchenOrders() {
  return kitchenOrders.map((order) => ({
    ...clone(order),
    branchId: order.branchId || MAIN_BRANCH_ID,
    items: Array.isArray(order.items) ? clone(order.items) : []
  }));
}

function buildInventory() {
  // En V7 el stock es por sucursal. Los registros seed pertenecen a la sede
  // principal. Una futura sucursal tendra sus propios registros/stock.
  return inventory.map((item) => ({
    ...clone(item),
    branchId: item.branchId || MAIN_BRANCH_ID
  }));
}

function buildWasteRecords() {
  return wasteRecordsSeed.map((record) => ({
    ...clone(record),
    branchId: record.branchId || MAIN_BRANCH_ID,
    date: wasteDate(record)
  }));
}

function buildCoffeeLots() {
  return coffeeLotsSeed.map((lot) => ({
    ...clone(lot),
    branchId: lot.branchId || MAIN_BRANCH_ID
  }));
}

function buildCustomers() {
  // El perfil de cliente es global. Solo guardamos origen/ultima sucursal.
  // Las ventas y reservas son las que siempre deben conservar branchId.
  return customers.map((customer) => ({
    ...clone(customer),
    originBranchId: customer.originBranchId || MAIN_BRANCH_ID,
    lastBranchId: customer.lastBranchId || MAIN_BRANCH_ID
  }));
}

function buildReservations() {
  return reservations.map((reservation) => ({
    ...clone(reservation),
    branchId: reservation.branchId || MAIN_BRANCH_ID
  }));
}

function buildRewards() {
  // Una recompensa puede aplicar a todas o a una sucursal concreta.
  return rewardsSeed.map((reward) => ({
    ...clone(reward),
    branchId: reward.branchId || "ALL"
  }));
}

function buildLoyaltyMovements() {
  // El saldo de fidelizacion es del cliente/empresa, pero cada movimiento
  // conserva en que sucursal se genero o canjeo.
  return loyaltyMovementsSeed.map((movement) => ({
    ...clone(movement),
    branchId: movement.branchId || MAIN_BRANCH_ID
  }));
}

function buildUsers() {
  return users.map((user) => {
    const administrator = String(user.role || "")
      .toLowerCase()
      .includes("administr");

    return {
      ...clone(user),
      defaultBranchId: user.defaultBranchId || MAIN_BRANCH_ID,
      branchIds: Array.isArray(user.branchIds)
        ? clone(user.branchIds)
        : administrator
          ? ["ALL"]
          : [MAIN_BRANCH_ID]
    };
  });
}

function buildStations() {
  // Estaciones son configuracion operativa por sucursal.
  return stationsSeed.map((station) => ({
    ...clone(station),
    branchId: station.branchId || MAIN_BRANCH_ID
  }));
}

function emptyCashBox(branchId = MAIN_BRANCH_ID) {
  return {
    branchId,
    open: false,
    user: null,
    opening: 0,
    openedAt: null,
    closedAt: null,
    movements: [],
    voids: [],
    countedAmount: null,
    difference: null
  };
}

/* ==========================================================================
   ESTADO INICIAL
   ========================================================================== */

function seed() {
  const branches = buildBranches();

  return {
    __v: VERSION,
    __createdAt: nowIso(),
    __updatedAt: nowIso(),

    /* ==================== ESTRUCTURA EMPRESARIAL ==================== */
    branches,

    // IMPORTANTE: catalogo vacio a proposito.
    // Las categorias se crean exclusivamente desde Configuracion.
    categories: [],

    /* ==================== RESTAURANT / VENTAS ==================== */
    tables: buildTables(),
    menuItems: buildMenuItems(),

    // LEGACY: requerido temporalmente por las pantallas de Ventas actuales.
    // No representa el nuevo catalogo state.categories.
    menuCategories: clone(menuCategories),

    kitchenOrders: buildKitchenOrders(),
    salesHistory: [],

    /* ==================== INVENTARIO ==================== */
    inventory: buildInventory(),
    inventoryMovements: [],
    purchaseOrders: [],
    purchaseSuggestions: [],
    wasteRecords: buildWasteRecords(),
    coffeeLots: buildCoffeeLots(),

    /* ==================== CLIENTES ==================== */
    customers: buildCustomers(),
    reservations: buildReservations(),
    loyaltyConfig: clone(loyaltyConfigSeed),
    rewards: buildRewards(),
    loyaltyMovements: buildLoyaltyMovements(),

    /* ==================== OPERACION / CONFIGURACION ==================== */
    users: buildUsers(),
    stations: buildStations(),

    /* ==================== AUDITORIA / REPORTES ==================== */
    auditEvents: clone(auditEvents),
    reportOperations: clone(reportOperationsSeed),

    /* ==================== CAJA ==================== */
    // `cashBox` se conserva por compatibilidad con la version actual.
    // `cashBoxes` prepara el modelo multi-sucursal para la futura Caja.
    cashBox: emptyCashBox(MAIN_BRANCH_ID),
    cashBoxes: [emptyCashBox(MAIN_BRANCH_ID)],

    /* ==================== NEGOCIO ==================== */
    settings: {
      business: "Cafe Fusiones E.I.R.L.",
      ruc: "20512345678",
      igv: 18,
      currency: "PEN",
      address: "Jr. Ortiz Arrieta 779, Chachapoyas",
      language: "es",
      loyaltyEnabled: true,
      kdsEnabled: true,

      // Contexto transversal.
      activeBranchId: MAIN_BRANCH_ID,

      // Las categorias nunca se autogeneran a partir de los registros.
      categoryManagement: "configuration",
      autoCreateCategories: false
    },

    /* ==================== SECUENCIAS ==================== */
    sequences: {
      order: 1045,
      sale: 1042,
      waste: 4,
      customer: customers.length + 1,
      reservation: reservations.length + 1,
      inventoryMovement: 5,
      branch: 2,
      category: 1
    }
  };
}

/* ==========================================================================
   NORMALIZACION / MIGRACION
   ========================================================================== */

function normalizeBranches(state, base) {
  if (!Array.isArray(state.branches) || !state.branches.length) {
    state.branches = clone(base.branches);
  }

  state.branches = state.branches.map((branch, index) => ({
    id: branch.id || `SUC-${String(index + 1).padStart(2, "0")}`,
    code: branch.code || "",
    name: branch.name || `Sucursal ${index + 1}`,
    shortName: branch.shortName || branch.name || `Sucursal ${index + 1}`,
    address: branch.address || "",
    city: branch.city || "",
    region: branch.region || "",
    country: branch.country || "Perú",
    status: normalizeBranchStatus(branch.status),
    isMain: branch.isMain === true,
    createdAt: branch.createdAt || state.__createdAt || nowIso(),
    updatedAt: branch.updatedAt || nowIso(),
    ...branch
  }));

  // Garantiza una sola principal si hay inconsistencias.
  const mainBranches = state.branches.filter((branch) => branch.isMain);

  if (!mainBranches.length && state.branches.length) {
    state.branches[0].isMain = true;
  } else if (mainBranches.length > 1) {
    let firstFound = false;
    state.branches.forEach((branch) => {
      if (!branch.isMain) return;
      if (!firstFound) {
        firstFound = true;
      } else {
        branch.isMain = false;
      }
    });
  }

  const preferred = state.settings?.activeBranchId;

  if (
    !preferred ||
    !branchExists(state.branches, preferred) ||
    normalizeBranchStatus(
      state.branches.find((branch) => branch.id === preferred)?.status
    ) !== "Activa"
  ) {
    state.settings.activeBranchId = firstActiveBranchId(state.branches);
  }
}

function normalizeCategories(state) {
  // No migramos automaticamente strings como "Cafe", "Lacteos", etc.
  // a categorias configurables porque el usuario decidio que estas deben
  // crearse desde Configuracion.
  if (!Array.isArray(state.categories)) {
    state.categories = [];
  }

  const allowedScopes = new Set(CATEGORY_SCOPES.map((scope) => scope.id));

  state.categories = state.categories
    .filter((category) => category && typeof category === "object")
    .map((category, index) => ({
      id: category.id || `CAT-${String(index + 1).padStart(4, "0")}`,
      scope: String(category.scope || "").trim(),
      name: String(category.name || "").trim(),
      code: String(category.code || "").trim(),
      status: normalizeCategoryStatus(category.status),
      order: Number(category.order || 0),
      branchIds:
        Array.isArray(category.branchIds) && category.branchIds.length
          ? clone(category.branchIds)
          : ["ALL"],
      createdAt: category.createdAt || nowIso(),
      updatedAt: category.updatedAt || nowIso(),
      ...category
    }))
    .filter((category) =>
      category.scope &&
      category.name &&
      allowedScopes.has(category.scope)
    );
}

function attachBranchIds(state) {
  const fallback = state.settings.activeBranchId || MAIN_BRANCH_ID;

  const simpleBranchArrays = [
    "tables",
    "kitchenOrders",
    "inventory",
    "inventoryMovements",
    "purchaseOrders",
    "purchaseSuggestions",
    "wasteRecords",
    "coffeeLots",
    "reservations"
  ];

  simpleBranchArrays.forEach((key) => {
    if (!Array.isArray(state[key])) return;

    state[key] = state[key].map((record) => ({
      ...record,
      branchId: record.branchId || fallback
    }));
  });

  if (Array.isArray(state.loyaltyMovements)) {
    state.loyaltyMovements = state.loyaltyMovements.map((movement) => ({
      ...movement,
      branchId: movement.branchId || fallback
    }));
  }

  if (Array.isArray(state.rewards)) {
    state.rewards = state.rewards.map((reward) => ({
      ...reward,
      branchId: reward.branchId || "ALL"
    }));
  }

  if (Array.isArray(state.stations)) {
    state.stations = state.stations.map((station) => ({
      ...station,
      branchId: station.branchId || fallback
    }));
  }

  if (Array.isArray(state.users)) {
    state.users = state.users.map((user) => {
      const administrator = String(user.role || "")
        .toLowerCase()
        .includes("administr");

      return {
        ...user,
        defaultBranchId: user.defaultBranchId || fallback,
        branchIds:
          Array.isArray(user.branchIds) && user.branchIds.length
            ? user.branchIds
            : administrator
              ? ["ALL"]
              : [fallback]
      };
    });
  }

  if (Array.isArray(state.customers)) {
    state.customers = state.customers.map((customer) => ({
      ...customer,
      originBranchId: customer.originBranchId || customer.branchId || fallback,
      lastBranchId:
        customer.lastBranchId ||
        customer.originBranchId ||
        customer.branchId ||
        fallback
    }));
  }

  if (Array.isArray(state.menuItems)) {
    state.menuItems = state.menuItems.map((item) => ({
      ...item,
      branchIds:
        Array.isArray(item.branchIds) && item.branchIds.length
          ? item.branchIds
          : ["ALL"]
    }));
  }

  // Arrays que pueden ser creados por otros modulos despues del seed.
  [
    "orderDrafts",
    "cashQueue",
    "dispatchOrders",
    "changeRequests",
    "inventoryLots",
    "productionBatches"
  ].forEach((key) => {
    if (!Array.isArray(state[key])) return;

    state[key] = state[key].map((record) => ({
      ...record,
      branchId: record.branchId || fallback
    }));
  });
}

function normalizeTables(state) {
  state.tables = state.tables.map((table) => ({
    ...table,
    items: Array.isArray(table.items) ? table.items : [],
    customerId: table.customerId || null,
    openedAt: table.openedAt || null,
    branchId: table.branchId || state.settings.activeBranchId || MAIN_BRANCH_ID
  }));
}

function normalizeWaste(state) {
  state.wasteRecords = state.wasteRecords.map((record, index) => ({
    id: record.id || `MER-${String(index + 1).padStart(3, "0")}`,
    type: record.type || "Insumo",
    status: record.status || "Registrada",
    ...record,
    branchId: record.branchId || state.settings.activeBranchId || MAIN_BRANCH_ID,
    date: wasteDate(record)
  }));
}

function normalizeLoyalty(state, base, saved) {
  state.loyaltyConfig = {
    ...base.loyaltyConfig,
    ...(saved.loyaltyConfig || state.loyaltyConfig || {}),
    levels: Array.isArray(saved.loyaltyConfig?.levels)
      ? saved.loyaltyConfig.levels
      : Array.isArray(state.loyaltyConfig?.levels)
        ? state.loyaltyConfig.levels
        : clone(base.loyaltyConfig.levels)
  };
}

function normalizeCash(state, base) {
  state.cashBox = {
    ...base.cashBox,
    ...(state.cashBox || {}),
    branchId:
      state.cashBox?.branchId ||
      state.settings.activeBranchId ||
      MAIN_BRANCH_ID,
    movements: Array.isArray(state.cashBox?.movements)
      ? state.cashBox.movements
      : [],
    voids: Array.isArray(state.cashBox?.voids)
      ? state.cashBox.voids
      : []
  };

  if (!Array.isArray(state.cashBoxes)) {
    state.cashBoxes = [];
  }

  state.branches.forEach((branch) => {
    if (state.cashBoxes.some((box) => box.branchId === branch.id)) return;
    state.cashBoxes.push(emptyCashBox(branch.id));
  });

  state.cashBoxes = state.cashBoxes.map((box) => ({
    ...emptyCashBox(box.branchId || state.settings.activeBranchId),
    ...box,
    movements: Array.isArray(box.movements) ? box.movements : [],
    voids: Array.isArray(box.voids) ? box.voids : []
  }));
}

/**
 * Hidrata cualquier estado previo conocido y completa la estructura V7.
 * A diferencia del V6, no se elimina el localStorage solo porque cambio
 * la version del esquema.
 */
function hydrateState(saved = {}) {
  const base = seed();

  const next = {
    ...base,
    ...saved,
    __v: VERSION,
    __createdAt: saved.__createdAt || base.__createdAt,
    __updatedAt: saved.__updatedAt || nowIso(),
    settings: {
      ...base.settings,
      ...(saved.settings || {})
    },
    cashBox: {
      ...base.cashBox,
      ...(saved.cashBox || {})
    },
    sequences: {
      ...base.sequences,
      ...(saved.sequences || {})
    }
  };

  // Arrays esenciales. No incluimos categorias en esta recuperación porque
  // su ausencia debe significar "sin categorias configuradas".
  const arrayKeys = [
    "branches",
    "tables",
    "menuItems",
    "menuCategories",
    "kitchenOrders",
    "salesHistory",
    "inventory",
    "inventoryMovements",
    "purchaseOrders",
    "purchaseSuggestions",
    "wasteRecords",
    "coffeeLots",
    "customers",
    "reservations",
    "rewards",
    "loyaltyMovements",
    "users",
    "stations",
    "auditEvents"
  ];

  arrayKeys.forEach((key) => {
    if (!Array.isArray(next[key])) {
      next[key] = clone(base[key]);
    }
  });

  normalizeBranches(next, base);
  normalizeCategories(next);
  attachBranchIds(next);
  normalizeTables(next);
  normalizeWaste(next);
  normalizeLoyalty(next, base, saved);
  normalizeCash(next, base);

  next.reportOperations = {
    ...base.reportOperations,
    ...(saved.reportOperations || next.reportOperations || {})
  };

  // Marketing se retiro del alcance operativo del ERP.
  // Si existe de un localStorage V6, lo limpiamos durante la migracion.
  delete next.campaigns;
  delete next.marketingMetrics;

  // Politica central de categorias.
  next.settings.categoryManagement = "configuration";
  next.settings.autoCreateCategories = false;

  return next;
}

/* ==========================================================================
   PERSISTENCIA
   ========================================================================== */

function readRawState() {
  try {
    return localStorage.getItem(STATE_KEY);
  } catch {
    return memoryState ? JSON.stringify(memoryState) : null;
  }
}

function writeRawState(state) {
  const serialized = JSON.stringify(state);

  try {
    localStorage.setItem(STATE_KEY, serialized);
    memoryState = clone(state);
    return true;
  } catch {
    memoryState = clone(state);
    return false;
  }
}

export function getState() {
  try {
    const raw = readRawState();

    if (raw) {
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        const hydrated = hydrateState(parsed);
        writeRawState(hydrated);
        return hydrated;
      }
    }
  } catch {
    // Estado corrupto: se re-siembra abajo.
  }

  const fresh = seed();
  writeRawState(fresh);
  return fresh;
}

export function saveState(state) {
  if (!state || typeof state !== "object") return false;

  // Guardar tambien normaliza la estructura transversal para que cualquier
  // pagina antigua que agregue registros sin branchId no rompa multi-sucursal.
  const normalized = hydrateState(state);

  // Conservamos la misma referencia recibida para no romper controladores
  // que mantienen `const state = getState()`.
  Object.keys(state).forEach((key) => {
    if (!(key in normalized)) delete state[key];
  });
  Object.assign(state, normalized);

  state.__v = VERSION;
  state.__updatedAt = nowIso();

  return writeRawState(state);
}

export function resetState() {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch {
    // fallback memoria
  }

  memoryState = null;

  const fresh = seed();
  saveState(fresh);
  return fresh;
}

/* ==========================================================================
   SUCURSALES
   ========================================================================== */

export function activeBranches(state) {
  return (state?.branches || [])
    .filter((branch) => normalizeBranchStatus(branch.status) === "Activa")
    .sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return String(a.name || "").localeCompare(String(b.name || ""), "es");
    });
}

export function getActiveBranch(state) {
  const branchId =
    state?.settings?.activeBranchId ||
    firstActiveBranchId(state?.branches || []);

  return (
    (state?.branches || []).find((branch) => branch.id === branchId) ||
    activeBranches(state)[0] ||
    null
  );
}

export function setActiveBranch(state, branchId) {
  if (!state || !branchId) return false;

  const branch = (state.branches || []).find(
    (item) =>
      item.id === branchId &&
      normalizeBranchStatus(item.status) === "Activa"
  );

  if (!branch) return false;

  state.settings ||= {};
  state.settings.activeBranchId = branch.id;
  saveState(state);

  return true;
}

export function branchById(state, branchId) {
  return (state?.branches || []).find((branch) => branch.id === branchId) || null;
}

/* ==========================================================================
   CATEGORIAS DINAMICAS
   ========================================================================== */

/**
 * Devuelve las categorias configuradas para un ambito.
 * No infiere ni crea categorias a partir de productos/insumos.
 */
export function categoriesByScope(
  state,
  scope,
  {
    activeOnly = true,
    branchId = null
  } = {}
) {
  const targetScope = String(scope || "").trim();

  return (state?.categories || [])
    .filter((category) => category.scope === targetScope)
    .filter((category) =>
      !activeOnly || normalizeCategoryStatus(category.status) === "Activa"
    )
    .filter((category) => {
      if (!branchId) return true;

      const branchIds = Array.isArray(category.branchIds)
        ? category.branchIds
        : ["ALL"];

      return branchIds.includes("ALL") || branchIds.includes(branchId);
    })
    .sort((a, b) =>
      Number(a.order || 0) - Number(b.order || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""), "es")
    );
}

/**
 * Compatibilidad con Inventario.
 * V7 devuelve SOLO categorias creadas desde Configuracion.
 */
export function inventoryCategories(state) {
  const branchId = state?.settings?.activeBranchId || null;

  return categoriesByScope(state, "inventory", { branchId })
    .map((category) => category.name);
}

/**
 * Helper futuro para Ventas/Carta cuando migremos menuCategories al nuevo
 * catalogo dinamico.
 */
export function menuCategoryNames(
  state,
  {
    includeAll = true,
    branchId = state?.settings?.activeBranchId || null
  } = {}
) {
  const names = categoriesByScope(state, "menu", { branchId })
    .map((category) => category.name);

  return includeAll ? ["Todos", ...names] : names;
}

/**
 * Categorías para ordenar la carta pública / Landing sin alterar la
 * organización operativa del POS.
 */
export function publicMenuCategoryNames(
  state,
  {
    includeAll = false,
    branchId = state?.settings?.activeBranchId || null
  } = {}
) {
  const names = categoriesByScope(state, "public_menu", { branchId })
    .map((category) => category.name);

  return includeAll ? ["Todos", ...names] : names;
}

/* ==========================================================================
   IDS / AUDITORIA
   ========================================================================== */

/** Generador simple de IDs para nuevos registros del prototipo. */
export function nextId(state, sequenceName, prefix, pad = 4) {
  state.sequences ||= {};

  const current = Number(state.sequences[sequenceName] || 1);
  state.sequences[sequenceName] = current + 1;

  return `${prefix}-${String(current).padStart(pad, "0")}`;
}

/**
 * Registra una accion en la bitacora general.
 * Si el controlador no informa branchId, se usa la sucursal activa.
 */
export function addAuditEvent(
  state,
  {
    user,
    action,
    module,
    detail = "",
    branchId = null
  }
) {
  state.auditEvents ||= [];

  const resolvedBranchId =
    branchId ||
    state.settings?.activeBranchId ||
    MAIN_BRANCH_ID;

  const event = {
    id: `AUD-${Date.now()}`,
    time: new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit"
    }),
    at: nowIso(),
    branchId: resolvedBranchId,
    user: user || "Sistema",
    action: action || "Accion",
    module: module || "General",
    detail
  };

  state.auditEvents.unshift(event);
  saveState(state);

  return event;
}

/** Limpia unicamente el estado del prototipo desde consola si fuera necesario. */
export function clearPrototypeState() {
  return resetState();
}
