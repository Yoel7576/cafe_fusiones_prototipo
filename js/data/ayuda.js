// Cafe Fusiones - Contenido del centro de ayuda (manual de uso del sistema).
// Ruta: js/data/ayuda.js
//
// Es texto de ayuda, no estado: no se guarda en localStorage. La pantalla
// pages/ayuda.html lo agrupa por seccion y lo filtra con el buscador.
//
// Cada tema:
//   id       identificador unico (se usa en el enlace #tema)
//   section  inicio | modulos | flujos | roles | preguntas
//   module   id del modulo relacionado (para el acceso directo), opcional
//   title    pregunta o nombre del tema
//   summary  una linea que explica para que sirve
//   steps    pasos numerados, opcional
//   tips     notas o advertencias, opcional

export const HELP_SECTIONS = [
  { id: "inicio", label: "Primeros pasos" },
  { id: "modulos", label: "Módulos" },
  { id: "flujos", label: "Flujos de trabajo" },
  { id: "roles", label: "Roles y permisos" },
  { id: "preguntas", label: "Preguntas frecuentes" }
];

// Modulos del sistema con su pagina, para los accesos directos.
export const HELP_MODULES = {
  dashboard: { label: "Inicio", href: "dashboard.html" },
  ventas: { label: "Ventas", href: "ventas.html" },
  caja: { label: "Caja", href: "caja.html" },
  inventario: { label: "Inventario", href: "inventario.html" },
  clientes: { label: "Clientes", href: "clientes.html" },
  reportes: { label: "Reportes", href: "reportes.html" },
  admin: { label: "Administración", href: "admin.html" },
  configuracion: { label: "Configuración", href: "configuracion.html" },
  notificaciones: { label: "Notificaciones", href: "notificaciones.html" }
};

