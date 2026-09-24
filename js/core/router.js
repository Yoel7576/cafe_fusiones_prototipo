// Cafe Fusiones - Navegacion entre pantallas (regla 10).
// En el modelo multipagina, cada modulo es su propio archivo HTML en /pages/.
import { navItems } from "../data/data.js";

export const NAV = navItems;

// Perfiles reales de Cafe Fusiones segun "USUARIOS Y PERFILES DEL SISTEMA.docx".
// Los permisos salen de las funciones que el documento asigna a cada cargo.
export const rolePermissions = {
  // Direccion general: supervisa todas las areas del negocio.
  Gerencia: ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes", "admin"],

  // Perfil tecnico del sistema (configuracion y soporte).
  Administrador: ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes", "admin"],

  // Soporte administrativo: caja chica, turnos y control de existencias.
  "Asistente de Gerencia": ["dashboard", "ventas", "caja", "inventario", "clientes", "reportes"],

  // Registro contable, obligaciones tributarias y estados financieros.
  Contadora: ["dashboard", "caja", "reportes"],

  // Cobro, cuadre de caja, comprobantes y atencion inicial al cliente.
  Cajero: ["dashboard", "ventas", "caja", "clientes"],

  // Prepara bebidas y controla el stock de su estacion. No cobra.
  Barra: ["dashboard", "ventas", "inventario"],

  // Atiende salon y toma pedidos. Nunca cobra.
  Mozo: ["dashboard", "ventas", "clientes"],

  // Elabora los platos y controla el inventario diario de cocina.
  Cocina: ["dashboard", "ventas", "inventario"],

  // Perfil transversal de apoyo a operaciones.
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
