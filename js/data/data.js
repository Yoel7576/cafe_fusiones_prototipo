// Cafe Fusiones - Datos demo del prototipo.
// Base funcional para la V4 del frontend.
// Mantiene los exports usados por el prototipo actual y agrega datos
// que utilizaremos en Ventas/KDS, Inventario/Mermas, Clientes/Fidelizacion
// y Reportes/Marketing.

export const demoUser = {
  username: "CFUSIONES",
  password: "prototipo",
  name: "Cafe Fusiones",
  role: "Administrador",
  email: "gerencia@cafefusiones.com",
  phone: "990285862",
  initials: "CF"
};

export const navItems = [
  { id: "dashboard", label: "Inicio", icon: "layout", mobile: true },
  { id: "ventas", label: "Ventas", icon: "receipt", mobile: true },
  { id: "caja", label: "Caja", icon: "cash", mobile: true },
  { id: "inventario", label: "Inventario", icon: "boxes", mobile: false },
  { id: "clientes", label: "Clientes", icon: "users", mobile: false },
  { id: "reportes", label: "Reportes", icon: "chart", mobile: false },
  { id: "admin", label: "Administracion", icon: "shield", mobile: false }
];

export const metrics = [
  { label: "Ventas de hoy", value: "S/ 2,840", trend: "+18%", tone: "ok" },
  { label: "Pedidos activos", value: "12", trend: "3 listos", tone: "warn" },
  { label: "Tiempo promedio", value: "8m 42s", trend: "-1m 10s", tone: "ok" },
  { label: "Stock critico", value: "5", trend: "revisar", tone: "danger" }
];

export const salesByChannel = [
  { label: "Local", value: 61, amount: "S/ 1,732" },
  { label: "Delivery", value: 23, amount: "S/ 653" },
  { label: "Reservas", value: 10, amount: "S/ 284" },
  { label: "Telefonico", value: 6, amount: "S/ 171" }
];

/* ==================== CARTA REAL / DEMO ==================== */

export const menuCategories = [
  "Todos",
  "Cafe",
  "Chocolate",
  "Metodos de cafe",
  "Desayunos",
  "Sandwiches",
  "Sopas y cremas",
  "Ensaladas",
  "Pastas",
  "Fusiones",
  "Postres",
  "Infusiones y tes",
  "Jugos y batidos",
  "Bebidas",
  "Cocteles"
];

const plantMilkModifier = {
  id: "milk",
  label: "Tipo de leche",
  required: false,
  options: [
    { id: "regular", label: "Leche regular", price: 0 },
    { id: "coco", label: "Leche de coco", price: 4 },
    { id: "avena", label: "Leche de avena", price: 4 },
    { id: "almendras", label: "Leche de almendras", price: 4 },
    { id: "soya", label: "Leche de soya", price: 4 }
  ]
};

const coffeePreferencesModifier = {
  id: "coffee_preferences",
  label: "Preferencias",
  required: false,
  multiple: true,
  options: [
    { id: "sin_azucar", label: "Sin azucar", price: 0 },
    { id: "poca_azucar", label: "Poca azucar", price: 0 },
    { id: "extra_caliente", label: "Extra caliente", price: 0 }
  ]
};