export const HELP_TOPICS = [
  /* ==========================================================================
     PRIMEROS PASOS
     ========================================================================== */
  {
    id: "ingresar",
    section: "inicio",
    title: "Ingresar al sistema",
    summary: "Cómo iniciar sesión y qué ves al entrar.",
    steps: [
      "Abre la pantalla de acceso y escribe tu usuario y tu clave.",
      "Al entrar llegas a Inicio, con las ventas del día, los pedidos activos y el stock crítico.",
      "El menú lateral solo muestra los módulos que tu rol puede usar."
    ],
    tips: [
      "En el prototipo de demostración el usuario es CFUSIONES y la clave es prototipo.",
      "La sesión se cierra al cerrar el navegador o con Cerrar sesión en el menú lateral."
    ]
  },
  {
    id: "navegar",
    section: "inicio",
    title: "Moverse por el sistema",
    summary: "Menú lateral, submenús y buscador superior.",
    steps: [
      "Usa el menú lateral para cambiar de módulo. La opción en rojo es la pantalla actual.",
      "Dentro de cada módulo, el submenú de la parte superior separa sus secciones (por ejemplo, en Reportes: Balance, Desempeño, Ventas, Clientes y Stock).",
      "El botón de tres rayas encima del menú lo contrae para ganar espacio.",
      "En el celular el menú se muestra como una barra inferior."
    ],
    tips: [
      "Cada sección tiene su propia dirección: puedes guardarla en favoritos o compartir el enlace con otra persona del equipo."
    ]
  },
  {
    id: "sucursal-activa",
    section: "inicio",
    title: "Elegir la sucursal activa",
    summary: "Las ventas, mesas y estaciones se registran en la sucursal activa.",
    module: "configuracion",
    steps: [
      "Entra a Configuración.",
      "En Configuración central, elige la sucursal en el selector Sucursal activa.",
      "Desde ese momento, las operaciones que dependen del local se guardan en esa sucursal."
    ],
    tips: [
      "Los clientes son de toda la marca: se ven desde cualquier sucursal."
    ]
  },
  {
    id: "datos-navegador",
    section: "inicio",
    title: "Dónde se guarda la información",
    summary: "El prototipo guarda todo en el navegador del equipo.",
    tips: [
      "La información se guarda en este navegador. Si usas otro equipo u otro navegador, no verás los mismos datos.",
      "Borrar los datos de navegación del navegador borra también la información del sistema.",
      "Después de una actualización del sistema, recarga la página con Ctrl+F5 para ver la última versión."
    ]
  },

  /* ==========================================================================
     MODULOS
     ========================================================================== */
  {
    id: "modulo-inicio",
    section: "modulos",
    module: "dashboard",
    title: "Inicio",
    summary: "Tablero del día: lo que necesita atención ahora.",
    steps: [
      "Primeros pasos: lista de puesta en marcha (inventario inicial, mínimos, recetas, datos fiscales y primera caja). Se marca sola y desaparece al completarse.",
      "Estado del turno: si la caja está abierta o cerrada, la sucursal activa y la fecha.",
      "Indicadores: ventas, ticket promedio, mesas atendidas y productos vendidos, comparados con el mismo día de la semana pasada.",
      "Salón ahora: mesas libres, ocupadas, por cobrar y reservadas, y los pedidos de cocina y barra con sus demoras.",
      "Pendientes: cuentas por cobrar, pedidos listos o demorados, stock negativo o en mínimo, lotes por vencer, reservas sin confirmar, anulaciones y platos sin receta. Cada uno lleva a donde se resuelve.",
      "Más vendidos hoy y Reservas de hoy."
    ]
  },
  {
    id: "modulo-ventas",
    section: "modulos",
    module: "ventas",
    title: "Ventas",
    summary: "Salón, pedidos, producción e historial de ventas.",
    steps: [
      "Salón: muestra el plano con cada mesa en su color de estado (libre, ocupada, reservada o con pedido listo).",
      "Toca una mesa para abrirla, ver su consumo o tomar un pedido.",
      "Toca Cocina o Barra en el plano para ir a su pantalla de producción.",
      "Pedidos: lista los pedidos abiertos de todas las mesas.",
      "Producción: pantalla de cocina y barra (KDS) con los estados Nuevo, Preparando, Listo y Entregado.",
      "Historial: ventas cerradas del turno."
    ]
  },
  {
    id: "modulo-caja",
    section: "modulos",
    module: "caja",
    title: "Caja",
    summary: "Apertura y cierre de turno, cobros, ingresos y egresos.",
    steps: [
      "Abre la caja con el monto inicial en efectivo.",
      "Las ventas cobradas en efectivo o POS (tarjeta, Yape o Plin) se suman solas.",
      "Registra los ingresos y egresos manuales con su concepto.",
      "Al cerrar, cuenta el efectivo e ingrésalo: el sistema lo compara con el efectivo esperado.",
      "Descarga el reporte de cierre con ventas, medios de pago, anulaciones y egresos."
    ]
  },
  {
    id: "modulo-inventario",
    section: "modulos",
    module: "inventario",
    title: "Inventario",
    summary: "Stock, Kardex, lotes, compras, proveedores, mermas y producción.",
    steps: [
      "Resumen: alertas prioritarias y últimos movimientos.",
      "Stock: existencias actuales de cada insumo. Desde aquí se ajusta el stock.",
      "Kardex: todas las entradas y salidas, incluidas las que descuenta cada venta.",
      "Lotes: lotes y fechas de vencimiento.",
      "Compras y Proveedores: órdenes de compra y datos de cada proveedor.",
      "Mermas: registro de pérdidas por vencimiento, derrame, error de preparación, etc.",
      "Producción: rendimientos y transformaciones de insumos."
    ],
    tips: [
      "Las unidades son g, ml y un (unidades), las mismas del recetario."
    ]
  },
  {
    id: "modulo-clientes",
    section: "modulos",
    module: "clientes",
    title: "Clientes",
    summary: "Base de clientes, reservas y fidelización.",
    steps: [
      "Clientes: registra y busca clientes, con su historial de compras y actividad.",
      "Reservas: agenda reservas con fecha, hora, mesa y número de personas.",
      "Fidelización: puntos, niveles y recompensas. Configura las reglas de acumulación."
    ]
  },
  {
    id: "modulo-reportes",
    section: "modulos",
    module: "reportes",
    title: "Reportes",
    summary: "Balance, desempeño de mozos, ventas, clientes y stock.",
    steps: [
      "Define el rango de fechas y, si hace falta, filtra por canal, mozo, área o categoría.",
      "Elige la sección en el submenú: Balance, Desempeño, Ventas, Clientes o Stock.",
      "Balance, Desempeño y Ventas muestran un gráfico arriba de la tabla; pasa el cursor por una barra para ver el detalle.",
      "Exporta el resultado en PDF, Excel o CSV con los botones de la caja de filtros. El CSV descarga la sección que estás viendo."
    ],
    tips: [
      "Los filtros también cambian los indicadores de arriba (Ingresos, Egresos, Utilidad y Margen).",
      "En Stock la tabla muestra 20 filas por página; usa Anterior y Siguiente para recorrerla."
    ]
  },
  {
    id: "modulo-admin",
    section: "modulos",
    module: "admin",
    title: "Administración",
    summary: "Carta, recetas, categorías, trazabilidad e historial.",
    steps: [
      "Gestión de carta: platos, precios, estación (Cocina o Barra), foto y publicación en la web.",
      "Recetas: insumos y cantidades de cada plato; calcula costo y margen.",
      "Categorías: catálogos de carta, carta pública, inventario y gastos.",
      "Trazabilidad: lotes de café y sus páginas públicas en la web.",
      "Historial: registro de auditoría, 20 movimientos por página."
    ]
  },
  {
    id: "modulo-configuracion",
    section: "modulos",
    module: "configuracion",
    title: "Configuración",
    summary: "Datos del negocio, sucursales, usuarios y permisos, y parámetros del sistema.",
    steps: [
      "General: datos del negocio y de facturación.",
      "Sucursales: crea, edita, activa o desactiva locales y define la principal.",
      "Usuarios y permisos: roles, sucursales asignadas y permisos personalizados.",
      "Sistema: mesas y plano del salón, estaciones, impresión y parámetros (KDS y fidelización)."
    ]
  },
  {
    id: "modulo-notificaciones",
    section: "modulos",
    module: "notificaciones",
    title: "Notificaciones",
    summary: "Avisos de stock bajo, stock negativo y vencimientos próximos.",
    tips: [
      "Un insumo solo avisa stock bajo si tiene un mínimo definido en Inventario.",
      "Los avisos de vencimiento aparecen 7 días antes de la fecha."
    ]
  },

  /* ==========================================================================
     FLUJOS DE TRABAJO
     ========================================================================== */
  {
    id: "flujo-pedido",
    section: "flujos",
    module: "ventas",
    title: "Tomar un pedido (mozo)",
    summary: "Desde la mesa hasta la cocina o la barra.",
    steps: [
      "En Ventas > Salón, toca la mesa y elige Tomar pedido.",
      "Busca los productos por categoría o por nombre y agrégalos.",
      "Si el cliente lo pide, anota la preparación o la opción vegana del producto.",
      "Envía el pedido: cada producto llega a la pantalla de su estación (Cocina o Barra)."
    ],
    tips: [
      "El mozo nunca cobra: cuando el cliente pide la cuenta, usa Solicitar cuenta y la mesa queda en espera para caja."
    ]
  },
  {
    id: "flujo-produccion",
    section: "flujos",
    module: "ventas",
    title: "Preparar pedidos (cocina y barra)",
    summary: "Uso de la pantalla de producción (KDS).",
    steps: [
      "Entra a Ventas > Producción y filtra por tu estación.",
      "Los pedidos entran en Nuevo. Tócalos para pasarlos a Preparando.",
      "Cuando estén listos, márcalos como Listo: la mesa se pinta de color en el plano para avisar al mozo.",
      "Al servirlos, se marcan como Entregado."
    ],
    tips: [
      "Los pedidos que pasan el tiempo objetivo de la estación se marcan como Demorado."
    ]
  },
  {
    id: "flujo-cobro",
    section: "flujos",
    module: "ventas",
    title: "Cobrar una mesa",
    summary: "Precuenta, comprobante y medio de pago.",
    steps: [
      "Abre la mesa y elige Cobrar para ver la precuenta.",
      "Emite la precuenta si el cliente quiere revisarla.",
      "Cobra con Efectivo o con POS (tarjeta, Yape o Plin).",
      "Si corresponde, emite el comprobante.",
      "Al cerrar la venta, la mesa vuelve a quedar libre y el inventario se descuenta según la receta de cada producto."
    ],
    tips: [
      "Para cobrar la caja debe estar abierta."
    ]
  },
  {
    id: "flujo-anular",
    section: "flujos",
    module: "ventas",
    title: "Anular un producto",
    summary: "Quitar un producto de la cuenta con autorización.",
    steps: [
      "En la precuenta de la mesa, toca Anular junto al producto.",
      "Escribe el motivo de la anulación.",
      "Ingresa la clave de autorización y confirma."
    ],
    tips: [
      "Cada anulación queda en auditoría y aparece en el cierre de caja como producto anulado."
    ]
  },
  {
    id: "flujo-caja",
    section: "flujos",
    module: "caja",
    title: "Abrir y cerrar la caja",
    summary: "El turno de caja de principio a fin.",
    steps: [
      "Al empezar el turno, entra a Caja y toca Abrir caja con el monto inicial.",
      "Durante el día, registra los ingresos y egresos manuales con su concepto.",
      "Al terminar, toca Cerrar caja, cuenta el efectivo y escribe el monto contado.",
      "Revisa la diferencia con el efectivo esperado y confirma el cierre.",
      "Descarga el reporte de cierre."
    ]
  },
  {
    id: "flujo-inventario",
    section: "flujos",
    module: "inventario",
    title: "Registrar compras, mermas y ajustes",
    summary: "Mantener el stock al día.",
    steps: [
      "Registra las compras a proveedores en Compras (Nueva orden de compra).",
      "Si algo se pierde o se malogra, regístralo en Mermas con su motivo.",
      "Si el conteo físico no coincide, usa Ajustar stock desde la pestaña Stock.",
      "Revisa el Kardex para ver el detalle de cada movimiento."
    ],
    tips: [
      "La falta de stock no bloquea una venta: el insumo queda en negativo y se marca en Inventario. Registra la entrada para regularizarlo."
    ]
  },
  {
    id: "flujo-plato",
    section: "flujos",
    module: "admin",
    title: "Crear un plato con su receta",
    summary: "Nuevo producto en la carta y su costo.",
    steps: [
      "En Administración > Gestión de carta, toca Nuevo plato.",
      "Completa el nombre, la categoría, el precio y la estación (Cocina o Barra).",
      "Guarda y ve a Recetas para asignarle los insumos y las cantidades.",
      "El sistema calcula el costo y el margen del plato.",
      "Marca Mostrar en la landing si quieres que aparezca en la carta de la web."
    ],
    tips: [
      "Los productos de despacho directo, como botellas, no llevan receta: descuentan su insumo asociado."
    ]
  },
  {
    id: "flujo-trazabilidad",
    section: "flujos",
    module: "admin",
    title: "Publicar un lote de café en la web",
    summary: "Ficha de trazabilidad y su página pública.",
    steps: [
      "En Administración > Trazabilidad > Registro de lotes, completa la ficha del lote.",
      "Agrega los pasos del recorrido, las imágenes y las preparaciones recomendadas.",
      "Marca Publicar en la web y guarda.",
      "En Páginas publicadas, usa el menú de tres puntos para ver la página, copiar el enlace, editarla o eliminarla."
    ],
    tips: [
      "Eliminar una página no borra el lote: solo deja de mostrarse en la web y se puede volver a publicar desde Sin publicar."
    ]
  },
  {
    id: "flujo-mesas",
    section: "flujos",
    module: "configuracion",
    title: "Editar el plano de mesas",
    summary: "Mover mesas y zonas del salón.",
    steps: [
      "Entra a Configuración > Sistema y toca Gestionar mesas.",
      "Arrastra una mesa o una zona para moverla; se alinea sola a la cuadrícula.",
      "Toca una mesa para cambiar su nombre, zona, capacidad o forma.",
      "Usa Nueva mesa o Nueva zona para agregar elementos."
    ],
    tips: [
      "Todas las mesas tienen el mismo tamaño: el lado de una mesa cuadrada es igual al diámetro de una redonda.",
      "Ventas > Salón muestra el plano tal como quede guardado aquí."
    ]
  },
  {
    id: "flujo-categorias",
    section: "flujos",
    module: "admin",
    title: "Crear categorías",
    summary: "Organizar la carta, el inventario y los gastos.",
    steps: [
      "Entra a Administración > Categorías.",
      "Elige el tipo: Carta / productos, Carta pública / Landing, Inventario / insumos o Gastos.",
      "Toca Nueva categoría, escribe el nombre y define en qué sucursales aplica.",
      "Usa las flechas para cambiar el orden en que se muestran."
    ],
    tips: [
      "Las categorías con historial no se borran: se desactivan."
    ]
  },
  {
    id: "flujo-usuario",
    section: "flujos",
    module: "configuracion",
    title: "Dar de alta a un usuario",
    summary: "Nuevo usuario con su rol y sus permisos.",
    steps: [
      "Entra a Configuración > Usuarios y permisos y toca Nuevo usuario.",
      "Completa los datos y elige su rol.",
      "Asigna las sucursales donde trabaja.",
      "Si necesita accesos distintos a los de su rol, usa Permisos y elige Personalizar este usuario."
    ]
  },

  /* ==========================================================================
     PREGUNTAS FRECUENTES
     ========================================================================== */
  {
    id: "faq-no-veo-modulo",
    section: "preguntas",
    title: "No veo un módulo en el menú",
    summary: "El menú depende de tu rol.",
    tips: [
      "Cada rol ve solo los módulos que necesita. Revisa la sección Roles y permisos.",
      "Si necesitas un acceso adicional, pídelo a Gerencia o al Administrador del sistema."
    ]
  },
  {
    id: "faq-stock-negativo",
    section: "preguntas",
    module: "inventario",
    title: "¿Por qué un insumo tiene stock negativo?",
    summary: "Se vendió sin existencias registradas.",
    tips: [
      "El sistema no bloquea una venta por falta de stock: descuenta el insumo aunque quede en negativo.",
      "Registra la compra o el ajuste de inventario para regularizarlo."
    ]
  },
  {
    id: "faq-sin-receta",
    section: "preguntas",
    module: "admin",
    title: "Un producto se vendió \"sin receta\"",
    summary: "El plato no tiene receta ni insumo asociado.",
    tips: [
      "Mientras no tenga receta, la venta no descuenta ningún insumo.",
      "Asígnale una receta en Administración > Recetas, o un insumo directo si es un producto de despacho directo."
    ]
  },
  {
    id: "faq-no-critico",
    section: "preguntas",
    module: "inventario",
    title: "Un insumo está agotado pero no aparece como crítico",
    summary: "Le falta el mínimo.",
    tips: [
      "Un insumo solo se marca como crítico si tiene un mínimo definido y lo alcanzó.",
      "Define el mínimo del insumo en Inventario para recibir el aviso."
    ]
  },
  {
    id: "faq-web",
    section: "preguntas",
    module: "admin",
    title: "Un plato o un lote no aparece en la web",
    summary: "Revisa su publicación.",
    tips: [
      "En Gestión de carta, el plato debe tener marcado Mostrar en la landing.",
      "En Trazabilidad, el lote debe estar en Páginas publicadas > En la web."
    ]
  },
  {
    id: "faq-no-cambios",
    section: "preguntas",
    title: "No veo los últimos cambios del sistema",
    summary: "El navegador muestra una versión guardada.",
    tips: [
      "Recarga la página con Ctrl+F5 para descargar la última versión."
    ]
  },
  {
    id: "faq-borrar",
    section: "preguntas",
    title: "¿Por qué no puedo eliminar un registro?",
    summary: "Los registros con historial se conservan.",
    tips: [
      "Sucursales, usuarios, categorías y otros registros con historial no se eliminan: se activan o desactivan, para no perder la trazabilidad de lo que ya se registró."
    ]
  }
];

// Descripcion de cada rol para la seccion Roles y permisos.
export const HELP_ROLES = {
  Gerencia: "Dirección general: supervisa todas las áreas del negocio.",
  Administrador: "Perfil técnico del sistema: configuración y soporte.",
  "Asistente de Gerencia": "Soporte administrativo: caja chica, turnos y control de existencias.",
  Contadora: "Registro contable, obligaciones tributarias y estados financieros.",
  Cajero: "Cobro, cuadre de caja, comprobantes y atención inicial al cliente.",
  Barra: "Prepara bebidas y controla el stock de su estación. No cobra.",
  Mozo: "Atiende el salón y toma pedidos. Nunca cobra.",
  Cocina: "Elabora los platos y controla el inventario diario de cocina.",
  Operaciones: "Perfil transversal de apoyo a operaciones."
};
