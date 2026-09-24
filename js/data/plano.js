// Cafe Fusiones - Plano del salon.
// Fuente: "DISTRIBUCION CAFE FUSIONES.pdf". Las coordenadas del PDF (792x612 pt)
// se convirtieron a porcentaje sobre la caja del local, para que el plano se
// adapte a cualquier tamano de pantalla.
//
// Cafe Fusiones puede mover, redimensionar y renombrar mesas y zonas desde
// Configuracion > Mesas; lo que se guarda aqui es solo el punto de partida.
//
// `type` de zona:
//   station - abre su estacion desde Ventas (Cocina, Barra)
//   area    - ambiente del local (Oficina, SS.HH., Artesania, libros)
//   door    - acceso

export const tablesSeed = [
  { id: "M1", name: "Mesa 1", area: "Salon principal", seats: 2, status: "Libre", map: { x: 72.27, y: 44.02, w: 7.11, h: 6.46, shape: "rect" } },
  { id: "M2", name: "Mesa 2", area: "Salon principal", seats: 2, status: "Libre", map: { x: 12.95, y: 50.49, w: 7.83, h: 7.45, shape: "round" } },
  { id: "M3", name: "Mesa 3", area: "Salon principal", seats: 4, status: "Libre", map: { x: 57.04, y: 28.08, w: 7.11, h: 11.91, shape: "rect" } },
  { id: "M4", name: "Mesa 4", area: "Salon principal", seats: 4, status: "Libre", map: { x: 67.51, y: 28.08, w: 15.12, h: 6.46, shape: "rect" } },
  { id: "M5", name: "Mesa 5", area: "Salon principal", seats: 2, status: "Libre", map: { x: 57.91, y: 44.14, w: 7.11, h: 6.46, shape: "rect" } },
  { id: "M6", name: "Mesa 6", area: "Salon principal", seats: 2, status: "Libre", map: { x: 71.42, y: 36.16, w: 7.11, h: 6.46, shape: "rect" } },
  { id: "A1", name: "Mesa A1", area: "Salon A", seats: 4, status: "Libre", map: { x: 78.91, y: 54.58, w: 9.83, h: 9.16, shape: "rect" } },
  { id: "A2", name: "Mesa A2", area: "Salon A", seats: 4, status: "Libre", map: { x: 46.64, y: 53.35, w: 10.63, h: 8.56, shape: "rect" } },
  { id: "A3", name: "Mesa A3", area: "Salon A", seats: 4, status: "Libre", map: { x: 15.14, y: 37.45, w: 6.6, h: 10.25, shape: "rect" } },
  { id: "A4", name: "Mesa A4", area: "Salon A", seats: 4, status: "Libre", map: { x: 15.46, y: 22.04, w: 6.6, h: 10.25, shape: "rect" } }
];

export const floorZonesSeed = [
  { id: "ZON-01", name: "Cocina", type: "station", map: { x: 70.25, y: 5.49, w: 12.99, h: 5.09 } },
  { id: "ZON-02", name: "Barra", type: "station", map: { x: 57.35, y: 66.63, w: 4.29, h: 25.08 } },
  { id: "ZON-03", name: "Oficina", type: "area", map: { x: 38.55, y: 6.62, w: 12.86, h: 3.9 } },
  { id: "ZON-04", name: "SS.HH.", type: "area", map: { x: 11.55, y: 7.95, w: 8.21, h: 4.01 } },
  { id: "ZON-05", name: "Intercambio de libros", type: "area", map: { x: 71.44, y: 17.17, w: 17.66, h: 7.05 } },
  { id: "ZON-06", name: "Artesania", type: "area", map: { x: 85.5, y: 25.02, w: 3.66, h: 13.82 } },
  { id: "ZON-07", name: "Artesania", type: "area", map: { x: 84.54, y: 39.64, w: 4.89, h: 14.14 } },
  { id: "ZON-08", name: "Artesania", type: "area", map: { x: 84.7, y: 69.47, w: 3.91, h: 14.05 } },
  { id: "ZON-09", name: "Entrada", type: "door", map: { x: 13.82, y: 92.39, w: 16.54, h: 6.46 } },
  { id: "ZON-10", name: "Entrada", type: "door", map: { x: 61.81, y: 93.04, w: 12.59, h: 6.46 } }
];
