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
- Tras cambiar codigo, **Ctrl+F5**: `sw.js` cachea el app shell (network-first, cache `cafe-fusiones-modular-v12`).
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

`localStorage["cafeFusionesState"]`, esquema versionado (`VERSION = 13` en `storage.js`).
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
- **Categorias son dinamicas** y se administran **solo** desde Administracion > Categorias
  (`state.categories` arranca vacio). Las 16 categorias de la carta real si vienen
  sembradas en `menuCategoriesSeed` porque son el catalogo del cliente, no un default
  inventado. `menuCategories` (con "Todos" al inicio) se deriva de ahi y es la **lista
  unica** de la carta: la usan Ventas, la landing y Administracion (carta y recetas).
  Sus nombres son los del recetario del cliente (`migrateToV13` renombra los antiguos).
- **Carta, recetas y landing se conectan por el plato** (`menuItems`): la receta apunta a
  sus platos con `productIds`, y su categoria es la del plato. Un plato tiene como maximo
  una receta. Los platos de despacho directo (`inventoryMode: "direct"`, botellas) no
  llevan receta: al venderse, la receta tendria prioridad sobre el insumo directo.
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
- Todas las mesas tienen **un solo tamano** (`TAMANO_MESA`), sin importar capacidad
  ni forma: el lado de la cuadrada es igual al diametro de la redonda (el CSS fuerza
  `aspect-ratio: 1`). No se redimensionan y no llevan tirador; `mesaHtml` ignora el
  tamano guardado, asi que los estados viejos tambien se ven uniformes.
- **Configuracion > Sistema > Mesas** (`configuracion.html?tab=sistema&vista=mesas`) es el editor: arrastre y redimension con
  **pointer events** (mismo gesto con mouse y con el dedo). El tirador aparece
  solo en el elemento seleccionado.
- **Ventas > Salon** solo pinta el plano guardado; las zonas de tipo `station`
  (Cocina, Barra) abren la pestana de Produccion filtrada por estacion.
- Las tarjetas de **Configuracion > Sistema** (Mesas, Estaciones, Impresion, Sistema)
  abren sub-vistas en la misma pagina (`?vista=`), no modales: el editor del plano
  sigue en el DOM mientras se muestra un `confirmAction`. Los modales **no se apilan**
  (`openModal` cierra el anterior); los formularios de mesa y estacion siguen siendo modales.
- **`saveState` reemplaza los objetos de los arrays** (llama a `hydrateState`).
  Un handler no puede quedarse con una referencia a un registro entre eventos:
  hay que volver a buscarlo por id en cada uno.
- Ojo con la especificidad: `.ventas-v4 button { font: inherit }` le gana a un
  selector de una sola clase, por eso las reglas de tipografia del plano van
  acotadas con `.floorplan`.

### Inventario y recetas

`js/core/inventario.js` concentra el consumo de insumos por venta:

- Al cerrar una venta (`finalizeSale` en ventas.js) cada linea descuenta segun
  su receta; los productos de despacho directo descuentan su insumo asociado y
  los que no tienen ninguno de los dos se informan como "sin receta".
- **La falta de stock NO bloquea la venta.** Cafe Fusiones todavia no cargo su
  inventario inicial, asi que el stock puede quedar en negativo; eso se avisa en
  un toast y se marca en Inventario con el estado `Negativo`.
- Cada descuento deja un movimiento en el Kardex (`state.inventoryMovements`).
- Un insumo solo es `Critico` si tiene minimo definido y lo alcanzo: con minimo
  0 (el valor por defecto hasta que el cliente lo cargue) no se marca nada.

### Landing publica

La landing (`pages/landing*.html`) no tiene sesion, pero **si lee el estado**:
`js/data/site-data.js` usa `readPublicState()` de storage.js, que hidrata sin
escribir en localStorage ni pasar por `requireAuth()`. Es el mismo origen, asi
que ve lo que Administracion guarda en el navegador del local.

- **Trazabilidad**: `landing-trazabilidad` y `landing-lote` muestran los lotes de
  `state.coffeeLots` con `publishWeb !== false`. La ficha completa se carga en
  Administracion > Trazabilidad (incluye imagenes, preparaciones, conservacion y
  los pasos del recorrido como lista editable). La sub-vista **Paginas publicadas**
  (`admin.html?tab=trazabilidad&vista=paginas`) lista cada pagina de lote; el menu de
  tres puntos permite verla, copiar el enlace, editarla y eliminarla. "Eliminar" solo
  pone `publishWeb: false` (el lote se conserva y se vuelve a publicar desde "Sin publicar").
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

### Ayuda

`pages/ayuda.html` es una pantalla propia (antes era un modal): secciones por `?tab=`
(inicio, modulos, flujos, roles, preguntas), buscador en la barra superior y enlaces
a un tema con `#id`. El texto vive en `js/data/ayuda.js`; si cambia un flujo o una
pantalla, actualizar ahi el tema correspondiente. La matriz de roles sale de
`rolePermissions` (router.js), asi que no hay que mantenerla a mano.

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