export const menuItems = [
  { id: "caf-espresso", name: "Espresso", category: "Cafe", price: 5.5, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 3, description: "Cafe intenso y concentrado.", descriptionEn: "Intense and concentrated coffee.", dietary: [], modifiers: [coffeePreferencesModifier] },
  { id: "caf-americano", name: "Cafe Americano", category: "Cafe", price: 6, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 3, description: "Espresso con agua, suave.", descriptionEn: "Espresso with water, smooth.", dietary: [], modifiers: [coffeePreferencesModifier] },
  { id: "caf-canelado", name: "Cafe Canelado", category: "Cafe", price: 6, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 4, description: "Americano y canela.", descriptionEn: "Americano with cinnamon.", dietary: [], modifiers: [coffeePreferencesModifier] },
  { id: "caf-macchiato", name: "Cafe Macchiato", category: "Cafe", price: 7, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 4, description: "Espresso con espuma de leche.", descriptionEn: "Espresso with milk foam.", dietary: [], modifiers: [plantMilkModifier, coffeePreferencesModifier] },
  { id: "caf-cappuccino", name: "Cappuccino", category: "Cafe", price: 8, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 5, description: "Espresso con leche y espuma.", descriptionEn: "Espresso with milk and foam.", dietary: [], modifiers: [plantMilkModifier, coffeePreferencesModifier] },
  { id: "caf-latte", name: "Cafe Latte", category: "Cafe", price: 8, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 5, description: "Espresso con leche cremosa.", descriptionEn: "Espresso with frothy milk.", dietary: [], modifiers: [plantMilkModifier, coffeePreferencesModifier] },
  { id: "caf-mocha", name: "Mocha Hot Chocolate", category: "Cafe", price: 10, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Chocolate con espresso y leche cremosa.", descriptionEn: "Chocolate with espresso and frothy milk.", dietary: [], modifiers: [plantMilkModifier, coffeePreferencesModifier] },
  { id: "caf-orange", name: "Orange Coffee", category: "Cafe", price: 10, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 5, description: "Naranja, cafe y hielo.", descriptionEn: "Orange, coffee and ice.", dietary: [], modifiers: [] },
  { id: "caf-frapu", name: "Frapuccino de cafe", category: "Cafe", price: 14, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 7, description: "Cafe frio con hielo y crema.", descriptionEn: "Iced coffee with ice and cream.", dietary: [], modifiers: [plantMilkModifier] },
  { id: "caf-coldbrew", name: "Cold Brew", category: "Cafe", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 4, description: "Cafe con ginger ale y hielo, metodo Toddy.", descriptionEn: "Cold-brew coffee with ginger ale and ice.", dietary: [], modifiers: [] },

  { id: "cho-caliente", name: "Chocolate caliente", category: "Chocolate", price: 10, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Chocolate cremoso y dulce.", descriptionEn: "Hot chocolate.", dietary: [], modifiers: [plantMilkModifier] },
  { id: "met-v60", name: "V60", category: "Metodos de cafe", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 8, description: "Suave y puro.", descriptionEn: "Smooth and pure.", dietary: [], modifiers: [] },
  { id: "met-prensa", name: "Prensa Francesa", category: "Metodos de cafe", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 9, description: "Cuerpo y textura.", descriptionEn: "Bold and rich texture.", dietary: [], modifiers: [] },
  { id: "met-aeropress", name: "AeroPress", category: "Metodos de cafe", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 8, description: "Intenso y versatil.", descriptionEn: "Intense and versatile.", dietary: [], modifiers: [] },

  { id: "des-energetico", name: "Energético", category: "Desayunos", price: 16, stock: 24, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 12, description: "Bebida caliente de quinua con manzana, panes, queso y palta.", descriptionEn: "Hot quinoa drink with apple, bread, cheese and avocado.", dietary: ["vegetariano"], modifiers: [] },
  { id: "des-sinchi", name: "Sinchi", category: "Desayunos", price: 18, stock: 20, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 14, description: "Jugo del dia, cafe, pan tostado y omelet con verduras y queso.", descriptionEn: "Juice, coffee, toast and vegetable-cheese omelet.", dietary: ["vegetariano"], modifiers: [] },
  { id: "des-americano", name: "Desayuno Americano", category: "Desayunos", price: 16, stock: 22, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 12, description: "Jugo, cafe, pan tostado, huevos, mermelada y mantequilla.", descriptionEn: "Juice, coffee, toast, eggs, jam and butter.", dietary: [], modifiers: [] },
  { id: "des-regional", name: "Regional", category: "Desayunos", price: 18, stock: 18, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 14, description: "Jugo, cafe, pan tostado, huevos con chorizo regional y yuquitas.", descriptionEn: "Juice, coffee, toast, eggs with regional sausage and cassava.", dietary: [], modifiers: [] },

  { id: "san-pollo", name: "Pollo y apio", category: "Sandwiches", price: 10, stock: 18, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 8, description: "Pollo, lechuga, mayonesa y apio.", descriptionEn: "Chicken, lettuce, mayonnaise and celery.", dietary: [], modifiers: [] },
  { id: "san-acevichado", name: "Acevichado", category: "Sandwiches", price: 13, stock: 16, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 9, description: "Pollo, palta, lechuga y salsa acevichada.", descriptionEn: "Chicken, avocado, lettuce and acevichada sauce.", dietary: [], modifiers: [] },
  { id: "san-hummus", name: "Veggie grill hummus", category: "Sandwiches", price: 12, stock: 14, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 10, description: "Berenjena morada, aji escabeche y cebolla.", descriptionEn: "Eggplant, yellow chili pepper and onion.", dietary: ["vegetariano"], modifiers: [] },

  { id: "sop-zapallo", name: "Crema de zapallo", category: "Sopas y cremas", price: 12, stock: 16, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 9, description: "Suave y cremosa, con el dulzor natural del zapallo.", descriptionEn: "Smooth and creamy squash soup.", dietary: ["vegetariano", "adaptable_vegano"], modifiers: [] },
  { id: "ens-quinoa", name: "Ensalada de quinoa", category: "Ensaladas", price: 16, stock: 15, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 9, description: "Quinoa, tomate, pepino, pimiento, perejil y menta.", descriptionEn: "Quinoa, tomato, cucumber, bell pepper, parsley and mint.", dietary: ["vegano"], modifiers: [] },

  { id: "pas-carbonara", name: "Carbonara con cecina regional", category: "Pastas", price: 23, stock: 12, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 16, description: "Crema de leche, leche y cecina de cerdo regional.", descriptionEn: "Carbonara with locally made pork.", dietary: [], modifiers: [] },
  { id: "pas-zucchini", name: "Espagueti con Zucchini", category: "Pastas", price: 18, stock: 14, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 15, description: "Zucchini, tomate, brocoli, aceitunas y pimiento en aceite de oliva.", descriptionEn: "Zucchini, tomato, broccoli, olives and pepper in olive oil.", dietary: ["vegano"], modifiers: [] },

  { id: "fus-quinoto", name: "Quinoto", category: "Fusiones", price: 25, stock: 10, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 18, description: "Risotto de quinoa con asado de carne al jugo.", descriptionEn: "Quinoa risotto with roast beef au jus.", dietary: [], modifiers: [] },
  { id: "fus-tortilla", name: "Tortilla española", category: "Fusiones", price: 20, stock: 12, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 14, description: "Huevos, papas, cebolla y pimiento.", descriptionEn: "Spanish tortilla with eggs, potatoes, onion and pepper.", dietary: ["vegetariano"], modifiers: [] },

  { id: "pos-brownie", name: "Brownie con fudge y helado", category: "Postres", price: 8, stock: 18, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Brownie de chocolate, fudge y una bola de helado.", descriptionEn: "Chocolate brownie, fudge and ice cream.", dietary: [], modifiers: [] },
  { id: "pos-pie", name: "Pie de manzana con helado", category: "Postres", price: 8, stock: 14, channel: "Local", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Pie de manzana servido con helado cremoso.", descriptionEn: "Apple pie served with creamy ice cream.", dietary: [], modifiers: [] },

  { id: "tea-muna", name: "Infusion de Muña", category: "Infusiones y tes", price: 4, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 5, description: "Refrescante y digestiva.", descriptionEn: "Refreshing and digestive herbal tea.", dietary: ["vegano"], modifiers: [] },
  { id: "tea-manzana", name: "Te de manzana casera", category: "Infusiones y tes", price: 5, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Dulce y reconfortante.", descriptionEn: "Sweet and comforting homemade apple tea.", dietary: ["vegano"], modifiers: [] },

  { id: "jug-naranja", name: "Jugo de Naranja", category: "Jugos y batidos", price: 10, stock: 30, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 5, description: "Jugo recien exprimido.", descriptionEn: "Freshly squeezed orange juice.", dietary: ["vegano"], modifiers: [] },
  { id: "bat-energetico", name: "Batido energetico Mango y quinoa", category: "Jugos y batidos", price: 12, stock: 20, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 7, description: "Batido cremoso de mango y quinoa.", descriptionEn: "Creamy mango and quinoa smoothie.", dietary: ["vegetariano"], modifiers: [plantMilkModifier] },

  { id: "beb-agua", name: "Agua mineral", category: "Bebidas", price: 2.5, stock: 36, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-11", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 1.2, description: "Agua mineral lista para despacho.", descriptionEn: "Mineral water.", dietary: ["vegano"], modifiers: [] },
  { id: "beb-gaseosa", name: "Gaseosa", category: "Bebidas", price: 2.5, stock: 42, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-12", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 1.3, description: "Bebida embotellada lista para despacho.", descriptionEn: "Soda.", dietary: ["vegano"], modifiers: [] },
  { id: "beb-cusquena", name: "Cerveza Cusqueña", category: "Bebidas", price: 9, stock: 24, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-13", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 5.2, description: "Cerveza premium peruana.", descriptionEn: "Premium Peruvian beer.", dietary: [], modifiers: [] },
  { id: "beb-pilsen", name: "Cerveza Pilsen", category: "Bebidas", price: 9, stock: 20, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-14", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 4.8, description: "Cerveza ligera peruana.", descriptionEn: "Traditional Peruvian light beer.", dietary: [], modifiers: [] },
  { id: "beb-artesanal", name: "Cerveza artesanal", category: "Bebidas", price: 13, stock: 18, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-15", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 7.4, description: "Variedad seleccionada de cerveza artesanal.", descriptionEn: "Selection of craft beers.", dietary: [], modifiers: [] },
  { id: "beb-vino-copa", name: "Copa de vino", category: "Bebidas", price: 15, stock: 18, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-16", editUntil: "Pendiente de entrega", estimatedTime: 2, estimatedCost: 7.5, description: "Vino tinto o blanco servido en copa.", descriptionEn: "Glass of red or white wine.", dietary: [], modifiers: [] },
  { id: "beb-vino-botella", name: "Botella de vino", category: "Bebidas", price: 60, stock: 10, channel: "Local", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStation: "Barra", inventoryMode: "direct", inventoryItemId: "INS-17", editUntil: "Pendiente de entrega", estimatedTime: 1, estimatedCost: 34, description: "Botella de vino lista para despacho.", descriptionEn: "Bottle of wine.", dietary: [], modifiers: [] },

  { id: "coct-pisco-sour", name: "Pisco Sour", category: "Cocteles", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 7, description: "Clasico peruano con pisco y limon.", descriptionEn: "Classic Peruvian cocktail with pisco and lime.", dietary: [], modifiers: [] },
  { id: "coct-chilcano", name: "Chilcano", category: "Cocteles", price: 15, stock: 99, channel: "Local", station: "Barra", operationType: "preparation", requiresPreparation: true, dispatchStation: "Barra", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 6, description: "Pisco, ginger ale y limon.", descriptionEn: "Pisco, ginger ale and lime.", dietary: [], modifiers: [] },

  { id: "box-lunch", name: "Box lunch", category: "Fusiones", price: 30, stock: 12, channel: "Delivery", station: "Cocina", operationType: "preparation", requiresPreparation: true, dispatchStation: "Cocina", inventoryMode: "recipe", editUntil: "Nuevo", estimatedTime: 15, description: "Opcion personalizable para tours y actividades.", descriptionEn: "Customizable box lunch for tours and activities.", dietary: [], modifiers: [] }
];

/* ==================== SALON REAL ==================== */
// Coordenadas relativas al plano entregado por Cafe Fusiones.
// x/y/w/h se expresan en porcentaje para superponer hotspots sobre una imagen.
export const tables = [
  { id: "M1", name: "Mesa 1", area: "Salon principal", seats: 2, status: "Libre", map: { x: 72.1, y: 45.0, w: 6.8, h: 7.0 } },
  { id: "M2", name: "Mesa 2", area: "Salon lateral", seats: 2, status: "Libre", map: { x: 18.9, y: 49.0, w: 7.4, h: 7.4, shape: "round" } },
  { id: "M3", name: "Mesa 3", area: "Salon principal", seats: 4, status: "Ocupada", map: { x: 55.4, y: 29.4, w: 7.2, h: 11.4 } },
  { id: "M4", name: "Mesa 4", area: "Salon principal", seats: 4, status: "Ocupada", map: { x: 64.2, y: 29.4, w: 14.8, h: 6.7 } },
  { id: "M5", name: "Mesa 5", area: "Salon principal", seats: 2, status: "Reservada", map: { x: 56.1, y: 43.0, w: 7.3, h: 6.6 } },
  { id: "M6", name: "Mesa 6", area: "Salon principal", seats: 2, status: "Ocupada", map: { x: 67.6, y: 36.2, w: 7.0, h: 6.4 } },
  { id: "A1", name: "Mesa A1", area: "Zona A", seats: 4, status: "Libre", map: { x: 74.2, y: 51.2, w: 7.7, h: 7.7 } },
  { id: "A2", name: "Mesa A2", area: "Zona A", seats: 4, status: "Ocupada", map: { x: 45.8, y: 51.7, w: 8.6, h: 7.8 } },
  { id: "A3", name: "Mesa A3", area: "Zona A", seats: 4, status: "Libre", map: { x: 20.6, y: 36.4, w: 6.8, h: 9.7 } },
  { id: "A4", name: "Mesa A4", area: "Zona A", seats: 4, status: "Libre", map: { x: 20.8, y: 20.4, w: 6.7, h: 9.7 } },
  { id: "D1", name: "Delivery 1", area: "Delivery", seats: 0, status: "Ocupada" }
];

export const kitchenOrders = [
  {
    id: "ORD-1042",
    tableId: "M3",
    table: "Mesa 3",
    channel: "Local",
    status: "Preparando",
    createdAt: "2026-08-11T07:31:00-05:00",
    elapsed: 7,
    items: [
      { id: "caf-cappuccino", lineId: "L-1042-1", name: "Cappuccino", qty: 2, station: "Barra", operationType: "preparation", requiresPreparation: true, status: "Preparando", modifiers: ["Leche de avena", "Sin azucar"], note: "Un cappuccino extra caliente" },
      { id: "pos-brownie", lineId: "L-1042-2", name: "Brownie con fudge y helado", qty: 1, station: "Cocina", operationType: "preparation", requiresPreparation: true, status: "Preparando", modifiers: [], note: "" }
    ],
    notes: "Un cappuccino extra caliente"
  },
  {
    id: "ORD-1043",
    tableId: "A2",
    table: "Mesa A2",
    channel: "Local",
    status: "Preparando",
    createdAt: "2026-08-11T07:35:00-05:00",
    elapsed: 8,
    items: [
      { id: "caf-cappuccino", lineId: "L-1043-1", name: "Cappuccino", qty: 1, station: "Barra", operationType: "preparation", requiresPreparation: true, status: "Listo", modifiers: [], note: "" },
      { id: "san-acevichado", lineId: "L-1043-2", name: "Acevichado", qty: 1, station: "Cocina", operationType: "preparation", requiresPreparation: true, status: "Preparando", modifiers: [], note: "" }
    ],
    notes: ""
  },
  {
    id: "ORD-1044",
    tableId: "M6",
    table: "Mesa 6",
    channel: "Local",
    status: "Listo",
    createdAt: "2026-08-11T07:25:00-05:00",
    elapsed: 13,
    items: [
      { id: "tea-muna", lineId: "L-1044-1", name: "Infusion de Muña", qty: 1, station: "Barra", operationType: "preparation", requiresPreparation: true, status: "Listo", modifiers: [], note: "" },
      { id: "des-regional", lineId: "L-1044-2", name: "Regional", qty: 1, station: "Cocina", operationType: "preparation", requiresPreparation: true, status: "Listo", modifiers: [], note: "" }
    ],
    notes: ""
  }
];

export const dispatchOrdersSeed = [
  {
    id: "DSP-1043-1",
    orderId: "ORD-1043",
    tableId: "A2",
    table: "Mesa A2",
    channel: "Local",
    status: "Pendiente de entrega",
    createdAt: "2026-08-11T07:36:00-05:00",
    items: [
      {
        id: "beb-gaseosa",
        lineId: "L-1043-3",
        name: "Gaseosa",
        qty: 1,
        station: "Barra",
        operationType: "direct_dispatch",
        requiresPreparation: false,
        status: "Pendiente de entrega",
        modifiers: [],
        note: ""
      }
    ]
  }
];

/* ==================== INVENTARIO ==================== */

export const inventory = [
  { id: "INS-01", item: "Cafe tostado de especialidad", category: "Cafe", stock: 7, min: 12, unit: "kg", expiry: "2026-10-30", location: "Almacen seco", cost: 42, lot: "AMZ-2608-01", rotation: "FIFO" },
  { id: "INS-02", item: "Leche fresca", category: "Lacteos", stock: 18, min: 10, unit: "L", expiry: "2026-08-14", location: "Frio 1", cost: 5, lot: "LEC-1108", rotation: "FEFO" },
  { id: "INS-03", item: "Leche de avena", category: "Bebidas vegetales", stock: 6, min: 8, unit: "L", expiry: "2026-09-22", location: "Frio 1", cost: 10, lot: "AVE-0808", rotation: "FEFO" },
  { id: "INS-04", item: "Leche de almendras", category: "Bebidas vegetales", stock: 5, min: 8, unit: "L", expiry: "2026-09-18", location: "Frio 1", cost: 11, lot: "ALM-0808", rotation: "FEFO" },
  { id: "INS-05", item: "Pan artesanal", category: "Panaderia", stock: 24, min: 20, unit: "un", expiry: "2026-08-12", location: "Cocina", cost: 2, lot: "PAN-1108", rotation: "FEFO" },
  { id: "INS-06", item: "Palta", category: "Frutas y verduras", stock: 8, min: 12, unit: "kg", expiry: "2026-08-13", location: "Frio 2", cost: 9, lot: "PAL-1008", rotation: "FEFO" },
  { id: "INS-07", item: "Quinoa", category: "Granos", stock: 14, min: 8, unit: "kg", expiry: "2027-01-15", location: "Almacen seco", cost: 13, lot: "QUI-0726", rotation: "FIFO" },
  { id: "INS-08", item: "Chocolate regional", category: "Chocolate", stock: 9, min: 6, unit: "kg", expiry: "2027-02-10", location: "Almacen seco", cost: 28, lot: "CHO-0626", rotation: "FIFO" },
  { id: "INS-09", item: "Naranja", category: "Frutas y verduras", stock: 12, min: 15, unit: "kg", expiry: "2026-08-13", location: "Frio 2", cost: 4.5, lot: "NAR-1008", rotation: "FEFO" },
  { id: "INS-10", item: "Envases box lunch", category: "Empaque", stock: 16, min: 25, unit: "un", expiry: "2027-12-31", location: "Empaque", cost: 1.4, lot: "EMP-0726", rotation: "FIFO" },
  { id: "INS-11", item: "Agua mineral", category: "Bebidas listas", stock: 36, min: 12, unit: "un", expiry: "2027-06-30", location: "Barra", cost: 1.2, lot: "AGU-0826", rotation: "FEFO" },
  { id: "INS-12", item: "Gaseosa", category: "Bebidas listas", stock: 42, min: 18, unit: "un", expiry: "2027-03-31", location: "Barra", cost: 1.3, lot: "GAS-0826", rotation: "FEFO" },
  { id: "INS-13", item: "Cerveza Cusqueña", category: "Bebidas listas", stock: 24, min: 12, unit: "un", expiry: "2027-01-31", location: "Barra", cost: 5.2, lot: "CUS-0826", rotation: "FEFO" },
  { id: "INS-14", item: "Cerveza Pilsen", category: "Bebidas listas", stock: 20, min: 10, unit: "un", expiry: "2027-01-31", location: "Barra", cost: 4.8, lot: "PIL-0826", rotation: "FEFO" },
  { id: "INS-15", item: "Cerveza artesanal", category: "Bebidas listas", stock: 18, min: 8, unit: "un", expiry: "2026-12-15", location: "Barra", cost: 7.4, lot: "ART-0826", rotation: "FEFO" },
  { id: "INS-16", item: "Vino para servicio por copa", category: "Bebidas listas", stock: 18, min: 8, unit: "copa", expiry: "2027-02-28", location: "Barra", cost: 7.5, lot: "VIN-COPA-0826", rotation: "FEFO" },
  { id: "INS-17", item: "Botella de vino", category: "Bebidas listas", stock: 10, min: 4, unit: "un", expiry: "2028-08-31", location: "Barra", cost: 34, lot: "VIN-BOT-0826", rotation: "FIFO" }
]

export const wasteRecordsSeed = [
  { id: "MER-001", type: "Insumo", itemId: "INS-02", item: "Leche fresca", qty: 1.5, unit: "L", reason: "Vencimiento", station: "Barra", cost: 7.5, status: "Registrada", user: "Lucia Torres", at: "2026-08-10T18:15:00-05:00" },
  { id: "MER-002", type: "Preparacion", itemId: "caf-espresso", item: "Extraccion de espresso", qty: 2, unit: "porciones", reason: "Calibracion de molienda", station: "Barra", cost: 2.4, status: "Registrada", user: "Lucia Torres", at: "2026-08-11T06:58:00-05:00" },
  { id: "MER-003", type: "Producto terminado", itemId: "caf-latte", item: "Cafe Latte", qty: 1, unit: "un", reason: "Preparacion incorrecta", station: "Barra", cost: 4.1, status: "Registrada", user: "Lucia Torres", at: "2026-08-11T07:26:00-05:00", orderId: "ORD-1039" }
];

export const wasteReasonsSeed = [
  { id: "WRS-01", label: "Vencimiento", appliesTo: ["Insumo", "Producto terminado"] },
  { id: "WRS-02", label: "Deterioro", appliesTo: ["Insumo", "Producto terminado"] },
  { id: "WRS-03", label: "Error de preparacion", appliesTo: ["Preparacion", "Producto terminado"] },
  { id: "WRS-04", label: "Cambio solicitado por cliente", appliesTo: ["Preparacion", "Producto terminado"] },
  { id: "WRS-05", label: "Derrame o caida", appliesTo: ["Insumo", "Preparacion", "Producto terminado"] },
  { id: "WRS-06", label: "Sobreproduccion", appliesTo: ["Preparacion", "Producto terminado"] },
  { id: "WRS-07", label: "Devolucion del cliente", appliesTo: ["Producto terminado"] },
  { id: "WRS-08", label: "Control de calidad", appliesTo: ["Preparacion", "Producto terminado"] },
  { id: "WRS-09", label: "Otro", appliesTo: ["Insumo", "Preparacion", "Producto terminado"] }
];

/* ==================== CLIENTES / FIDELIZACION ==================== */

export const customers = [
  { id: "CLI-01", name: "Ana Vargas", segment: "Local", level: "Oro", points: 830, visits: 18, last: "2026-08-10", satisfaction: 94, phone: "987654321", email: "ana.vargas@email.com", birthdate: "1991-09-18", lifetimeSpend: 1460, avgTicket: 34.2, preferences: ["Leche de avena", "Cafe sin azucar"], tags: ["Cliente frecuente"] },
  { id: "CLI-02", name: "Martin Blake", segment: "Turista", level: "Plata", points: 420, visits: 4, last: "2026-08-09", satisfaction: 88, phone: "+1 305 555 0184", email: "martin.blake@email.com", birthdate: "1986-02-04", lifetimeSpend: 388, avgTicket: 48.5, preferences: ["Carta en ingles"], tags: ["Turista"] },
  { id: "CLI-03", name: "Lucia Torres", segment: "Local", level: "Bronce", points: 190, visits: 3, last: "2026-08-07", satisfaction: 91, phone: "912345678", email: "lucia.torres@email.com", birthdate: "1997-11-22", lifetimeSpend: 126, avgTicket: 42, preferences: ["Vegetariano"], tags: [] },
  { id: "CLI-04", name: "Sofia Rojas", segment: "Local", level: "Oro", points: 990, visits: 22, last: "2026-08-11", satisfaction: 96, phone: "986111222", email: "sofia.rojas@email.com", birthdate: "1989-08-27", lifetimeSpend: 1895, avgTicket: 37.9, preferences: ["Cold Brew", "Postres"], tags: ["Cliente frecuente", "Cumpleanos agosto"] }
];

export const loyaltyConfigSeed = {
  pointsPerSol: 1,
  levels: [
    { id: "bronze", name: "Bronce", minPoints: 0, color: "#A66A3F" },
    { id: "silver", name: "Plata", minPoints: 300, color: "#8D949C" },
    { id: "gold", name: "Oro", minPoints: 700, color: "#C79A2B" }
  ]
};

export const rewardsSeed = [
  { id: "REC-01", name: "Cafe Americano de cortesia", points: 300, level: "Bronce", status: "Activo" },
  { id: "REC-02", name: "Postre de cortesia", points: 450, level: "Plata", status: "Activo" },
  { id: "REC-03", name: "10% de descuento en consumo", points: 600, level: "Oro", status: "Activo" }
];

export const reservations = [
  { id: "RES-01", customerId: "CLI-01", name: "Ana", lastname: "Vargas", email: "ana.vargas@email.com", phone: "987654321", people: 4, motive: "Cena", date: "2026-08-11", time: "19:30", tableId: "A3", status: "Confirmada" },
  { id: "RES-02", customerId: "CLI-02", name: "Martin", lastname: "Blake", email: "martin.blake@email.com", phone: "+1 305 555 0184", people: 2, motive: "Visita turistica", date: "2026-08-12", time: "10:00", tableId: "M2", status: "Pendiente" }
];

export const loyaltyMovementsSeed = [
  { id: "PTS-01", customerId: "CLI-01", type: "earn", points: 42, detail: "Compra #V-1041", at: "2026-08-10T18:42:00-05:00" },
  { id: "PTS-02", customerId: "CLI-01", type: "redeem", points: -300, detail: "Cafe Americano de cortesia", at: "2026-08-03T10:18:00-05:00" },
  { id: "PTS-03", customerId: "CLI-04", type: "earn", points: 58, detail: "Compra #V-1040", at: "2026-08-11T07:12:00-05:00" }
];

/* ==================== USUARIOS / ROLES ==================== */

export const users = [
  { id: "USR-01", name: "Graciela Silva", email: "gerencia@cafefusiones.com", role: "Administrador", station: "-", status: "Activo", lastAccess: "Hoy 07:20", phone: "990285862" },
  { id: "USR-02", name: "Carlos Mendoza", email: "carlos@cafefusiones.com", role: "Mozo", station: "Salon", status: "Activo", lastAccess: "Hoy 07:31", phone: "987101010" },
  { id: "USR-03", name: "Lucia Torres", email: "lucia@cafefusiones.com", role: "Barista", station: "Barra", status: "Activo", lastAccess: "Hoy 07:35", phone: "987202020" },
  { id: "USR-04", name: "Diego Quino", email: "diego@cafefusiones.com", role: "Cocina", station: "Cocina", status: "Activo", lastAccess: "Hoy 07:28", phone: "987303030" },
  { id: "USR-05", name: "Caja principal", email: "caja@cafefusiones.com", role: "Cajero", station: "Caja", status: "Activo", lastAccess: "Hoy 07:15", phone: "987404040" }
];

export const stationsSeed = [
  { id: "EST-01", name: "Barra", type: "Barista", targetMinutes: 7, status: "Activa" },
  { id: "EST-02", name: "Cocina", type: "Cocina", targetMinutes: 15, status: "Activa" },
  { id: "EST-03", name: "Despacho", type: "Despacho", targetMinutes: 3, status: "Activa" }
];

/* ==================== PEDIDOS INICIALES POR MESA ==================== */

export const tableItemsSeed = {
  M3: [
    { id: "caf-cappuccino", lineId: "L-1042-1", orderId: "ORD-1042", name: "Cappuccino", price: 8, qty: 2, modifiers: ["Leche de avena", "Sin azucar"], note: "Un cappuccino extra caliente", station: "Barra", operationType: "preparation", requiresPreparation: true, productionStatus: "Preparando", status: "Preparando" },
    { id: "pos-brownie", lineId: "L-1042-2", orderId: "ORD-1042", name: "Brownie con fudge y helado", price: 8, qty: 1, modifiers: [], note: "", station: "Cocina", operationType: "preparation", requiresPreparation: true, productionStatus: "Preparando", status: "Preparando" }
  ],
  M4: [
    { id: "des-sinchi", lineId: "L-1045-1", orderId: "ORD-1045", name: "Sinchi", price: 18, qty: 2, modifiers: [], note: "", station: "Cocina", operationType: "preparation", requiresPreparation: true, productionStatus: "Nuevo", status: "Nuevo" },
    { id: "caf-americano", lineId: "L-1045-2", orderId: "ORD-1045", name: "Cafe Americano", price: 6, qty: 2, modifiers: [], note: "", station: "Barra", operationType: "preparation", requiresPreparation: true, productionStatus: "Nuevo", status: "Nuevo" }
  ],
  M6: [
    { id: "tea-muna", lineId: "L-1044-1", orderId: "ORD-1044", name: "Infusion de Muña", price: 4, qty: 1, modifiers: [], note: "", station: "Barra", operationType: "preparation", requiresPreparation: true, productionStatus: "Listo", status: "Listo" },
    { id: "des-regional", lineId: "L-1044-2", orderId: "ORD-1044", name: "Regional", price: 18, qty: 1, modifiers: [], note: "", station: "Cocina", operationType: "preparation", requiresPreparation: true, productionStatus: "Listo", status: "Listo" }
  ],
  A2: [
    { id: "caf-cappuccino", lineId: "L-1043-1", orderId: "ORD-1043", name: "Cappuccino", price: 8, qty: 1, modifiers: [], note: "", station: "Barra", operationType: "preparation", requiresPreparation: true, productionStatus: "Listo", status: "Listo" },
    { id: "san-acevichado", lineId: "L-1043-2", orderId: "ORD-1043", name: "Acevichado", price: 13, qty: 1, modifiers: [], note: "", station: "Cocina", operationType: "preparation", requiresPreparation: true, productionStatus: "Preparando", status: "Preparando" },
    { id: "beb-gaseosa", lineId: "L-1043-3", orderId: "ORD-1043", dispatchId: "DSP-1043-1", name: "Gaseosa", price: 2.5, qty: 1, modifiers: [], note: "", station: "Barra", operationType: "direct_dispatch", requiresPreparation: false, dispatchStatus: "Pendiente de entrega", status: "Pendiente de entrega" }
  ],
  D1: [
    { id: "box-lunch", lineId: "L-1046-1", orderId: "ORD-1046", name: "Box lunch", price: 30, qty: 1, modifiers: [], note: "Empaque para tour", station: "Cocina", operationType: "preparation", requiresPreparation: true, productionStatus: "Preparando", status: "Preparando" },
    { id: "caf-americano", lineId: "L-1046-2", orderId: "ORD-1046", name: "Cafe Americano", price: 6, qty: 2, modifiers: [], note: "", station: "Barra", operationType: "preparation", requiresPreparation: true, productionStatus: "Preparando", status: "Preparando" }
  ]
};

/* ==================== TRAZABILIDAD / CAFE ==================== */

export const coffeeLotsSeed = [
  {
    id: "LOT-CAF-001",
    code: "AMZ-2608-01",
    origin: "Valle del Huayabamba, Amazonas",
    producer: "Productor local asociado",
    altitude: "1200-1800 msnm",
    variety: "Caturra",
    roast: "Media",
    received: "2026-08-02",
    roastedAt: "2026-08-05",
    stock: 7,
    unit: "kg",
    notes: "Lote demostrativo para trazabilidad del café."
  }
];

/* ==================== MARKETING ==================== */

export const campaignsSeed = [
  { id: "CMP-01", name: "Happy Hour Fusiones", channel: "Instagram / Facebook", audience: "Locales", status: "Activa", spend: 240, leads: 86, conversions: 31, revenue: 930 },
  { id: "CMP-02", name: "Brunch de fin de semana", channel: "Instagram", audience: "Locales y turistas", status: "Activa", spend: 180, leads: 64, conversions: 24, revenue: 720 },
  { id: "CMP-03", name: "Cafe de especialidad Chachapoyas", channel: "Google", audience: "Turistas", status: "Activa", spend: 320, leads: 112, conversions: 37, revenue: 1290 },
  { id: "CMP-04", name: "Cumpleanos clientes frecuentes", channel: "WhatsApp / Email", audience: "Plata y Oro", status: "Automatica", spend: 0, leads: 19, conversions: 11, revenue: 396 }
];

/* ==================== AUDITORIA ==================== */

export const auditEvents = [
  { time: "06:55", user: "Caja principal", action: "Apertura de caja", module: "Caja" },
  { time: "07:02", user: "Lucia Torres", action: "Registro de merma por calibracion", module: "Inventario" },
  { time: "07:25", user: "Diego Quino", action: "Pedido ORD-1044 listo", module: "Produccion" },
  { time: "07:31", user: "Carlos Mendoza", action: "Pedido registrado en Mesa 3", module: "Ventas" },
  { time: "07:35", user: "Lucia Torres", action: "Inicio de preparacion ORD-1042", module: "Produccion" }
];

/* ==================== REPORTES DEMO ==================== */

export const reportSalesRows = [
  { date: "2026-08-11", channel: "Local", staff: "Carlos Mendoza", product: "Cappuccino", category: "Cafe", qty: 28, income: 224, cost: 86 },
  { date: "2026-08-11", channel: "Local", staff: "Carlos Mendoza", product: "Cafe Latte", category: "Cafe", qty: 24, income: 192, cost: 74 },
  { date: "2026-08-11", channel: "Local", staff: "Carlos Mendoza", product: "Sinchi", category: "Desayunos", qty: 15, income: 270, cost: 122 },
  { date: "2026-08-11", channel: "Delivery", staff: "Caja principal", product: "Box lunch", category: "Fusiones", qty: 9, income: 270, cost: 112 },
  { date: "2026-08-10", channel: "Local", staff: "Carlos Mendoza", product: "Cold Brew", category: "Cafe", qty: 17, income: 255, cost: 88 },
  { date: "2026-08-10", channel: "Reservas", staff: "Carlos Mendoza", product: "Regional", category: "Desayunos", qty: 12, income: 216, cost: 96 },
  { date: "2026-08-09", channel: "Local", staff: "Carlos Mendoza", product: "Acevichado", category: "Sandwiches", qty: 18, income: 234, cost: 108 },
  { date: "2026-08-09", channel: "Local", staff: "Carlos Mendoza", product: "Brownie con fudge y helado", category: "Postres", qty: 20, income: 160, cost: 62 },
  { date: "2026-08-08", channel: "Local", staff: "Lucia Torres", product: "Chocolate caliente", category: "Chocolate", qty: 11, income: 110, cost: 42 },
  { date: "2026-08-08", channel: "Delivery", staff: "Caja principal", product: "Cafe Americano", category: "Cafe", qty: 14, income: 84, cost: 32 }
];

export const reportExpenseRows = [
  { date: "2026-08-11", type: "Insumos", detail: "Reposicion de leche fresca", amount: 120 },
  { date: "2026-08-11", type: "Insumos", detail: "Cafe de especialidad Amazonas", amount: 294 },
  { date: "2026-08-10", type: "Logistica", detail: "Envases para box lunch", amount: 96 },
  { date: "2026-08-09", type: "Operativo", detail: "Mantenimiento de maquina espresso", amount: 260 },
  { date: "2026-08-08", type: "Marketing", detail: "Campanas digitales", amount: 180 },
  { date: "2026-08-08", type: "Insumos", detail: "Leche de avena y palta", amount: 88 }
];

export const reportOperationsSeed = {
  avgPreparationMinutes: 8.7,
  onTimeRate: 87,
  delayedOrders: 6,
  wasteCost: 184.5,
  byStation: [
    { station: "Barra", avgMinutes: 5.4, orders: 82 },
    { station: "Cocina", avgMinutes: 13.2, orders: 47 }
  ]
};

export const marketingMetricsSeed = {
  reach: 28400,
  leads: 281,
  conversions: 103,
  roi: 2.8,
  channels: [
    { name: "Instagram", visits: 1860, conversions: 38 },
    { name: "Facebook", visits: 1120, conversions: 21 },
    { name: "Google", visits: 2080, conversions: 37 },
    { name: "TikTok", visits: 940, conversions: 7 },
    { name: "Organico", visits: 1460, conversions: 19 }
  ]
};
