// Cafe Fusiones - Navegacion entre pantallas (regla 10).
// En el modelo multipagina, cada modulo es su propio archivo HTML en /pages/.
import { navItems } from "../data/data.js";

export const NAV = navItems;

export const rolePermissions = {
  Gerencia: ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes"],
  Administrador: ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes", "admin"],
  Cajero: ["dashboard", "ventas", "caja", "clientes"],
  Cocina: ["dashboard", "ventas"],
  Operaciones: ["dashboard", "ventas", "inventario", "clientes"]
};

export function allowedIds(role) {
  return rolePermissions[role] || rolePermissions.Gerencia;
}

export function canAccess(role, id) {
  return allowedIds(role).includes(id);
}

export function pageHref(id) {
  return `${id}.html`;
}

// Si el rol no puede ver la pantalla actual, lo mandamos a la primera permitida.
export function guardView(role, id) {
  if (canAccess(role, id)) return id;
  return allowedIds(role)[0] || "dashboard";
}
