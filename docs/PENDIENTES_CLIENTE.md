# Pendientes con Café Fusiones

Lista de datos que faltaron, vinieron incompletos o se contradicen entre los documentos
entregados por el cliente (carpeta `_insumos/`). Cada punto indica qué se hizo mientras
tanto en el sistema, para que quede claro qué es dato real y qué es un valor provisional.

Estado del prototipo al cierre de la Fase 1: la carta, el recetario, los proveedores y
los perfiles de usuario **sí** son reales. Los clientes, las ventas y los reportes están
**vacíos a propósito**.

---

## 1. Número de mesas y aforo — contradicción entre tres fuentes

| Fuente | Dice |
|---|---|
| `INFRAESTRUCTURA DEL ESTABLECIMIENTO.docx` | 9 mesas, aforo 36 personas |
| `Procesos Operativos Actuales.docx` | 13 mesas, aforo 42 personas |
| `DISTRIBUCION CAFE FUSIONES.pdf` (plano) | **10 mesas**: 1, 2, 3, 4, 5, 6, A1, A2, A3, A4 |

**Qué hicimos:** se sembraron las 10 mesas del plano, porque es la única fuente gráfica.

**Qué necesitamos:** confirmar cuántas mesas hay hoy y la capacidad real de cada una.
La capacidad que cargamos (32 asientos en total) la dedujimos del tamaño de cada mesa
en el plano, no de un dato del cliente.

---

## 2. Costos del recetario — son referenciales y tienen errores

El documento `recetario con costos café fusiones.docx` lo advierte en su propia
introducción: *"el recetario establece cantidades estándar, pero no contiene precios de
compra por insumo; por ello, los costos mostrados son referenciales y editables"*.

Además, la **matriz de costos unitarios** tiene valores que no coinciden con lo que
calculan las recetas de ese mismo documento:

| Insumo | Matriz dice | Las recetas calculan | Diferencia |
|---|---|---|---|
| Café en grano | S/ 0.70 por gramo | S/ 0.07 por gramo | 10× |
| Café molido (Toddy) | S/ 70.00 por gramo | S/ 0.07 por gramo | 1000× |
| Café en grano de especialidad | S/ 0.95 por gramo | S/ 0.095 por gramo | 10× |
| Café filtrado | S/ 0.07 por ml | S/ 0.0084 por ml | 8× |
| Kion (jengibre), Maní, Menta, Sésamo | — | — | diferencias menores |

**Qué hicimos:** el sistema usa el costo que se deduce de la columna *"costo individual"*
de cada receta, que es la que suma el total por ración y es internamente coherente.
La matriz quedó como respaldo.

### 2.1 Una receta no cuadra

**Café Irlandés:** sus tres insumos suman S/ 7.01, pero el documento declara un total de
S/ 7.10. Las otras 100 recetas cuadran exactamente. Hay que revisar ese total.

**Qué necesitamos:** los **precios de compra vigentes** por insumo. Sin eso, el costo de
elaboración y el margen por plato que muestra el sistema son estimaciones, no cifras
reales. Todos los costos son editables desde Inventario.

---

## 3. Inventario — falta el stock real de casi todos los insumos

- El recetario usa **214 insumos** distintos.
- `INVENTARIO DE ALMACEN NO PREPARADO.docx` trae stock real de solo **17**.
- `ANEXO INVENTARIO DIARIO DE COCINA.xls` trae **25 preparaciones** de cocina.

**Qué hicimos:** se cargaron los 254 registros. Los 17 del almacén y las 25 preparaciones
tienen su stock real; los demás quedaron en **stock 0 y mínimo 0**, marcados con origen
"Recetario". No inventamos existencias.

**Ojo:** el sistema ya descuenta los insumos al cerrar una venta. Como la mayoría
está en 0, el stock queda en **negativo** y aparece marcado en rojo en Inventario.
Eso es a propósito: la venta nunca se bloquea, pero la alerta recuerda que falta
cargar las existencias.

**Qué necesitamos:**

1. El **inventario inicial** (stock actual) de los insumos que faltan.
2. El **stock mínimo** de cada insumo, para que funcionen las alertas de reposición.
3. La **ubicación física** real (almacén seco, refrigerado, congelado, barra).
4. Las **fechas de vencimiento** de los perecibles, para las alertas FEFO.

### 3.1 Tres insumos se miden distinto en el almacén y en el recetario

| Insumo | Almacén | Recetario |
|---|---|---|
| Chocolate artesanal | unidades (barras) | gramos |
| Helado artesanal | litros | gramos |
| Miel de abeja | litros | gramos |

**Qué hicimos:** quedaron como registros separados para no inventar una equivalencia.

**Qué necesitamos:** el peso de una barra de chocolate y la densidad (o el peso por litro)
del helado y la miel, para unificarlos en un solo insumo.

### 3.2 Las preparaciones de cocina no tienen costo

Las 25 preparaciones del inventario diario (Salsa Sinchi, Asado, Humus, Cr. Zapallo,
Hamb. Lent., Tamal, Juane, Cecina Carbonara, etc.) se cargaron con su stock real pero
con **costo 0**, porque el archivo no lo trae. Tampoco trae el stock mínimo de cada una.

### 3.3 El archivo de cocina está inconsistente

