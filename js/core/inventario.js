// Cafe Fusiones - Consumo de inventario por venta.
//
// Cuando se cierra una venta, cada producto descuenta sus insumos:
//   - Producto con receta  -> descuenta cada ingrediente por la cantidad vendida.
//   - Producto de despacho directo (botellas, latas) -> descuenta su insumo.
//   - Producto sin receta ni insumo -> no descuenta y se informa.
//
// REGLA: la falta de stock NO bloquea la venta. Cafe Fusiones todavia no cargo
// su inventario inicial, asi que el stock puede quedar en negativo; eso se
// devuelve como alerta para avisar en pantalla y que se regularice.
import { nextId } from "./storage.js";

/** Receta activa de un producto (una receta puede cubrir varios productos). */
export function recetaDeProducto(state, productId) {
  return (state.recipes || []).find(
    (receta) => receta.productId === productId || (receta.productIds || []).includes(productId)
  ) || null;
}

/** Costo directo de insumos de un producto, calculado con el inventario actual. */
export function costoDeProducto(state, productId) {
  const receta = recetaDeProducto(state, productId);

  if (receta) {
    return (receta.ingredients || []).reduce((suma, ingrediente) => {
      const insumo = (state.inventory || []).find((item) => item.id === ingrediente.inventoryId);
      return suma + Number(ingrediente.qty || 0) * Number(insumo?.cost || 0);
    }, 0);
  }

  const producto = (state.menuItems || []).find((item) => item.id === productId);
  if (producto?.inventoryItemId) {
    const insumo = (state.inventory || []).find((item) => item.id === producto.inventoryItemId);
    return Number(insumo?.cost || 0);
  }

  return 0;
}

function registrarMovimiento(state, insumo, { qty, origin, reference, user, branchId }) {
  const antes = Number(insumo.stock || 0);
  const despues = Number((antes - qty).toFixed(4));
  insumo.stock = despues;

  const movimiento = {
    id: nextId(state, "inventoryMovement", "MOV", 4),
    at: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    type: "Salida",
    direction: "Salida",
    reason: "Venta / receta",
    itemId: insumo.id,
    inventoryId: insumo.id,
    item: insumo.item,
    qty,
    unit: insumo.unit || "un",
    unitCost: Number(insumo.cost || 0),
    cost: Number((qty * Number(insumo.cost || 0)).toFixed(4)),
    before: antes,
    after: despues,
    origin,
    reference,
    user,
    branchId: branchId || insumo.branchId || null
  };

  state.inventoryMovements ||= [];
  state.inventoryMovements.unshift(movimiento);
  return movimiento;
}

/**
 * Descuenta el inventario de una lista de lineas vendidas.
 *
 * @param {object} state
 * @param {object} opciones
 * @param {Array}  opciones.items    lineas del pedido ({ id, name, qty, ... })
 * @param {string} opciones.origin   id de la venta o del pedido
 * @param {string} opciones.user
 * @param {string} [opciones.table]
 * @param {string} [opciones.branchId]
 * @returns {{ movimientos: Array, enNegativo: Array, bajoMinimo: Array, sinReceta: Array }}
 */
export function consumirInventarioPorVenta(state, { items = [], origin, user, table, branchId } = {}) {
  const movimientos = [];
  const sinReceta = [];
  const tocados = new Set();

  items.forEach((linea) => {
    // Las lineas de despacho directo ya descontaron al entregarse en el KDS.
    if (linea.inventoryApplied) return;

    const cantidad = Number(linea.qty || 0);
    if (!cantidad) return;

    const productId = linea.productId || linea.id;
    const producto = (state.menuItems || []).find((item) => item.id === productId);
    const receta = recetaDeProducto(state, productId);
    const referencia = `${linea.name || productId} x${cantidad}`;

    if (receta) {
      (receta.ingredients || []).forEach((ingrediente) => {
        const insumo = (state.inventory || []).find((item) => item.id === ingrediente.inventoryId);
        if (!insumo) return;

        const consumo = Number((Number(ingrediente.qty || 0) * cantidad).toFixed(4));
        if (!consumo) return;

        movimientos.push(registrarMovimiento(state, insumo, {
          qty: consumo, origin, reference: referencia, user, branchId
        }));
        tocados.add(insumo.id);
      });
      linea.inventoryApplied = true;
      return;
    }

    const insumoDirecto = producto?.inventoryItemId
      ? (state.inventory || []).find((item) => item.id === producto.inventoryItemId)
      : null;

    if (insumoDirecto) {
      movimientos.push(registrarMovimiento(state, insumoDirecto, {
        qty: cantidad, origin, reference: referencia, user, branchId
      }));
      tocados.add(insumoDirecto.id);
      linea.inventoryApplied = true;
      return;
    }

    // Sin receta ni insumo asociado: no hay de que descontar.
    sinReceta.push(linea.name || productId);
  });

  const afectados = (state.inventory || []).filter((insumo) => tocados.has(insumo.id));

  return {
    movimientos,
    enNegativo: afectados.filter((insumo) => Number(insumo.stock || 0) < 0),
    bajoMinimo: afectados.filter(
      (insumo) => Number(insumo.stock || 0) >= 0
        && Number(insumo.min || 0) > 0
        && Number(insumo.stock || 0) <= Number(insumo.min || 0)
    ),
    sinReceta: [...new Set(sinReceta)]
  };
}

/** Mensaje corto para el toast tras descontar el inventario. */
export function resumenDeConsumo({ enNegativo, bajoMinimo, sinReceta }) {
  const avisos = [];

  if (enNegativo.length) {
    avisos.push(`${enNegativo.length} insumo${enNegativo.length === 1 ? "" : "s"} en negativo`);
  }
  if (bajoMinimo.length) {
    avisos.push(`${bajoMinimo.length} bajo el minimo`);
  }
  if (sinReceta.length) {
    avisos.push(`${sinReceta.length} producto${sinReceta.length === 1 ? "" : "s"} sin receta`);
  }

  return avisos.join(" · ");
}
