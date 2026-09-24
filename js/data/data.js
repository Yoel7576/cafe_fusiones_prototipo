// Cafe Fusiones - Datos base del sistema.
//
// Este archivo ya NO contiene datos demo: solo la estructura real del negocio
// (usuarios por perfil, mesas del plano, estaciones, navegacion y empresa).
//
// La carta, las recetas, el inventario y los proveedores viven en sus propios
// modulos, generados desde los documentos entregados por el cliente:
//   js/data/carta.js        - CARTA 2025 A4 PLIEGO.pdf
//   js/data/recetas.js      - recetario con costos cafe fusiones.docx
//   js/data/inventario.js   - almacen no preparado + inventario diario de cocina
//   js/data/proveedores.js  - Proveedores Habituales e Insumos.docx
//
// Clientes, ventas, pedidos, reportes y auditoria arrancan VACIOS a proposito.

import { menuCategoriesSeed } from "./carta.js";

/* ==================== ACCESO DE DEMOSTRACION ==================== */
// Usuario unico para presentar el prototipo. Entra como Gerencia, que tiene
// acceso a todos los modulos. Los usuarios por perfil se gestionan aparte.
export const demoUser = {
  username: "CFUSIONES",
  password: "prototipo",
  name: "Cafe Fusiones",
  role: "Gerencia",
  email: "gerencia@cafefusiones.com",
  phone: "990285862",
  initials: "CF"
};

/* ==================== NAVEGACION ==================== */
export const navItems = [
  { id: "dashboard", label: "Inicio", icon: "layout", mobile: true },
  { id: "ventas", label: "Ventas", icon: "receipt", mobile: true },
  { id: "caja", label: "Caja", icon: "cash", mobile: true },
  { id: "inventario", label: "Inventario", icon: "boxes", mobile: false },
  { id: "clientes", label: "Clientes", icon: "users", mobile: false },
  { id: "reportes", label: "Reportes", icon: "chart", mobile: false },
  { id: "admin", label: "Administracion", icon: "shield", mobile: false }
];

/* ==================== CARTA (COMPATIBILIDAD) ==================== */
// Las pantallas de Ventas todavia esperan una lista plana con "Todos" al inicio.
// El catalogo real de categorias vive en state.categories y se administra desde
// Configuracion; esta lista se deriva de la carta para no duplicar el dato.
export const menuCategories = ["Todos", ...menuCategoriesSeed];

/* ==================== SALON ==================== */
// Fuente: "DISTRIBUCION CAFE FUSIONES.pdf". Diez mesas: 1 a 6 en el salon
// principal y A1 a A4 en el ambiente contiguo. La mesa 2 es redonda.
// Las coordenadas del plano se afinan en el editor de Configuracion > Mesas.
export const tables = [
  { id: "M1", name: "Mesa 1", area: "Salon principal", seats: 2, status: "Libre", map: { x: 72.1, y: 45.0, w: 6.8, h: 7.0, shape: "rect" } },
  { id: "M2", name: "Mesa 2", area: "Salon principal", seats: 2, status: "Libre", map: { x: 18.9, y: 49.0, w: 7.4, h: 7.4, shape: "round" } },
  { id: "M3", name: "Mesa 3", area: "Salon principal", seats: 4, status: "Libre", map: { x: 55.4, y: 29.4, w: 7.2, h: 11.4, shape: "rect" } },
  { id: "M4", name: "Mesa 4", area: "Salon principal", seats: 4, status: "Libre", map: { x: 64.2, y: 29.4, w: 14.8, h: 6.7, shape: "rect" } },
  { id: "M5", name: "Mesa 5", area: "Salon principal", seats: 2, status: "Libre", map: { x: 56.1, y: 43.0, w: 7.3, h: 6.6, shape: "rect" } },
  { id: "M6", name: "Mesa 6", area: "Salon principal", seats: 2, status: "Libre", map: { x: 67.6, y: 36.2, w: 7.0, h: 6.4, shape: "rect" } },
  { id: "A1", name: "Mesa A1", area: "Salon A", seats: 4, status: "Libre", map: { x: 74.2, y: 51.2, w: 7.7, h: 7.7, shape: "rect" } },
  { id: "A2", name: "Mesa A2", area: "Salon A", seats: 4, status: "Libre", map: { x: 45.8, y: 51.7, w: 8.6, h: 7.8, shape: "rect" } },
  { id: "A3", name: "Mesa A3", area: "Salon A", seats: 4, status: "Libre", map: { x: 20.6, y: 36.4, w: 6.8, h: 9.7, shape: "rect" } },
  { id: "A4", name: "Mesa A4", area: "Salon A", seats: 4, status: "Libre", map: { x: 20.8, y: 20.4, w: 6.7, h: 9.7, shape: "rect" } },
  // No es una mesa del plano: es el punto de venta para pedidos que no ocupan
  // salon (cafe en empaque, box lunch, catering y delivery).
  { id: "LLV", name: "Para llevar", area: "Sin salon", seats: 0, status: "Libre" }
];

/* ==================== ESTACIONES ==================== */
// Fuente: "OPERACION DEL NEGOCIO.docx" (areas operativas) y
// "Procesos Operativos Actuales.docx" (barra y cocina reciben la comanda).
export const stationsSeed = [
  { id: "EST-01", name: "Barra", type: "Barra", targetMinutes: 7, status: "Activa" },
  { id: "EST-02", name: "Cocina", type: "Cocina", targetMinutes: 15, status: "Activa" }
];

