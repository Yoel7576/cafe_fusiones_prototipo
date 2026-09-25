// Cafe Fusiones - Plano del salon (componente compartido).
//
// Lo usan dos pantallas con el MISMO aspecto visual:
//   - Ventas > Salon        -> modo "lectura": estados por color, sin arrastre.
//   - Configuracion > Mesas -> modo "editor": arrastre y seleccion (solo las
//     zonas se redimensionan; las mesas tienen un tamano unico).
//
// Todo se posiciona en porcentaje sobre un lienzo 16:10. Los estilos viven en
// css/components/floorplan.css, que ambas paginas enlazan.
import { escapeHtml, money } from "../core/utils.js";
import { PLANO_GRID, TAMANO_MESA } from "../data/plano.js";

export { PLANO_GRID };

/** Ajusta un valor a la grilla del plano. */
export function snapPlano(valor, paso = PLANO_GRID) {
  return Math.round(Number(valor || 0) / paso) * paso;
}

/** Tamano de una mesa: es el mismo para todas, sin importar capacidad ni forma. */
export function tamanoMesa() {
  return { ...TAMANO_MESA };
}

/**
 * Normaliza el mapa de una mesa: la lleva a la grilla y le aplica el tamano
 * unico, para que todas las mesas se vean uniformes.
 */
export function normalizarMapaMesa(table) {
  const base = table.map || { x: 45, y: 45 };
  const { w, h } = tamanoMesa();

  return {
    x: acotar(snapPlano(base.x), 0, 100 - w),
    y: acotar(snapPlano(base.y), 0, 100 - h),
    w,
    h,
    shape: base.shape === "round" ? "round" : "rect"
  };
}

export function acotar(valor, minimo, maximo) {
  return Math.min(Math.max(Number(valor || 0), minimo), Math.max(minimo, maximo));
}

// Icono de capacidad: ocupa mucho menos que la palabra "pers.".
const iconoPersonas = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>';

function estilo(map) {
  return `left:${map.x}%;top:${map.y}%;width:${map.w}%;height:${map.h}%;`;
}

/* ==========================================================================
   ZONAS
   ========================================================================== */

/**
 * @param {object} zone
 * @param {object} opciones
 * @param {number} [opciones.pending]     pedidos pendientes (solo estaciones)
 * @param {boolean} [opciones.editable]   pinta el tirador y permite seleccionar
 * @param {boolean} [opciones.selected]
 */
export function zonaHtml(zone, { pending = null, editable = false, selected = false } = {}) {
  const tipo = zone.type || "area";
  const clases = [
    "floor-item",
    "floor-item--zone",
    `floor-item--${tipo}`,
    selected ? "is-selected" : ""
  ].filter(Boolean).join(" ");

  const detalle = tipo === "station" && pending !== null
    ? `<small>${pending} pendiente${pending === 1 ? "" : "s"}</small>`
    : "";

  const cuerpo = `<span class="floor-item__name">${escapeHtml(zone.name)}</span>${detalle}`;
  const tirador = editable ? '<i class="floor-item__handle" data-plan-resize aria-hidden="true"></i>' : "";

  // En Ventas la estacion es un boton (abre su pantalla); el resto no es
  // interactivo. En el editor todo es un div arrastrable.
  if (!editable && tipo === "station") {
    return `<button class="${clases}" style="${estilo(zone.map)}" type="button"
      data-open-station="${escapeHtml(zone.name)}"
      title="Abrir ${escapeHtml(zone.name)}">${cuerpo}</button>`;
  }

  const datos = editable
    ? `data-plan-item="zona" data-plan-id="${escapeHtml(zone.id)}" role="button" tabindex="0"`
    : "";

  return `<div class="${clases}" style="${estilo(zone.map)}" ${datos}
    title="${escapeHtml(zone.name)}">${cuerpo}${tirador}</div>`;
}

/* ==========================================================================
   MESAS
   ========================================================================== */

/** Color de estado de una mesa. "ready" gana si hay algo listo para servir. */
export function tonoMesa(table) {
  if (table.items?.some((item) => item.status === "Listo")) return "ready";
  if (table.status === "Reservada") return "reserved";
  if (table.status === "Libre") return "free";
  return "busy";
}

export function etiquetaMesa(table) {
  // El numero sin la palabra "Mesa": en el plano se lee mejor.
  return String(table.name || table.id).replace(/^Mesa\s+/i, "");
}

/**
 * @param {object} table
 * @param {object} opciones
 * @param {boolean} [opciones.editable]
 * @param {boolean} [opciones.selected]
 * @param {number}  [opciones.total]   consumo abierto, si la mesa esta ocupada
 */
export function mesaHtml(table, { editable = false, selected = false, total = 0 } = {}) {
  // El tamano guardado se ignora: las mesas de estados viejos tambien se ven
  // con el tamano unico.
  const map = { ...(table.map || {}), ...tamanoMesa() };
  const tono = editable ? "free" : tonoMesa(table);
  const clases = [
    "floor-item",
    "floor-item--table",
    `is-${tono}`,
    map.shape === "round" ? "is-round" : "",
    selected ? "is-selected" : ""
  ].filter(Boolean).join(" ");

  // En una mesa de 2 personas no entra "2 pers." sin truncarse: la capacidad va
  // como icono + numero, y el consumo sin el prefijo "S/ ".
  const ocupada = !editable && table.status === "Ocupada" && total;
  const detalle = ocupada
    ? `<small class="floor-item__meta">${escapeHtml(money(total).replace(/^S\/\s*/, ""))}</small>`
    : `<small class="floor-item__meta floor-item__seats">${iconoPersonas}${Number(table.seats || 0)}</small>`;

  const cuerpo = `
    <strong class="floor-item__code">${escapeHtml(etiquetaMesa(table))}</strong>
    ${detalle}`;

  if (editable) {
    return `<div class="${clases}" style="${estilo(map)}"
      data-plan-item="mesa" data-plan-id="${escapeHtml(table.id)}" role="button" tabindex="0"
      title="${escapeHtml(table.name || table.id)}">${cuerpo}</div>`;
  }

  return `<button class="${clases}" style="${estilo(map)}" type="button"
    data-table-open="${escapeHtml(table.id)}"
    title="${escapeHtml(table.name || table.id)} · ${escapeHtml(table.status || "Libre")}">${cuerpo}</button>`;
}

/* ==========================================================================
   LIENZO
   ========================================================================== */

/**
 * Arma el lienzo completo. El muro perimetral es el borde del propio lienzo y
 * las entradas se dibujan como aberturas sobre ese muro.
 */
export function lienzoHtml(contenido, { editable = false } = {}) {
  return `<div class="floorplan ${editable ? "floorplan--editable" : ""}"
    ${editable ? "data-plan-canvas" : ""}
    aria-label="Plano del salon de Cafe Fusiones">${contenido}</div>`;
}

/** Leyenda de estados, compartida por las dos pantallas. */
export function leyendaHtml() {
  const estados = [
    ["free", "Libre"],
    ["busy", "Ocupada"],
    ["reserved", "Reservada"],
    ["ready", "Lista"]
  ];

  return estados
    .map(([tono, etiqueta]) =>
      `<span class="floor-legend__item"><i class="floor-legend__dot is-${tono}"></i>${etiqueta}</span>`)
    .join("");
}
