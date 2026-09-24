// Cafe Fusiones - Puente entre el sistema y la landing publica.
//
// La landing NO tiene sesion: lee el estado en modo solo lectura (no escribe en
// localStorage ni pasa por requireAuth). Es el mismo origen, asi que ve lo que
// Administracion guarda en el navegador del local.
//
// Si el navegador del visitante todavia no tiene estado (por ejemplo, alguien
// que entra a la web desde su casa), se cae a los datos estaticos de
// site-traceability.js y site-menu.js para que la landing nunca quede vacia.
import { readPublicState } from "../core/storage.js";
import { traceableProducts } from "./site-traceability.js";
import { siteMenuCategories } from "./site-menu.js";

function estado() {
  try {
    return readPublicState();
  } catch {
    return null;
  }
}

function normalizarCodigo(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, "_").toLowerCase();
}

/* ==========================================================================
   TRAZABILIDAD
   ========================================================================== */

/** Lotes publicados en la web, en el formato que espera la landing. */
export function lotesPublicos() {
  const state = estado();
  const todos = state?.coffeeLots || [];

  // El respaldo estatico es para el visitante cuyo navegador nunca abrio el
  // sistema. Si hay lotes cargados y ninguno esta publicado, la web no muestra
  // ninguno: despublicar tiene que surtir efecto.
  if (!todos.length) return traceableProducts;

  const lotes = todos.filter((lote) => lote.publishWeb !== false);

  return lotes.map((lote) => ({
    code: lote.code || lote.lotCode || lote.id,
    lotCode: lote.lotCode || lote.code || lote.id,
    name: lote.name || lote.producer || "Lote de cafe",
    type: lote.type || "Granos de cafe de especialidad",
    region: lote.region || "",
    valley: lote.valley || lote.origin || "",
    altitude: lote.altitude || "",
    description: lote.description || "",
    image: lote.image || "../assets/img/site/hero-3.webp",
    producerImage: lote.producerImage || "../assets/img/menu-cafe.jpg",
    variety: lote.variety || "",
    roast: lote.roast || "",
    producer: lote.producer || "",
    received: lote.received || "",
    roastedAt: lote.roastedAt || "",
    stock: Number(lote.stock || 0),
    unit: lote.unit || "kg",
    preparations: Array.isArray(lote.preparations) ? lote.preparations : [],
    storage: lote.storage || "",
    steps: Array.isArray(lote.steps) ? lote.steps : []
  }));
}

/** Busca un lote publicado por su codigo. */
export function buscarLotePublico(codigo) {
  const objetivo = normalizarCodigo(codigo);
  if (!objetivo) return null;

  return lotesPublicos().find((lote) =>
    normalizarCodigo(lote.code) === objetivo || normalizarCodigo(lote.lotCode) === objetivo
  ) || null;
}

/* ==========================================================================
   CARTA PUBLICA
   ========================================================================== */

/**
 * Platos marcados como "Publicar en landing" en Administracion, agrupados por
 * categoria y en el orden de la carta.
 */
export function cartaPublica() {
  const state = estado();
  const menu = state?.menuItems || [];
  if (!menu.length) return [];

  const platos = menu.filter(
    (item) => item.publishLanding !== false && item.status !== "Inactivo"
  );

  const orden = (state?.menuCategories || []).filter((nombre) => nombre !== "Todos");
  const porCategoria = new Map();

  platos.forEach((plato) => {
    const categoria = plato.category || "Otros";
    if (!porCategoria.has(categoria)) porCategoria.set(categoria, []);
    porCategoria.get(categoria).push(plato);
  });

  const indice = (nombre) => {
    const posicion = orden.indexOf(nombre);
    return posicion === -1 ? orden.length : posicion;
  };

  return [...porCategoria.entries()]
    .sort((a, b) => indice(a[0]) - indice(b[0]))
    .map(([titulo, items]) => ({ titulo, items }));
}

/** Imagen de respaldo por categoria, tomada de la carta estatica del sitio. */
export function imagenDeCategoria(titulo) {
  const normal = (texto) => String(texto || "").toLowerCase();
  const encontrada = siteMenuCategories.find((cat) =>
    normal(cat.title).includes(normal(titulo)) || normal(titulo).includes(normal(cat.title))
  );
  return encontrada?.image || "../assets/img/site/menu-cafe.jpg";
}

export { siteMenuCategories };
