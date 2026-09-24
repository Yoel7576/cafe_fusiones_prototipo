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
- Tras cambiar codigo, **Ctrl+F5**: `sw.js` cachea el app shell (network-first, cache `cafe-fusiones-modular-v8`).
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
- `js/core/router.js` — `navItems` + `rolePermissions` por rol (Gerencia, Administrador,
  Cajero, Cocina, Operaciones); `allowedIds()` / `canAccess()` filtran el menu.
- `js/core/storage.js` — **fuente unica de estado** (~1000 lineas). `getState()`,
  `saveState()`, `resetState()`, helpers de sucursales y categorias, `nextId()`,
  `addAuditEvent()`.
- `js/core/utils.js` — `icon()` (sprites SVG inline), `money()` (PEN), `escapeHtml()`,
  `matchesSearch()`, `statusClass()`, `IGV_RATE` (0.18), `tableTotal()`,
  `buildSimplePdf()` / `downloadBlob()` (exportacion sin librerias), `TODAY` (fecha fija de la demo).
- `js/data/data.js` — **solo** datos demo (carta, mesas, inventario, clientes, usuarios...).
- `js/components/` — `sidebar.js`, `topbar.js`, `toast.js`, `modal.js`, `confirm.js`,
  `useractions.js`.

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

`localStorage["cafeFusionesState"]`, esquema versionado (`VERSION = 8` en `storage.js`).
`getState()` hidrata y **migra** el estado existente en vez de borrarlo. Claves
principales: `tables`, `menuItems`, `kitchenOrders`, `salesHistory`, `inventory`,
`inventoryMovements`, `wasteRecords`, `customers`, `reservations`, `loyaltyMovements`,
`users`, `branches`, `categories`, `cashBoxes`, `auditEvents`, `settings`, `sequences`.

Reglas del modelo:

- **Sucursales** (`branchId`) son transversales: toda operacion dependiente de local lo conserva.
  El cliente, en cambio, es global a la marca.
- **Categorias son dinamicas** y se crean **solo** desde Configuracion. No sembrar
  categorias por defecto. `menuCategories` en `data.js` queda solo por compatibilidad
  temporal con las pantallas de Ventas.
- IDs nuevos siempre via `nextId(state, secuencia, prefijo)`; nunca correlativos a mano.
- Acciones sensibles registran auditoria con `addAuditEvent(...)`.
- Registros con historial **no se eliminan**: se activan/desactivan.
- Mutar `state` y luego `saveState(state)`; `saveState` normaliza y conserva la referencia
  recibida (las paginas mantienen `const state = getState()` vivo durante la sesion).

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

- `Cafe_Fusiones_JS_17_categorias_corregidas/` es una copia de respaldo parcial
  (storage, clientes, configuracion). **No es codigo activo**; editar siempre `js/`.
- Inter se carga desde Google Fonts (requiere internet la primera vez).
- El repositorio no tiene backend ni llamadas de red propias; nada debe depender de una API.
