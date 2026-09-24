// Cafe Fusiones - Plano del salon.
//
// Disposicion tomada de "DISTRIBUCION CAFE FUSIONES.pdf" y ordenada en filas y
// columnas parejas: A4-A3-2 a la izquierda, 3-5 al centro, 4-6-1 a la derecha,
// A2 y A1 abajo junto a la barra.
//
// Todo se guarda en porcentaje sobre un lienzo 16:10, sobre una grilla de
// 2.5 puntos que es la misma a la que hace snap el editor. Las mesas usan
// tamanos estandar por capacidad (2 personas cuadrada chica, 4 cuadrada
// mediana, 6 o mas rectangular); el alto en porcentaje va multiplicado por
// 1.6 para que una mesa cuadrada se vea cuadrada en un lienzo apaisado.
//
// Cafe Fusiones reacomoda todo desde Configuracion > Operacion > Mesas.
//
// `type` de zona:
//   station - abre su estacion desde Ventas (Cocina, Barra)
//   area    - ambiente del local (Oficina, SS.HH., Artesania, libros)
//   door    - acceso; se dibuja como una abertura en el muro

export const PLANO_GRID = 2.5;
export const PLANO_ASPECTO = 1.6;

// Tamanos estandar de mesa por capacidad.
export const TAMANOS_MESA = {
  2: { w: 5.0, h: 12.5 },
  4: { w: 7.5, h: 12.5 },
  6: { w: 12.5, h: 12.5 }
};

export const tablesSeed = [
  { id: "A4", name: "Mesa A4", area: "Salon A", seats: 4, status: "Libre", map: { x: 7.5, y: 20.0, w: 7.5, h: 12.5, shape: "rect" } },
  { id: "A3", name: "Mesa A3", area: "Salon A", seats: 4, status: "Libre", map: { x: 7.5, y: 40.0, w: 7.5, h: 12.5, shape: "rect" } },
  { id: "M2", name: "Mesa 2", area: "Salon principal", seats: 2, status: "Libre", map: { x: 10.0, y: 60.0, w: 5.0, h: 12.5, shape: "round" } },
  { id: "M3", name: "Mesa 3", area: "Salon principal", seats: 4, status: "Libre", map: { x: 32.5, y: 25.0, w: 7.5, h: 12.5, shape: "rect" } },
  { id: "M5", name: "Mesa 5", area: "Salon principal", seats: 2, status: "Libre", map: { x: 35.0, y: 47.5, w: 5.0, h: 12.5, shape: "rect" } },
  { id: "M4", name: "Mesa 4", area: "Salon principal", seats: 4, status: "Libre", map: { x: 55.0, y: 25.0, w: 7.5, h: 12.5, shape: "rect" } },
  { id: "M6", name: "Mesa 6", area: "Salon principal", seats: 2, status: "Libre", map: { x: 55.0, y: 47.5, w: 5.0, h: 12.5, shape: "rect" } },
  { id: "M1", name: "Mesa 1", area: "Salon principal", seats: 2, status: "Libre", map: { x: 70.0, y: 47.5, w: 5.0, h: 12.5, shape: "rect" } },
  { id: "A2", name: "Mesa A2", area: "Salon A", seats: 4, status: "Libre", map: { x: 30.0, y: 70.0, w: 7.5, h: 12.5, shape: "rect" } },
  { id: "A1", name: "Mesa A1", area: "Salon A", seats: 4, status: "Libre", map: { x: 62.5, y: 70.0, w: 7.5, h: 12.5, shape: "rect" } }
];

export const floorZonesSeed = [
  { id: "ZON-01", name: "Cocina", type: "station", map: { x: 72.5, y: 5.0, w: 22.5, h: 10.0 } },
  { id: "ZON-02", name: "Barra", type: "station", map: { x: 45.0, y: 67.5, w: 10.0, h: 20.0 } },
  { id: "ZON-03", name: "Oficina", type: "area", map: { x: 37.5, y: 5.0, w: 17.5, h: 7.5 } },
  { id: "ZON-04", name: "SS.HH.", type: "area", map: { x: 5.0, y: 5.0, w: 15.0, h: 7.5 } },
  { id: "ZON-05", name: "Intercambio de libros", type: "area", map: { x: 70.0, y: 20.0, w: 25.0, h: 10.0 } },
  { id: "ZON-06", name: "Artesania", type: "area", map: { x: 82.5, y: 35.0, w: 12.5, h: 7.5 } },
  { id: "ZON-07", name: "Artesania", type: "area", map: { x: 82.5, y: 47.5, w: 12.5, h: 7.5 } },
  { id: "ZON-08", name: "Artesania", type: "area", map: { x: 82.5, y: 75.0, w: 12.5, h: 7.5 } },
  { id: "ZON-09", name: "Entrada", type: "door", map: { x: 12.5, y: 90.0, w: 15.0, h: 7.5 } },
  { id: "ZON-10", name: "Entrada", type: "door", map: { x: 55.0, y: 90.0, w: 15.0, h: 7.5 } }
];