En varias filas del `.xls`, un producto empieza el turno en refrigerado y lo termina en
congelado (o al revés). Tomamos el valor de cierre del turno tarde del 19/09/2026.
Conviene revisar cómo se está llenando ese formato.

---

## 4. Proveedores — sin datos de contacto

`Proveedores Habituales e Insumos.docx` trae los 8 proveedores y qué insumo abastece cada
uno, pero **ningún dato de contacto**.

Falta, para los 8: **RUC o DNI, teléfono, correo, dirección y condiciones de pago**.

Dos aparecen con razón social formal (Lactopomacochas E.I.R.L. y Miel del Bosque E.I.R.L.)
y necesitamos su RUC para emitir órdenes de compra con comprobante.

**Qué hicimos:** los 8 proveedores están cargados con su nombre, origen y los insumos que
abastecen. Los campos de contacto quedaron **vacíos**, no inventados.

---

## 5. Usuarios — sin nombres ni correos reales

`USUARIOS Y PERFILES DEL SISTEMA.docx` describe muy bien las funciones de cada cargo
(Gerencia, Asistente de Gerencia, Contadora, Caja, Barra, Mozos, Cocina), pero no dice
**quién ocupa cada puesto**.

**Qué hicimos:** se creó un usuario por perfil, usando el cargo como nombre
(`Gerencia`, `Caja`, `Barra`…) y un correo genérico en el dominio `cafefusiones.com`.
Los permisos de cada rol sí salen de las funciones que describe el documento.

**Qué necesitamos:** nombre completo, correo y teléfono de cada trabajador que va a usar
el sistema, y cuántas personas hay por cargo (por ejemplo, cuántos mozos y cuántos
cocineros necesitan acceso propio).

---

## 6. Carta — faltan fotos y dos precios

- **Fotos de los platos:** ninguna. La carta en PDF no trae fotografías individuales.
  El sistema ya tiene el campo de imagen por plato y el check "Publicar en landing";
  hacen falta las fotos para que la carta pública se vea completa.

- **Box Lunch:** la carta lo anuncia ("Pregunta por nuestros deliciosos box lunches y
  servicios de catering") pero **no le pone precio**. No se cargó como producto.

- **Tamal tradicional y Juane:** están en la carta con precio (S/ 4.00 y S/ 6.00) pero el
  recetario **no tiene una ficha propia** para ellos; solo aparecen como ingrediente de
  otros platos. Por eso, al venderlos el sistema todavía no descuenta insumos.
  Necesitamos su receta estándar.

- **Nombres que se repiten:** "Americano" es a la vez un desayuno y un café; "Sinchi" es
  un desayuno y una pasta. Se respetaron los nombres de la carta y se distinguen por
  categoría, pero conviene confirmar si el cliente quiere diferenciarlos.

---

## 7. Identidad de marca — dos paletas distintas

| Documento | Colores |
|---|---|
| `IDENTIDAD CORPORATIVA.docx` | `#dd3336` y `#fb9934` |
| `MANUAL DE IDENTIDAD CORPORATIVA.pdf` | `#B81E2D`, `#5A2E1B`, `#D4A017`, `#F5EFE6` |

**Qué hicimos:** se guardó la paleta del **manual** (la más completa) como dato de marca
en Configuración. El sistema interno mantiene su tema minimalista en blanco y negro,
que es como se aprobó en la ronda anterior.

**Qué necesitamos:** confirmar cuál paleta es la vigente.

---

## 8. Productor del café — dos versiones

- `Proveedores Habituales e Insumos.docx` dice **"Caficultores del Valle del Huayabamba"**.
- La landing actual del prototipo decía "Cooperativa Agraria Rodríguez de Mendoza".

**Qué hicimos:** se usa **Caficultores del Valle del Huayabamba**, que es lo que dice el
documento del cliente.

**Qué necesitamos:** el nombre exacto de la asociación o cooperativa, y los datos del lote
vigente para la trazabilidad pública: variedad, tipo de tueste, fecha de recepción, fecha
de tostado y stock actual (esos campos quedaron vacíos).

---

## 9. Otros datos que no llegaron

- **RUC de la empresa:** sí lo tenemos (20603881142) y ya reemplazó al de prueba.
- **Facturación electrónica (SUNAT):** el TDR la pide (HU-54, HU-55) pero no hay datos de
  configuración: serie de boleta, serie de factura, certificado ni proveedor OSE.
- **Horario de domingo:** `OPERACION DEL NEGOCIO.docx` dice en un párrafo
  "3:00 a 9:00 pm" y más abajo "15:00 A 22:00 HORAS". Cargamos 15:00–21:00 siguiendo el
  primero; hay que confirmar.
- **Turnos de trabajo:** están documentados (dos turnos de lunes a sábado) pero quedaron
  fuera del alcance de esta entrega. Solo se guardó el horario de atención.
- **Delivery:** el TDR y el backlog lo piden, pero los procesos operativos actuales no lo
  describen. Se dejó un punto de venta "Para llevar" para pedidos que no ocupan salón.
- **Segunda sucursal:** el sistema ya soporta varias sucursales, pero solo hay una
  cargada (Chachapoyas - Principal).
- **Precio de compra de las bebidas listas** (cervezas, vinos, agua, gaseosa): no figura
  en ningún documento. Quedaron en costo 0.
