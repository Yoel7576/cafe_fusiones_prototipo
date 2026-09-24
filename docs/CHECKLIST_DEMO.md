# Checklist de prueba — Prototipo Café Fusiones

Guion para recorrer el prototipo delante del cliente. Toma unos 15 minutos.

**Antes de empezar**

1. Levantar el servidor local (Live Server en el puerto 5501, o
   `python -m http.server 5501` desde la raíz del proyecto).
2. Abrir `http://127.0.0.1:5501/pages/login.html`.
3. **Ctrl+F5** la primera vez (el navegador cachea el sistema).
4. Entrar con **CFUSIONES** / **prototipo**. Entra como Gerencia, que ve todos
   los módulos.

> Para mostrarlo "desde cero": DevTools → Application → Clear site data. El
> sistema se resiembra con la carta, el recetario y el inventario reales, y sin
> ninguna venta ni cliente.

---

## 1. La data es real, no de demostración

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 1.1 | Entrar a **Ventas → Salón** y tocar una mesa | Los **121 platos de la carta 2025**, en sus 16 categorías reales |
| 1.2 | Mirar precios: Espresso, Cappuccino, Lasaña Sinchi | S/ 5.50 · S/ 8.00 · S/ 25.00 — los de la carta impresa |
| 1.3 | **Inventario → Stock** | **254 insumos**: los 214 del recetario, los 17 del almacén y las 25 preparaciones de cocina |
| 1.4 | **Inventario → Proveedores** | Los 8 proveedores habituales del cliente |
| 1.5 | **Administración → Recetas** | **101 recetas** con costo y margen por plato |
| 1.6 | **Configuración → General** | Razón social CAFÉ FUSIONES E.I.R.L. y **RUC 20603881142** |

## 2. Arranca en cero, sin datos inventados

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 2.1 | **Inicio** | Los 4 indicadores en cero, en una sola fila |
| 2.2 | **Clientes** | "Aún no hay clientes registrados" |
| 2.3 | **Reportes** | Todo en cero, con las tablas en estado vacío |
| 2.4 | **Administración → Historial** | "Aún no hay movimientos registrados" |

## 3. Plano del salón

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 3.1 | **Ventas → Salón** | Las 10 mesas del plano real (1‑6 y A1‑A4), ninguna encimada, con la leyenda de estados al costado |
| 3.2 | Tocar la zona **Cocina** o **Barra** | Abre la pestaña Producción de esa estación |
| 3.3 | **Configuración → Operación → Mesas** | El editor del plano |
| 3.4 | Arrastrar una mesa | Se mueve y **queda alineada sola** a la cuadrícula |
| 3.5 | Tocar una zona y arrastrar el punto rojo de la esquina | Cambia de tamaño |
| 3.6 | Cambiar el nombre de una zona | Se actualiza en el plano al instante |
| 3.7 | Cambiar la capacidad de una mesa a 6 | La mesa pasa al tamaño rectangular estándar |
| 3.8 | Cerrar y volver a **Ventas → Salón** | Los cambios están ahí |

## 4. Flujo completo de atención

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 4.1 | **Caja → Abrir caja** (monto inicial S/ 100) | La caja queda abierta |
| 4.2 | **Ventas → Salón**, tocar la Mesa 3 | Se abre "Tomar pedido" con el buscador y la carta |
| 4.3 | Agregar **2 Espressos** y enviar el pedido | La mesa 3 queda ocupada (ámbar) |
| 4.4 | **Ventas → Producción** | El pedido aparece en la estación Barra |
| 4.5 | Marcarlo Preparando → Listo | La mesa 3 se pone en rojo ("Lista") en el plano |
| 4.6 | Volver al plano, tocar la Mesa 3 → **Cobrar** → **Efectivo** | La venta se cierra y la mesa se libera |
| 4.7 | **Inventario → Kardex** | Dos movimientos de salida: Café en grano **‑36 g** y Agua purificada **‑60 ml** (18 g y 30 ml por ración, por dos) |
| 4.8 | **Reportes** | La venta aparece con S/ 11.00 de ingresos |
| 4.9 | **Caja** | El ingreso en efectivo quedó registrado |

> **Punto a explicar:** si un insumo no tiene stock cargado, la venta **no se
> bloquea**. El stock queda en negativo y el sistema avisa, porque Café Fusiones
> todavía no cargó su inventario inicial.

## 5. Recetas y costos

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 5.1 | **Administración → Recetas** | Costo, precio de venta y margen por plato |
| 5.2 | Buscar Espresso | Costo S/ 1.35 · venta S/ 5.50 · margen 75% |
| 5.3 | **Inventario → Stock**, filtrar "Preparados" | Las 25 preparaciones del inventario diario de cocina |

## 6. Landing pública conectada

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 6.1 | Abrir `pages/landing-menu.html` | La carta real agrupada por categoría, con precios y descripción en español e inglés |
| 6.2 | **Administración → Trazabilidad** | La ficha completa del lote del Valle del Huayabamba |
| 6.3 | Editar el lote: cambiar la variedad y agregar un paso al recorrido | Se guarda |
| 6.4 | Abrir `pages/landing-trazabilidad.html` y buscar `Caficultores_Valle_Huayabamba` | Encuentra el lote |
| 6.5 | Entrar a la ficha | Muestra el cambio recién hecho |
| 6.6 | Desmarcar "Publicar en la web" y recargar la ficha | Deja de mostrarse |

## 7. Pantallas y dispositivos

| # | Qué hacer | Qué se debe ver |
|---|---|---|
| 7.1 | Recorrer todas las pantallas a 1366×768 | Nada cortado ni desalineado, sin barra de desplazamiento horizontal |
| 7.2 | Modo dispositivo (390 px) | El menú pasa abajo, los indicadores a 2×2 y el plano se adapta |
| 7.3 | Consola del navegador (F12) | Sin errores |

---

## Qué está pendiente del cliente

`docs/PENDIENTES_CLIENTE.md` tiene el detalle. Lo más importante para la reunión:

1. **Inventario inicial**: solo 17 insumos tienen stock real. Los demás están en
   0, así que al vender quedan en negativo (a propósito, con alerta).
2. **Precios de compra**: los costos del recetario son referenciales y tienen
   erratas; el margen por plato es estimado hasta tener los precios reales.
3. **Datos de los proveedores**: faltan RUC, teléfono y correo de los 8.
4. **Nombres de los usuarios**: hay un usuario por cargo, no por persona.
5. **Fotos de los platos**: no vinieron; la carta pública se ve sin imágenes.
6. **Número de mesas**: los documentos dicen 9, 10 y 13. Se usaron las 10 del
   plano.

## Fuera del alcance de esta entrega

- Facturación electrónica con SUNAT (el TDR la pide; falta la configuración).
- Turnos de trabajo.
- Delivery como canal completo (hay un punto de venta "Para llevar").
- Segunda sucursal (el modelo ya la soporta, hay una sola cargada).
