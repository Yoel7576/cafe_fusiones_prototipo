# Cafe Fusiones — Version modular (V3)

Prototipo funcional del sistema de gestion de Cafe Fusiones, refactorizado a una
estructura profesional y mantenible: **cada pantalla en su propio HTML, CSS y JS**,
con estilos y logica compartidos separados en carpetas.

Esta version (V3) incorpora la 4ta ronda de mejoras del jefe:
- **Caja como modulo independiente** (menu propio): tablero financiero, ingresos y
  **egresos con mas campos** (producto, unidad, cantidad, descripcion), y **cierre amplio**
  con **seleccion de reportes** (vendidos, ingresos por medio de pago, resumen, eliminados
  y egresos, efectivo final, stock/Kardex).
- **Administracion:** gestion de platos con **fotografia** y checkbox **"Publicar en landing"**,
  y una pestana de **Recetas y costos** (insumos + costo de elaboracion para la utilidad real).
- **UI minimalista:** fondo blanco, bloques en gris muy sutil, **texto negro** (solo Ingresos
  en azul y Egresos en rojo) y tipografia **Inter** con jerarquia por grosor.
- **Menu lateral:** se quito "Atencion activa" y se movieron **Notificaciones, Configuracion,
  Ayuda y Cerrar sesion** al menu lateral (ahora funcionales).

## Como ejecutar
1. Abre la carpeta en VS Code y usa la extension **Live Server** (boton "Go Live" o
   clic derecho sobre `index.html` > "Open with Live Server").
2. Se abre en el puerto `5501` (configurado en `.vscode/settings.json`). Enlaces:
   - Landing (sitio publico): http://127.0.0.1:5501/pages/landing.html
   - Sistema (staff): http://127.0.0.1:5501/pages/login.html
3. Usuario: **CFUSIONES** — Clave: **prototipo** (tambien es la contrasena para anular productos).

> La tipografia Inter se carga desde Google Fonts (requiere internet la primera vez).

> Es una PWA con modulos ES nativos: **requiere** un servidor local, no carga con
> `file://`. Si ves una version anterior, presiona **Ctrl+F5**.

## Estructura de carpetas

```
Cafe_Fusiones_MODULAR/
├── index.html                  (redirige al login)
├── manifest.webmanifest
├── sw.js                       (service worker, cache network-first)
├── assets/
│   ├── img/                    (logo, hero, fotos)
│   ├── icons/
│   └── fonts/
├── css/
│   ├── base/                   reset.css · variables.css · typography.css
│   ├── layout/                 app-shell.css · sidebar.css · topbar.css
│   ├── components/             buttons · cards · forms · modals · tables
│   └── pages/                  login · dashboard · ventas ·
│                               inventario · clientes · reportes · admin
├── js/
│   ├── core/                   auth.js · router.js · storage.js · utils.js
│   ├── data/                   data.js   (datos demo)
│   ├── components/             sidebar · topbar · toast · modal · confirm
│   └── pages/                  login · dashboard · ventas ·
│                               inventario · clientes · reportes · admin
└── pages/                      login.html · dashboard.html · ventas.html ·
                                inventario.html · clientes.html ·
                                reportes.html · admin.html
```

## Que hace cada capa
- **css/base**: reset, variables de marca (colores del manual) y tipografia.
- **css/layout**: el armazon (shell, barra lateral, barra superior).
- **css/components**: piezas reutilizables (botones, tarjetas, formularios, tablas, modales).
- **css/pages**: solo los estilos propios de cada pantalla.
- **js/core**: autenticacion, permisos por rol, estado persistente y utilidades.
- **js/data**: unicamente los datos demo.
- **js/components**: barra lateral, barra superior, toasts, modales y confirmaciones reutilizables.
- **js/pages**: la logica exclusiva de cada pantalla.

## Notas
- Al ser multipagina, el estado (inventario, pedidos, clientes, caja) se guarda en
  el navegador (`localStorage`) para que no se pierda al cambiar de pantalla.
- Para reiniciar los datos demo: borra los datos del sitio en el navegador.
