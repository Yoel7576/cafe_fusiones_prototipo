# CLAUDE.md

Guia para trabajar en este repositorio. El proyecto esta escrito en espanol (codigo,
comentarios y UI); manten ese idioma al escribir codigo, comentarios y mensajes de commit.

## Que es

Prototipo funcional (frontend puro) del ERP de **Cafe Fusiones**: ventas de salon,
toma de pedido para mozos, KDS de cocina, caja, inventario, clientes, reportes,
administracion y configuracion.

No hay backend, ni build, ni dependencias npm: es HTML + CSS + JavaScript con
**modulos ES nativos**. Todo el estado vive en `localStorage`.

## Ejecutar

Se **requiere** un servidor local: los modulos ES no cargan con `file://`. Usar la
extension **Live Server** de VS Code (boton "Go Live" o clic derecho > "Open with
Live Server" sobre `index.html`), configurada en el puerto 5501 (`.vscode/settings.json`).

- Login demo: usuario `CFUSIONES`, clave `prototipo` (la misma clave se pide para anular productos).
- Tras cambiar codigo, **Ctrl+F5**: `sw.js` cachea el app shell (network-first, cache `cafe-fusiones-modular-v11`).
  Si se agregan o renombran paginas, actualizar `APP_SHELL` y subir el numero de `CACHE_NAME`.
- No hay tests, linter ni CI. La verificacion es manual en el navegador.

## Arquitectura

Multipagina: **cada pantalla es su propio HTML, CSS y JS**. `index.html` solo redirige
a `pages/login.html`.

```
pages/<nombre>.html   ->  <body data-page="<nombre>"> con #sidebar, #topbar, #view,
                          #bottom-nav, #toast-root vacios, y
                          <script type="module" src="../js/pages/<nombre>.js">
js/pages/<nombre>.js  ->  unica logica de esa pantalla; rellena #view con innerHTML
css/pages/<nombre>.css->  unicos estilos de esa pantalla
```

Capas compartidas:

- `js/core/auth.js` — sesion en `sessionStorage` (`cafeFusionesSession`); `requireAuth()`
  redirige a `login.html` si no hay sesion.
- `js/core/router.js` — `navItems` + `rolePermissions` por rol real del cliente
  (Gerencia, Administrador, Asistente de Gerencia, Contadora, Cajero, Barra, Mozo,
  Cocina, Operaciones); `allowedIds()` / `canAccess()` filtran el menu.
- `js/core/storage.js` — **fuente unica de estado** (~1000 lineas). `getState()`,
  `saveState()`, `resetState()`, helpers de sucursales y categorias, `nextId()`,
  `addAuditEvent()`.
- `js/core/utils.js` — `icon()` (sprites SVG inline), `money()` (PEN), `escapeHtml()`,
  `matchesSearch()`, `statusClass()`, `IGV_RATE` (0.18), `tableTotal()`,
  `buildSimplePdf()` / `downloadBlob()` (exportacion sin librerias), `TODAY` (fecha fija de la demo).
- `js/data/` — **data real del cliente**, no demo. `data.js` tiene la estructura del
  negocio (usuarios por perfil, mesas del plano, estaciones, empresa); `carta.js`,
  `recetas.js`, `inventario.js` y `proveedores.js` se generaron desde los documentos
  entregados (carta 2025, recetario con costos, inventario de almacen y de cocina,
  cuadro de proveedores). `plano.js` trae las mesas y las zonas del salon con las
  coordenadas del plano de distribucion. Clientes, ventas y reportes arrancan vacios.
- `js/components/` — `sidebar.js`, `topbar.js`, `toast.js`, `modal.js`, `confirm.js`,
  `useractions.js`, `floorplan.js` (el plano del salon, compartido por Ventas y
  Configuracion).

### Patron de una pagina

```js
const session = requireAuth();
const state = getState();
const view = document.getElementById("view");
const params = new URLSearchParams(window.location.search);
const ui = { tab: "...", search: "" };   // estado efimero de la vista

if (session) init();

function init() {
  renderSidebar("<id-del-nav>", session.role);
  renderTopbar({ title: "...", eyebrow: "...", onSearch: (q) => { ui.search = q; render(); } });
  render();
}
```

El render es **string templates -> `innerHTML`**, y los handlers se enlazan despues
(delegacion sobre el contenedor o `querySelectorAll` tras pintar). Toda interpolacion
de datos del usuario pasa por `escapeHtml()`. Las sub-vistas se controlan con query
params (`?tab=`, `?mode=`, `?station=`, `?mesa=`) y `history.replaceState`.

### Estado persistente

`localStorage["cafeFusionesState"]`, esquema versionado (`VERSION = 11` en `storage.js`).
`getState()` hidrata y **migra** el estado existente en vez de borrarlo. Claves
principales: `tables`, `floorZones`, `menuItems`, `recipes`, `kitchenOrders`, `salesHistory`,
`inventory`, `inventoryMovements`, `inventoryLots`, `productionBatches`, `suppliers`,
`purchaseOrders`, `wasteRecords`, `coffeeLots`, `customers`, `reservations`,
`loyaltyMovements`, `users`, `branches`, `categories`, `cashBoxes`, `auditEvents`,
`settings`, `sequences`.

Cada subida de `VERSION` que cambie la data base debe resembrar los catalogos en la
migracion (ver `migrateToV9` con las listas `V9_RESEED` / `V9_LIMPIAR`, y
`migrateToV10` / `migrateToV11` para el plano): los navegadores que ya abrieron el prototipo conservan el estado viejo y
`getState()` no lo borra. `migrateToV10` reubica las mesas segun el plano real pero
conserva lo operativo de cada una (consumo, estado, cliente).

Reglas del modelo:

- **Sucursales** (`branchId`) son transversales: toda operacion dependiente de local lo conserva.
  El cliente, en cambio, es global a la marca.
- **Categorias son dinamicas** y se administran **solo** desde Configuracion
  (`state.categories` arranca vacio). Las 16 categorias de la carta real si vienen
  sembradas en `menuCategoriesSeed` porque son el catalogo del cliente, no un default
  inventado. `menuCategories` (con "Todos" al inicio) se deriva de ahi y queda por
  compatibilidad con las pantallas de Ventas.
- **Los seeds no se declaran dentro de las paginas.** Toda data base vive en `js/data/`
  y se siembra desde `storage.js`.
- **Unidades de inventario: `g`, `ml` y `un`**, para que coincidan con las cantidades
  del recetario y el descuento por receta no necesite conversiones.
- IDs nuevos siempre via `nextId(state, secuencia, prefijo)`; nunca correlativos a mano.
- Acciones sensibles registran auditoria con `addAuditEvent(...)`.
- Registros con historial **no se eliminan**: se activan/desactivan.
- Mutar `state` y luego `saveState(state)`; `saveState` normaliza y conserva la referencia
  recibida (las paginas mantienen `const state = getState()` vivo durante la sesion).

### Plano del salon

`state.floorZones` guarda las zonas (cocina, barra, oficina, SS.HH., artesania,
accesos) y cada mesa lleva `map: {x, y, w, h, shape}` en porcentaje sobre el lienzo.
Semilla en `js/data/plano.js`.

El plano es **un solo componente** usado por las dos pantallas:
`js/components/floorplan.js` + `css/components/floorplan.css` (ambas paginas
enlazan esa hoja). Si se toca el aspecto del plano, se toca ahi, no en
`pages/ventas.css` ni en `pages/configuracion.css`.

- Lienzo **16:10**, ancho completo del panel. `max-height` lo achica manteniendo
  la proporcion cuando la pantalla es baja, para que nunca quede cortado.
- Todo se alinea a una **grilla de 2.5** (`PLANO_GRID`): el editor hace snap al
  mover y al redimensionar.
- Las mesas tienen **tamano estandar por capacidad** (`TAMANOS_MESA`): 2 personas
  cuadrada chica, 4 cuadrada mediana, 6 o mas rectangular. No se redimensionan a
  mano; cambiar la capacidad reajusta el tamano (`normalizarMapaMesa`).
- **Configuracion > Operacion > Mesas** es el editor: arrastre y redimension con
  **pointer events** (mismo gesto con mouse y con el dedo). El tirador aparece
  solo en el elemento seleccionado.
- **Ventas > Salon** solo pinta el plano guardado; las zonas de tipo `station`
  (Cocina, Barra) abren la pestana de Produccion filtrada por estacion.
- Los modales **no se apilan** (`openModal` cierra el anterior): tras un
  `confirmAction` hay que volver a abrir el editor con `openTablesModal()`.
- **`saveState` reemplaza los objetos de los arrays** (llama a `hydrateState`).
  Un handler no puede quedarse con una referencia a un registro entre eventos:
  hay que volver a buscarlo por id en cada uno.
- Ojo con la especificidad: `.ventas-v4 button { font: inherit }` le gana a un
  selector de una sola clase, por eso las reglas de tipografia del plano van
  acotadas con `.floorplan`.

### Landing publica

La landing (`pages/landing*.html`) no tiene sesion, pero **si lee el estado**:
`js/data/site-data.js` usa `readPublicState()` de storage.js, que hidrata sin
escribir en localStorage ni pasar por `requireAuth()`. Es el mismo origen, asi
que ve lo que Administracion guarda en el navegador del local.

- **Trazabilidad**: `landing-trazabilidad` y `landing-lote` muestran los lotes de
  `state.coffeeLots` con `publishWeb !== false`. La ficha completa se carga en
  Administracion > Trazabilidad (incluye imagenes, preparaciones, conservacion y
  los pasos del recorrido como lista editable).
- **Carta**: `landing-menu` y la vista previa de `landing` muestran los platos con
  `publishLanding` activo, agrupados por categoria.
- **Respaldo**: si el navegador del visitante no tiene estado (nunca abrio el
  sistema), se usan `site-traceability.js` y `site-menu.js`. El respaldo aplica
  solo cuando NO hay registros; si los hay y ninguno esta publicado, la web no
  muestra ninguno.

### Flujo operativo

Mozo (`ventas-pedido`) toma el pedido -> produccion en `ventas-kds`
(Nuevo -> Preparando -> Listo -> Entregado) -> "Solicitar cuenta" encola para `caja`,
que registra el pago. El mozo nunca cobra.

## CSS

Los HTML enlazan las hojas en este orden fijo:
`base/reset` -> `base/variables` -> `base/typography` -> `layout/*` -> `components/*`
-> `pages/<pagina>` -> **`base/theme-min.css` al final**.

`theme-min.css` es una capa minimalista (fondo blanco, bloques gris muy sutil, texto
negro, tipografia Inter) que sobreescribe la paleta de marca de `variables.css` sin
tocar el resto. Un cambio de color en `pages/*.css` puede quedar anulado por esa capa:
revisar ahi antes de pelear con especificidad. Excepcion cromatica intencional:
Ingresos en azul, Egresos en rojo.

## Notas

- `docs/PENDIENTES_CLIENTE.md` lista la data que falto o vino contradictoria en los
  insumos del cliente. Actualizarlo si aparece otro hueco.
- `_insumos/` son los documentos fuente del cliente; esta en `.gitignore` y no se sube.
- `Cafe_Fusiones_JS_17_categorias_corregidas/` es una copia de respaldo parcial
  (storage, clientes, configuracion). **No es codigo activo**; editar siempre `js/`.
- Inter se carga desde Google Fonts (requiere internet la primera vez).
- El repositorio no tiene backend ni llamadas de red propias; nada debe depender de una API.