/* ==================== USUARIOS POR PERFIL ==================== */
// Fuente: "USUARIOS Y PERFILES DEL SISTEMA.docx".
// El documento describe funciones por cargo pero no nombres ni correos reales:
// se crea un usuario por perfil con el cargo como nombre. Cafe Fusiones debe
// reemplazarlos por las personas reales (ver docs/PENDIENTES_CLIENTE.md).
export const users = [
  { id: "USR-01", name: "Gerencia", email: "gerencia@cafefusiones.com", role: "Gerencia", station: "Administracion", status: "Activo", lastAccess: "", phone: "990285862" },
  { id: "USR-02", name: "Asistente de Gerencia", email: "asistencia@cafefusiones.com", role: "Asistente de Gerencia", station: "Administracion", status: "Activo", lastAccess: "", phone: "" },
  { id: "USR-03", name: "Contadora", email: "contabilidad@cafefusiones.com", role: "Contadora", station: "Administracion", status: "Activo", lastAccess: "", phone: "" },
  { id: "USR-04", name: "Caja", email: "caja@cafefusiones.com", role: "Cajero", station: "Caja", status: "Activo", lastAccess: "", phone: "" },
  { id: "USR-05", name: "Barra", email: "barra@cafefusiones.com", role: "Barra", station: "Barra", status: "Activo", lastAccess: "", phone: "" },
  { id: "USR-06", name: "Mozo", email: "salon@cafefusiones.com", role: "Mozo", station: "Salon", status: "Activo", lastAccess: "", phone: "" },
  { id: "USR-07", name: "Cocina", email: "cocina@cafefusiones.com", role: "Cocina", station: "Cocina", status: "Activo", lastAccess: "", phone: "" }
];

/* ==================== EMPRESA ==================== */
// Fuente: "IDENTIDAD CORPORATIVA.docx", "MANUAL DE IDENTIDAD CORPORATIVA.pdf",
// "OPERACION DEL NEGOCIO.docx" e "INFRAESTRUCTURA DEL ESTABLECIMIENTO.docx".
export const businessSeed = {
  business: "CAFE FUSIONES E.I.R.L.",
  tradeName: "Cafe Fusiones",
  ruc: "20603881142",
  address: "Jr. Ortiz Arrieta N 779, Chachapoyas, Amazonas",
  city: "Chachapoyas",
  region: "Amazonas",
  phone: "990285862",
  website: "https://cafefusiones.com",
  email: "gerencia@cafefusiones.com",
  slogan: "Mistica, Aroma y Sabor",
  legalForm: "Empresa Individual de Responsabilidad Limitada",
  floors: 2,
  schedule: [
    { days: "Lunes a sabado", opens: "08:00", closes: "22:00" },
    { days: "Domingo", opens: "15:00", closes: "21:00" }
  ],
  // Paleta del manual de marca. Solo es un dato de referencia para el cliente
  // y la landing: el sistema conserva su tema minimalista (theme-min.css).
  brandColors: [
    { name: "Rojo cafe", hex: "#B81E2D", use: "Logotipo, titulos y elementos principales" },
    { name: "Marron cafe", hex: "#5A2E1B", use: "Fondos, empaques" },
    { name: "Dorado", hex: "#D4A017", use: "Detalles y acentos" },
    { name: "Crema claro", hex: "#F5EFE6", use: "Fondos suaves" }
  ]
};

/* ==================== FIDELIZACION (CONFIGURACION) ==================== */
// Los niveles Bronce / Plata / Oro los pide el TDR y el backlog (HU-90, HU-98).
// Es configuracion, no data de clientes: la base de clientes arranca vacia y
// Cafe Fusiones ajusta los umbrales desde Configuracion.
export const loyaltyConfigSeed = {
  pointsPerSol: 1,
  levels: [
    { id: "bronze", name: "Bronce", minPoints: 0 },
    { id: "silver", name: "Plata", minPoints: 300 },
    { id: "gold", name: "Oro", minPoints: 700 }
  ]
};

/* ==================== TRAZABILIDAD DEL CAFE ==================== */
// Fuentes: "Proveedores Habituales e Insumos.docx" y la carta (pagina
// "NUESTRO CAFE"). Un solo lote real; el resto se gestiona en Administracion.
export const coffeeLotsSeed = [
  {
    id: "LOT-CAF-001",
    code: "Caficultores_Valle_Huayabamba",
    name: "Caficultores del Valle del Huayabamba",
    type: "Granos de cafe de especialidad",
    supplierId: "PRV-001",
    producer: "Caficultores del Valle del Huayabamba",
    region: "Andes orientales de Peru",
    valley: "Valle del Huayabamba, Amazonas",
    altitude: "1200-1800 m s. n. m.",
    variety: "",
    roast: "",
    received: "",
    roastedAt: "",
    stock: 25,
    unit: "kg",
    description: "Granos organicos seleccionados para las preparaciones de espresso, metodos filtrados (V60, Chemex, Prensa Francesa, etc.) y bebidas de la casa.",
    notes: ""
  }
];
