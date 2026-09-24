// Cafe Fusiones - Recetario estandar con costos por racion.
// Fuente: "recetario con costos cafe fusiones.docx" y "Recetario Cafe Fusiones 2026.pdf".
// Generado a partir de los documentos entregados por el cliente (carpeta _insumos).
// `referenceCost` es el costo directo de insumos por racion que declara el recetario;
// no incluye mano de obra, merma, empaque, IGV ni margen.

export const recipesSeed = [
  { id: "RCP-001", name: "Espresso", section: "CAFÉS", productIds: ["cafe-espresso"], productId: "cafe-espresso", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.35, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0011", item: "Agua purificada", qty: 30.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-002", name: "Café Americano", section: "CAFÉS", productIds: ["cafe-cafe-americano"], productId: "cafe-cafe-americano", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.44, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0006", item: "Agua caliente", qty: 180.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-003", name: "Café Canelado", section: "CAFÉS", productIds: ["cafe-cafe-canelado"], productId: "cafe-cafe-canelado", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.5, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0006", item: "Agua caliente", qty: 180.0, unit: "ml", unitCost: 0.001 },
    { inventoryId: "INS-0043", item: "Canela en polvo", qty: 1.0, unit: "g", unitCost: 0.06 }
  ], variants: [] },
  { id: "RCP-004", name: "Café Macchiato", section: "CAFÉS", productIds: ["cafe-cafe-macchiato"], productId: "cafe-cafe-macchiato", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.62, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0067", item: "Espuma de leche", qty: 30.0, unit: "ml", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-005", name: "Cappuccino", section: "CAFÉS", productIds: ["cafe-cappuccino"], productId: "cafe-cappuccino", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.28, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0114", item: "Leche entera", qty: 120.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0067", item: "Espuma de leche", qty: 30.0, unit: "ml", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-006", name: "Café Latte", section: "CAFÉS", productIds: ["cafe-cafe-latte"], productId: "cafe-cafe-latte", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.66, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0112", item: "Leche cremosa", qty: 200.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-007", name: "Mocha Hot Chocolate", section: "CAFÉS", productIds: ["cafe-mocha-hot-chocolate"], productId: "cafe-mocha-hot-chocolate", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.42, ingredients: [
    { inventoryId: "INS-0058", item: "Chocolate en polvo/barra", qty: 20.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0112", item: "Leche cremosa", qty: 180.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-008", name: "Café Irlandés", section: "CAFÉS", productIds: ["cafe-cafe-irlandes"], productId: "cafe-cafe-irlandes", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.1, ingredients: [
    { inventoryId: "INS-0038", item: "Café filtrado", qty: 150.0, unit: "ml", unitCost: 0.0084 },
    { inventoryId: "INS-0208", item: "Whisky", qty: 45.0, unit: "ml", unitCost: 0.12 },
    { inventoryId: "INS-0112", item: "Leche cremosa", qty: 50.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-009", name: "Frapuccino de café", section: "CAFÉS", productIds: ["cafe-frapuccino-de-cafe"], productId: "cafe-frapuccino-de-cafe", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.88, ingredients: [
    { inventoryId: "INS-0037", item: "Café espresso doble", qty: 24.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 150.0, unit: "g", unitCost: 0.003 },
    { inventoryId: "INS-0062", item: "Crema batida", qty: 30.0, unit: "g", unitCost: 0.025 }
  ], variants: [] },
  { id: "RCP-010", name: "Frapuccino Vital", section: "CAFÉS", productIds: ["cafe-frapuccino-vital"], productId: "cafe-frapuccino-vital", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.35, ingredients: [
    { inventoryId: "INS-0037", item: "Café espresso doble", qty: 16.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 120.0, unit: "g", unitCost: 0.003 },
    { inventoryId: "INS-0073", item: "Frutos secos surtidos", qty: 15.0, unit: "g", unitCost: 0.06 },
    { inventoryId: "INS-0121", item: "Maní", qty: 5.0, unit: "g", unitCost: 0.024 },
    { inventoryId: "INS-0154", item: "Pecanas", qty: 5.0, unit: "g", unitCost: 0.1 },
    { inventoryId: "INS-0018", item: "Almendras", qty: 5.0, unit: "g", unitCost: 0.07 }
  ], variants: [] },
  { id: "RCP-011", name: "Canadian Coffee", section: "CAFÉS", productIds: ["cafe-canadian-coffee"], productId: "cafe-canadian-coffee", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.62, ingredients: [
    { inventoryId: "INS-0034", item: "Café en grano", qty: 18.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0111", item: "Leche condensada", qty: 30.0, unit: "ml", unitCost: 0.012 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 100.0, unit: "g", unitCost: 0.003 },
    { inventoryId: "INS-0112", item: "Leche cremosa", qty: 100.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-012", name: "Orange Coffee", section: "CAFÉS", productIds: ["cafe-orange-coffee"], productId: "cafe-orange-coffee", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.38, ingredients: [
    { inventoryId: "INS-0103", item: "Jugo de naranja fresco", qty: 120.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0036", item: "Café espresso", qty: 16.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 100.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-013", name: "Capuccino Fusiones", section: "CAFÉS", productIds: ["cafe-capuccino-fusiones"], productId: "cafe-capuccino-fusiones", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.8, ingredients: [
    { inventoryId: "INS-0036", item: "Café espresso", qty: 16.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0056", item: "Chocolate", qty: 15.0, unit: "g", unitCost: 0.044667 },
    { inventoryId: "INS-0169", item: "Pisco", qty: 30.0, unit: "ml", unitCost: 0.055 },
    { inventoryId: "INS-0084", item: "Helado de vainilla", qty: 50.0, unit: "g", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-014", name: "Cold Brew", section: "CAFÉS", productIds: ["cafe-cold-brew"], productId: "cafe-cold-brew", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.29, ingredients: [
    { inventoryId: "INS-0039", item: "Café molido (Toddy)", qty: 25.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0009", item: "Agua (infusión en frío)", qty: 200.0, unit: "ml", unitCost: 0.003 },
    { inventoryId: "INS-0077", item: "Ginger ale", qty: 100.0, unit: "ml", unitCost: 0.007 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-015", name: "Chocolate caliente / cremoso / dulce", section: "CHOCOLATES", productIds: ["chocol-chocolate-caliente"], productId: "chocol-chocolate-caliente", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.44, ingredients: [
    { inventoryId: "INS-0057", item: "Chocolate bitter/barra", qty: 30.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0114", item: "Leche entera", qty: 200.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0022", item: "Azúcar", qty: 10.0, unit: "g", unitCost: 0.004 }
  ], variants: [] },
  { id: "RCP-016", name: "Chocolate con ron", section: "CHOCOLATES", productIds: ["chocol-chocolate-con-ron"], productId: "chocol-chocolate-con-ron", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.31, ingredients: [
    { inventoryId: "INS-0057", item: "Chocolate bitter/barra", qty: 30.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0114", item: "Leche entera", qty: 180.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0183", item: "Ron", qty: 45.0, unit: "ml", unitCost: 0.044889 }
  ], variants: [] },
  { id: "RCP-017", name: "V60 / Prensa Francesa / AeroPress / Prensa Italiana / Chemex / Sifón Japonés", section: "MÉTODOS", productIds: ["cafe-e-v60", "cafe-e-prensa-francesa", "cafe-e-aeropress", "cafe-e-prensa-italiana", "cafe-e-chemex", "cafe-e-sifon-japones"], productId: "cafe-e-v60", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.61, ingredients: [
    { inventoryId: "INS-0035", item: "Café en grano de especialidad", qty: 18.0, unit: "g", unitCost: 0.095 },
    { inventoryId: "INS-0011", item: "Agua purificada", qty: 300.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-018", name: "Leche de Coco / Almendras / Soya / Avena", section: "BEBIDAS VEGETALES", productIds: ["bebida-leche-de-coco", "bebida-leche-de-avena", "bebida-leche-de-almendras", "bebida-leche-de-soya"], productId: "bebida-leche-de-coco", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.0, ingredients: [
    { inventoryId: "INS-0068", item: "Extracto / Bebida vegetal", qty: 250.0, unit: "ml", unitCost: 0.008 }
  ], variants: [] },
  { id: "RCP-019", name: "Energético", section: "DESAYUNOS", productIds: ["desayu-energetico"], productId: "desayu-energetico", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 9.6, ingredients: [
    { inventoryId: "INS-0026", item: "Bebida caliente de quinua con manzana", qty: 250.0, unit: "ml", unitCost: 0.012 },
    { inventoryId: "INS-0140", item: "Pan artesanal", qty: 2.0, unit: "un", unitCost: 0.6 },
    { inventoryId: "INS-0178", item: "Queso fresco", qty: 40.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0139", item: "Palta", qty: 50.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0104", item: "Jugo del día", qty: 200.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0033", item: "Café americano", qty: 180.0, unit: "ml", unitCost: 0.01 }
  ], variants: [] },
  { id: "RCP-020", name: "Sinchi", section: "DESAYUNOS", productIds: ["desayu-sinchi"], productId: "desayu-sinchi", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 10.55, ingredients: [
    { inventoryId: "INS-0143", item: "Pan tostado", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0104", item: "Jugo del día", qty: 200.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0033", item: "Café americano", qty: 180.0, unit: "ml", unitCost: 0.01 },
    { inventoryId: "INS-0138", item: "Omelet (Huevos)", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0191", item: "Salsa de verduras especial", qty: 40.0, unit: "g", unitCost: 0.02 },
    { inventoryId: "INS-0176", item: "Queso", qty: 30.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0196", item: "Tamal tradicional (Maíz/Mote)", qty: 120.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0050", item: "Carne molida", qty: 30.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0122", item: "Maní tostado", qty: 10.0, unit: "g", unitCost: 0.025 }
  ], variants: [] },
  { id: "RCP-021", name: "Tamal de Quinoa", section: "DESAYUNOS", productIds: ["desayu-tamal-de-quinoa"], productId: "desayu-tamal-de-quinoa", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.22, ingredients: [
    { inventoryId: "INS-0181", item: "Quinoa", qty: 60.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0119", item: "Maíz", qty: 50.0, unit: "g", unitCost: 0.004 },
    { inventoryId: "INS-0050", item: "Carne molida", qty: 30.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0122", item: "Maní tostado", qty: 10.0, unit: "g", unitCost: 0.025 }
  ], variants: [] },
  { id: "RCP-022", name: "Tamal de Quinoa vegano", section: "DESAYUNOS", productIds: ["desayu-tamal-de-quinoa-vegano"], productId: "desayu-tamal-de-quinoa-vegano", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.89, ingredients: [
    { inventoryId: "INS-0181", item: "Quinoa", qty: 60.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0119", item: "Maíz", qty: 50.0, unit: "g", unitCost: 0.004 },
    { inventoryId: "INS-0054", item: "Champiñones", qty: 40.0, unit: "g", unitCost: 0.018 },
    { inventoryId: "INS-0122", item: "Maní tostado", qty: 10.0, unit: "g", unitCost: 0.025 }
  ], variants: [] },
  { id: "RCP-023", name: "Americano", section: "DESAYUNOS", productIds: ["desayu-americano"], productId: "desayu-americano", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 6.29, ingredients: [
    { inventoryId: "INS-0104", item: "Jugo del día", qty: 200.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0033", item: "Café americano", qty: 180.0, unit: "ml", unitCost: 0.01 },
    { inventoryId: "INS-0143", item: "Pan tostado", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0090", item: "Huevos (fritos o revueltos)", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0132", item: "Mermelada casera", qty: 20.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0123", item: "Mantequilla", qty: 15.0, unit: "g", unitCost: 0.03 }
  ], variants: [] },
  { id: "RCP-024", name: "Regional", section: "DESAYUNOS", productIds: ["desayu-regional"], productId: "desayu-regional", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 12.2, ingredients: [
    { inventoryId: "INS-0104", item: "Jugo del día", qty: 200.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0033", item: "Café americano", qty: 180.0, unit: "ml", unitCost: 0.01 },
    { inventoryId: "INS-0143", item: "Pan tostado", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0091", item: "Huevos revueltos", qty: 2.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0059", item: "Chorizo regional", qty: 50.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0209", item: "Yuquitas fritas", qty: 80.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0099", item: "Juane (Yuca molida, arroz, pollo, maní)", qty: 250.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0122", item: "Maní tostado", qty: 15.0, unit: "g", unitCost: 0.025333 }
  ], variants: [] },
  { id: "RCP-025", name: "Pollo y apio", section: "SANDWICHES", productIds: ["sandwi-pollo-y-apio"], productId: "sandwi-pollo-y-apio", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.27, ingredients: [
    { inventoryId: "INS-0156", item: "Pechuga de pollo deshilachada", qty: 100.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0116", item: "Lechuga", qty: 20.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0128", item: "Mayonesa", qty: 30.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0019", item: "Apio picado", qty: 15.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0142", item: "Pan de molde / artesanal", qty: 2.0, unit: "un", unitCost: 0.45 }
  ], variants: [] },
  { id: "RCP-026", name: "Asado especial", section: "SANDWICHES", productIds: ["sandwi-asado-especial"], productId: "sandwi-asado-especial", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.8, ingredients: [
    { inventoryId: "INS-0046", item: "Carne de asado", qty: 120.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0116", item: "Lechuga", qty: 20.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0177", item: "Queso derretido", qty: 30.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0139", item: "Palta", qty: 40.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0140", item: "Pan artesanal", qty: 1.0, unit: "un", unitCost: 0.6 }
  ], variants: [] },
  { id: "RCP-027", name: "Acevichado", section: "SANDWICHES", productIds: ["sandwi-acevichado"], productId: "sandwi-acevichado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.63, ingredients: [
    { inventoryId: "INS-0155", item: "Pechuga de pollo", qty: 100.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0139", item: "Palta", qty: 40.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0116", item: "Lechuga", qty: 20.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0185", item: "Salsa acevichada", qty: 35.0, unit: "g", unitCost: 0.018 },
    { inventoryId: "INS-0140", item: "Pan artesanal", qty: 1.0, unit: "un", unitCost: 0.6 }
  ], variants: [] },
  { id: "RCP-028", name: "Cerdo", section: "SANDWICHES", productIds: ["sandwi-cerdo"], productId: "sandwi-cerdo", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.0, ingredients: [
    { inventoryId: "INS-0053", item: "Cerdo tierno horneado", qty: 130.0, unit: "g", unitCost: 0.032 },
    { inventoryId: "INS-0140", item: "Pan artesanal", qty: 1.0, unit: "un", unitCost: 0.6 },
    { inventoryId: "INS-0004", item: "Aderezos especiales", qty: 20.0, unit: "g", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-029", name: "Pavo", section: "SANDWICHES", productIds: ["sandwi-pavo"], productId: "sandwi-pavo", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.64, ingredients: [
    { inventoryId: "INS-0153", item: "Pavo jugoso laminado", qty: 120.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0140", item: "Pan artesanal", qty: 1.0, unit: "un", unitCost: 0.6 },
    { inventoryId: "INS-0004", item: "Aderezos especiales", qty: 20.0, unit: "g", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-030", name: "Hamburguesa Fusiones", section: "SANDWICHES", productIds: ["sandwi-hamburguesa-fusiones"], productId: "sandwi-hamburguesa-fusiones", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.1, ingredients: [
    { inventoryId: "INS-0049", item: "Carne de res o pavo", qty: 150.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0141", item: "Pan artesanal de hamburguesa", qty: 1.0, unit: "un", unitCost: 0.8 },
    { inventoryId: "INS-0004", item: "Aderezos especiales", qty: 25.0, unit: "g", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-031", name: "Palteado con Tzatsiki", section: "SANDWICHES", productIds: ["sandwi-palteado-con-tzatsiki"], productId: "sandwi-palteado-con-tzatsiki", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.24, ingredients: [
    { inventoryId: "INS-0092", item: "Hummus", qty: 40.0, unit: "g", unitCost: 0.018 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0139", item: "Palta", qty: 60.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0159", item: "Pepino", qty: 30.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0193", item: "Salsa Tzatsiki", qty: 30.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0148", item: "Papas fritas", qty: 100.0, unit: "g", unitCost: 0.009 }
  ], variants: [] },
  { id: "RCP-032", name: "Veggie grill hummus", section: "SANDWICHES", productIds: ["sandwi-veggie-grill-hummus"], productId: "sandwi-veggie-grill-hummus", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 0.69, ingredients: [
    { inventoryId: "INS-0027", item: "Berenjena morada", qty: 60.0, unit: "g", unitCost: 0.007 },
    { inventoryId: "INS-0015", item: "Ají escabeche", qty: 15.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0051", item: "Cebolla", qty: 30.0, unit: "g", unitCost: 0.005 }
  ], variants: [] },
  { id: "RCP-033", name: "Veggie taipa con pesto rústico", section: "SANDWICHES", productIds: ["sandwi-veggie-taipa-con-pesto-rustico"], productId: "sandwi-veggie-taipa-con-pesto-rustico", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.31, ingredients: [
    { inventoryId: "INS-0200", item: "Tomate", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 40.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0176", item: "Queso", qty: 30.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0128", item: "Mayonesa", qty: 20.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0163", item: "Pesto rústico de albahaca", qty: 25.0, unit: "g", unitCost: 0.0248 },
    { inventoryId: "INS-0148", item: "Papas fritas", qty: 100.0, unit: "g", unitCost: 0.009 }
  ], variants: [] },
  { id: "RCP-034", name: "Zucchini grillado", section: "SANDWICHES", productIds: ["sandwi-zucchini-grillado"], productId: "sandwi-zucchini-grillado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.03, ingredients: [
    { inventoryId: "INS-0213", item: "Zucchini", qty: 80.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0030", item: "Brócoli", qty: 50.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0002", item: "Aceitunas", qty: 20.0, unit: "g", unitCost: 0.02 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 40.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0129", item: "Mayonesa de la casa", qty: 25.0, unit: "g", unitCost: 0.014 }
  ], variants: [] },
  { id: "RCP-035", name: "Hamburguesa de lentejas", section: "SANDWICHES", productIds: ["sandwi-hamburguesa-de-lentejas"], productId: "sandwi-hamburguesa-de-lentejas", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.72, ingredients: [
    { inventoryId: "INS-0079", item: "Hamburguesa de lentejas", qty: 140.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0116", item: "Lechuga", qty: 20.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0159", item: "Pepino", qty: 25.0, unit: "g", unitCost: 0.0048 },
    { inventoryId: "INS-0166", item: "Pimienta", qty: 1.0, unit: "g", unitCost: 0.08 },
    { inventoryId: "INS-0148", item: "Papas fritas", qty: 100.0, unit: "g", unitCost: 0.009 }
  ], variants: [] },
  { id: "RCP-036", name: "Chupe de quinoa macro", section: "SOPAS", productIds: ["sopas-chupe-de-quinoa-macro"], productId: "sopas-chupe-de-quinoa-macro", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.94, ingredients: [
    { inventoryId: "INS-0181", item: "Quinoa", qty: 50.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0145", item: "Papa", qty: 100.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0109", item: "Leche", qty: 80.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0047", item: "Carne de res", qty: 80.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 20.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0041", item: "Caldo/Agua", qty: 300.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-037", name: "Crema de zapallo", section: "SOPAS", productIds: ["sopas-crema-de-zapallo"], productId: "sopas-crema-de-zapallo", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.65, ingredients: [
    { inventoryId: "INS-0212", item: "Zapallo", qty: 180.0, unit: "g", unitCost: 0.004 },
    { inventoryId: "INS-0145", item: "Papa", qty: 80.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0109", item: "Leche", qty: 60.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 15.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0040", item: "Caldo", qty: 250.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-038", name: "Crema de poro", section: "SOPAS", productIds: ["sopas-crema-de-poro"], productId: "sopas-crema-de-poro", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.73, ingredients: [
    { inventoryId: "INS-0174", item: "Poro", qty: 100.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0145", item: "Papa", qty: 100.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0109", item: "Leche", qty: 60.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 15.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0040", item: "Caldo", qty: 250.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-039", name: "Crema de zanahoria y tomillo", section: "SOPAS", productIds: ["sopas-crema-de-zanahoria-y-tomillo"], productId: "sopas-crema-de-zanahoria-y-tomillo", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.83, ingredients: [
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 160.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0201", item: "Tomillo", qty: 1.0, unit: "g", unitCost: 0.1 },
    { inventoryId: "INS-0145", item: "Papa", qty: 80.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0109", item: "Leche", qty: 60.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 15.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0040", item: "Caldo", qty: 250.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-040", name: "Ensalada oriental", section: "ENSALADAS", productIds: ["ensala-ensalada-oriental"], productId: "ensala-ensalada-oriental", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.19, ingredients: [
    { inventoryId: "INS-0116", item: "Lechuga", qty: 100.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0167", item: "Pimiento", qty: 40.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0012", item: "Aguacate/Palta", qty: 60.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0194", item: "Sésamo (Ajonjolí)", qty: 5.0, unit: "g", unitCost: 0.024 },
    { inventoryId: "INS-0173", item: "Pollo a la plancha", qty: 100.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0003", item: "Aderezo asiático", qty: 30.0, unit: "ml", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-041", name: "Ensalada de frutas", section: "ENSALADAS", productIds: ["ensala-ensalada-de-frutas"], productId: "ensala-ensalada-de-frutas", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.5, ingredients: [
    { inventoryId: "INS-0134", item: "Mezcla fresca de frutas de temporada", qty: 250.0, unit: "g", unitCost: 0.01 }
  ], variants: [] },
  { id: "RCP-042", name: "Ensalada favorita", section: "ENSALADAS", productIds: ["ensala-ensalada-favorita"], productId: "ensala-ensalada-favorita", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.26, ingredients: [
    { inventoryId: "INS-0158", item: "Pepinillo", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 60.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0139", item: "Palta", qty: 60.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0021", item: "Arúcula", qty: 30.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0211", item: "Zanahoria rallada", qty: 40.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0187", item: "Salsa de ajo", qty: 25.0, unit: "g", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-043", name: "Ensalada de quinoa", section: "ENSALADAS", productIds: ["ensala-ensalada-de-quinoa"], productId: "ensala-ensalada-de-quinoa", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.36, ingredients: [
    { inventoryId: "INS-0181", item: "Quinoa", qty: 80.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 60.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0159", item: "Pepino", qty: 40.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0167", item: "Pimiento", qty: 30.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0160", item: "Perejil", qty: 5.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0130", item: "Menta", qty: 3.0, unit: "g", unitCost: 0.013333 },
    { inventoryId: "INS-0001", item: "Aceite de oliva", qty: 15.0, unit: "ml", unitCost: 0.03 }
  ], variants: [] },
  { id: "RCP-044", name: "Carbonara con cecina de cerdo regional", section: "PASTAS", productIds: ["pastas-carbonara-con-cecina-de-cerdo-re"], productId: "pastas-carbonara-con-cecina-de-cerdo-re", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 6.58, ingredients: [
    { inventoryId: "INS-0150", item: "Pasta", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0063", item: "Crema de leche", qty: 60.0, unit: "ml", unitCost: 0.018 },
    { inventoryId: "INS-0109", item: "Leche", qty: 40.0, unit: "ml", unitCost: 0.0055 },
    { inventoryId: "INS-0052", item: "Cecina de cerdo regional", qty: 70.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 20.0, unit: "g", unitCost: 0.07 }
  ], variants: [] },
  { id: "RCP-045", name: "Pasta con crema Huancaína cubiertos con lomo", section: "PASTAS", productIds: ["pastas-pasta-con-crema-huancaina-cubier"], productId: "pastas-pasta-con-crema-huancaina-cubier", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 11.15, ingredients: [
    { inventoryId: "INS-0150", item: "Pasta", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0118", item: "Lomo fino de carne", qty: 130.0, unit: "g", unitCost: 0.065 },
    { inventoryId: "INS-0184", item: "Salsa a la huancaína", qty: 90.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-046", name: "Espagueti con Sinchi", section: "PASTAS", productIds: ["pastas-espagueti-con-sinchi"], productId: "pastas-espagueti-con-sinchi", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.33, ingredients: [
    { inventoryId: "INS-0065", item: "Espagueti", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0190", item: "Salsa de verduras", qty: 80.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0176", item: "Queso", qty: 30.0, unit: "g", unitCost: 0.035 }
  ], variants: [] },
  { id: "RCP-047", name: "Pasta acevichada", section: "PASTAS", productIds: ["pastas-pasta-acevichada"], productId: "pastas-pasta-acevichada", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.45, ingredients: [
    { inventoryId: "INS-0150", item: "Pasta", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0172", item: "Pollo", qty: 90.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 30.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0030", item: "Brócoli", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0139", item: "Palta", qty: 40.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0185", item: "Salsa acevichada", qty: 50.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-048", name: "Lasaña Sinchi", section: "PASTAS", productIds: ["pastas-lasana-sinchi"], productId: "pastas-lasana-sinchi", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.55, ingredients: [
    { inventoryId: "INS-0108", item: "Láminas de masa de lasaña", qty: 3.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0204", item: "Vainita", qty: 30.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 30.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0179", item: "Queso mozarela", qty: 50.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0178", item: "Queso fresco", qty: 40.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0207", item: "Wantán", qty: 2.0, unit: "un", unitCost: 0.3 },
    { inventoryId: "INS-0192", item: "Salsa Sinchi", qty: 70.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-049", name: "Risotto de pasta con pesto rústico", section: "PASTAS", productIds: ["pastas-risotto-de-pasta-con-pesto-rusti"], productId: "pastas-risotto-de-pasta-con-pesto-rusti", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.27, ingredients: [
    { inventoryId: "INS-0151", item: "Pasta perlada pequeña", qty: 120.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0162", item: "Pesto de albahaca rústica", qty: 45.0, unit: "g", unitCost: 0.024889 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 20.0, unit: "g", unitCost: 0.07 }
  ], variants: [] },
  { id: "RCP-050", name: "Veggie grill", section: "PASTAS", productIds: ["pastas-veggie-grill"], productId: "pastas-veggie-grill", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.8, ingredients: [
    { inventoryId: "INS-0027", item: "Berenjena morada", qty: 60.0, unit: "g", unitCost: 0.007 },
    { inventoryId: "INS-0015", item: "Ají escabeche", qty: 15.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0051", item: "Cebolla", qty: 30.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0016", item: "Albahaca", qty: 5.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0176", item: "Queso", qty: 30.0, unit: "g", unitCost: 0.035 }
  ], variants: [] },
  { id: "RCP-051", name: "Pasta con asado o cerdo al horno", section: "PASTAS", productIds: ["pastas-pasta-con-asado-o-cerdo-al-horno"], productId: "pastas-pasta-con-asado-o-cerdo-al-horno", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.33, ingredients: [
    { inventoryId: "INS-0150", item: "Pasta", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0045", item: "Carne asada o cerdo al horno", qty: 130.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0213", item: "Zucchini", qty: 50.0, unit: "g", unitCost: 0.008 }
  ], variants: [] },
  { id: "RCP-052", name: "Zucchini pasta", section: "PASTAS", productIds: ["pastas-espagueti-con-zucchini"], productId: "pastas-espagueti-con-zucchini", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.97, ingredients: [
    { inventoryId: "INS-0214", item: "Zucchini (en tallarines)", qty: 150.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0030", item: "Brócoli", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0002", item: "Aceitunas", qty: 20.0, unit: "g", unitCost: 0.02 },
    { inventoryId: "INS-0167", item: "Pimiento", qty: 30.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0001", item: "Aceite de oliva", qty: 15.0, unit: "ml", unitCost: 0.03 }
  ], variants: [] },
  { id: "RCP-053", name: "Gaspacho", section: "PLATOS ESPECIALES", productIds: ["platos-gaspacho"], productId: "platos-gaspacho", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 20.29, ingredients: [
    { inventoryId: "INS-0195", item: "Sopa de tomate fría", qty: 250.0, unit: "ml", unitCost: 0.012 },
    { inventoryId: "INS-0143", item: "Pan tostado", qty: 30.0, unit: "g", unitCost: 0.55 },
    { inventoryId: "INS-0158", item: "Pepinillo", qty: 30.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0088", item: "Huevo duro", qty: 1.0, unit: "un", unitCost: 0.55 }
  ], variants: [] },
  { id: "RCP-054", name: "Tornillos con pollo acevichado", section: "PLATOS ESPECIALES", productIds: ["platos-tornillos-con-pollo-acevichado"], productId: "platos-tornillos-con-pollo-acevichado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.4, ingredients: [
    { inventoryId: "INS-0069", item: "Fideos tornillo", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0172", item: "Pollo", qty: 100.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0030", item: "Brócoli", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0185", item: "Salsa acevichada", qty: 50.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-055", name: "Pollo crujiente con papas al batán", section: "PLATOS ESPECIALES", productIds: ["platos-pollo-crujiente-con-papas-al-bat"], productId: "platos-pollo-crujiente-con-papas-al-bat", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.62, ingredients: [
    { inventoryId: "INS-0157", item: "Pechuga de pollo rebozada con avena", qty: 150.0, unit: "g", unitCost: 0.03 },
    { inventoryId: "INS-0146", item: "Papa sancochada", qty: 150.0, unit: "g", unitCost: 0.004467 },
    { inventoryId: "INS-0001", item: "Aceite de oliva", qty: 15.0, unit: "ml", unitCost: 0.03 }
  ], variants: [] },
  { id: "RCP-056", name: "Pollo a la plancha con papitas al chimichurri", section: "PLATOS ESPECIALES", productIds: ["platos-pollo-a-la-plancha-con-papitas-a"], productId: "platos-pollo-a-la-plancha-con-papitas-a", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 5.93, ingredients: [
    { inventoryId: "INS-0155", item: "Pechuga de pollo", qty: 150.0, unit: "g", unitCost: 0.028 },
    { inventoryId: "INS-0149", item: "Papitas nativas", qty: 150.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0186", item: "Salsa chimichurri", qty: 35.0, unit: "g", unitCost: 0.015143 }
  ], variants: [] },
  { id: "RCP-057", name: "Tortilla española", section: "PLATOS ESPECIALES", productIds: ["platos-tortilla-espanola"], productId: "platos-tortilla-espanola", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.01, ingredients: [
    { inventoryId: "INS-0089", item: "Huevos", qty: 3.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0147", item: "Papas", qty: 180.0, unit: "g", unitCost: 0.0045 },
    { inventoryId: "INS-0051", item: "Cebolla", qty: 50.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0167", item: "Pimiento", qty: 30.0, unit: "g", unitCost: 0.01 }
  ], variants: [] },
  { id: "RCP-058", name: "Quinoto", section: "PLATOS ESPECIALES", productIds: ["platos-quinoto"], productId: "platos-quinoto", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.74, ingredients: [
    { inventoryId: "INS-0181", item: "Quinoa", qty: 120.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0042", item: "Caldo base", qty: 200.0, unit: "ml", unitCost: 0.003 },
    { inventoryId: "INS-0180", item: "Queso parmesano", qty: 30.0, unit: "g", unitCost: 0.07 },
    { inventoryId: "INS-0123", item: "Mantequilla", qty: 20.0, unit: "g", unitCost: 0.03 }
  ], variants: [] },
  { id: "RCP-059", name: "Asado de carne al jugo", section: "PLATOS ESPECIALES", productIds: [], productId: null, station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Preparación base", referenceCost: 10.58, ingredients: [
    { inventoryId: "INS-0048", item: "Carne de res (asado)", qty: 180.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0100", item: "Jugo de cocción/salsa", qty: 80.0, unit: "ml", unitCost: 0.018 },
    { inventoryId: "INS-0146", item: "Papa sancochada", qty: 120.0, unit: "g", unitCost: 0.0045 },
    { inventoryId: "INS-0020", item: "Arroz blanco", qty: 100.0, unit: "g", unitCost: 0.005 }
  ], variants: [] },
  { id: "RCP-060", name: "Carnívoro", section: "BRUNCHES", productIds: ["brunch-brunch-carnivoro"], productId: "brunch-brunch-carnivoro", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 11.05, ingredients: [
    { inventoryId: "INS-0202", item: "Trucha pop", qty: 120.0, unit: "g", unitCost: 0.045 },
    { inventoryId: "INS-0107", item: "Kiwicha", qty: 15.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0030", item: "Brócoli", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 30.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0167", item: "Pimiento", qty: 25.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0055", item: "Cheesecake", qty: 100.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0014", item: "Aguas frescas", qty: 250.0, unit: "ml", unitCost: 0.005 }
  ], variants: [] },
  { id: "RCP-061", name: "Vegano", section: "BRUNCHES", productIds: ["brunch-brunch-vegano"], productId: "brunch-brunch-vegano", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 7.35, ingredients: [
    { inventoryId: "INS-0064", item: "Croquetas de quinua", qty: 120.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0175", item: "Pudding de chía", qty: 100.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0113", item: "Leche de soya", qty: 100.0, unit: "ml", unitCost: 0.006 },
    { inventoryId: "INS-0014", item: "Aguas frescas", qty: 250.0, unit: "ml", unitCost: 0.005 }
  ], variants: [] },
  { id: "RCP-062", name: "Vegetariano", section: "BRUNCHES", productIds: ["brunch-brunch-vegetariano"], productId: "brunch-brunch-vegetariano", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 6.49, ingredients: [
    { inventoryId: "INS-0152", item: "Patacones burger (Plátano)", qty: 150.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0200", item: "Tomate", qty: 40.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0139", item: "Palta", qty: 40.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0213", item: "Zucchini", qty: 40.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0176", item: "Queso", qty: 30.0, unit: "g", unitCost: 0.035 },
    { inventoryId: "INS-0097", item: "Jardín de avena", qty: 150.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0014", item: "Aguas frescas", qty: 250.0, unit: "ml", unitCost: 0.005 }
  ], variants: [] },
  { id: "RCP-063", name: "Bizcocho de café", section: "POSTRES", productIds: ["postre-bizcocho-de-cafe"], productId: "postre-bizcocho-de-cafe", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.12, ingredients: [
    { inventoryId: "INS-0028", item: "Bizcocho", qty: 100.0, unit: "g", unitCost: 0.02 },
    { inventoryId: "INS-0188", item: "Salsa de café", qty: 30.0, unit: "ml", unitCost: 0.02 },
    { inventoryId: "INS-0206", item: "Vino tinto", qty: 15.0, unit: "ml", unitCost: 0.035333 }
  ], variants: [] },
  { id: "RCP-064", name: "Brownie con fudge y helado", section: "POSTRES", productIds: ["postre-brownie-con-fudge-y-helado"], productId: "postre-brownie-con-fudge-y-helado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.21, ingredients: [
    { inventoryId: "INS-0031", item: "Brownie de chocolate", qty: 90.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0074", item: "Fudge de chocolate", qty: 30.0, unit: "g", unitCost: 0.018 },
    { inventoryId: "INS-0080", item: "Helado", qty: 60.0, unit: "g", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-065", name: "Pie de manzana con helado", section: "POSTRES", productIds: ["postre-pie-de-manzana-con-helado"], productId: "postre-pie-de-manzana-con-helado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.06, ingredients: [
    { inventoryId: "INS-0165", item: "Pie de manzana", qty: 120.0, unit: "g", unitCost: 0.022 },
    { inventoryId: "INS-0083", item: "Helado cremoso", qty: 60.0, unit: "g", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-066", name: "Crepes con salsa de naranja", section: "POSTRES", productIds: ["postre-crepes-con-salsa-de-naranja"], productId: "postre-crepes-con-salsa-de-naranja", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.83, ingredients: [
    { inventoryId: "INS-0127", item: "Masa de crepes", qty: 90.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0189", item: "Salsa de naranja", qty: 40.0, unit: "ml", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-067", name: "Crepes con helado artesanal de frutas", section: "POSTRES", productIds: ["postre-crepes-con-helado-artesanal-de-f"], productId: "postre-crepes-con-helado-artesanal-de-f", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.84, ingredients: [
    { inventoryId: "INS-0127", item: "Masa de crepes", qty: 90.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0081", item: "Helado artesanal de frutas locales", qty: 70.0, unit: "g", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-068", name: "Crepes con salsa de café y manzana acaramelada", section: "POSTRES", productIds: ["postre-crepes-con-salsa-de-cafe-y-manza"], productId: "postre-crepes-con-salsa-de-cafe-y-manza", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.55, ingredients: [
    { inventoryId: "INS-0127", item: "Masa de crepes", qty: 90.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0188", item: "Salsa de café", qty: 30.0, unit: "ml", unitCost: 0.02 },
    { inventoryId: "INS-0125", item: "Manzana caramelizada", qty: 60.0, unit: "g", unitCost: 0.01 }
  ], variants: [] },
  { id: "RCP-069", name: "Panqueques a la francesa", section: "POSTRES", productIds: ["postre-panqueques-a-la-francesa"], productId: "postre-panqueques-a-la-francesa", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.3, ingredients: [
    { inventoryId: "INS-0144", item: "Panqueques", qty: 100.0, unit: "g", unitCost: 0.014 },
    { inventoryId: "INS-0170", item: "Plátano", qty: 60.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0074", item: "Fudge de chocolate", qty: 30.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-070", name: "Panqueques con helado", section: "POSTRES", productIds: ["postre-panqueques-con-helado"], productId: "postre-panqueques-con-helado", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.82, ingredients: [
    { inventoryId: "INS-0144", item: "Panqueques", qty: 100.0, unit: "g", unitCost: 0.014 },
    { inventoryId: "INS-0080", item: "Helado", qty: 60.0, unit: "g", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-071", name: "Plátanos a la milanesa con helado y fudge", section: "POSTRES", productIds: ["postre-platanos-a-la-milanesa-con-helad"], productId: "postre-platanos-a-la-milanesa-con-helad", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.04, ingredients: [
    { inventoryId: "INS-0171", item: "Plátanos fritos empanizados", qty: 120.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0080", item: "Helado", qty: 60.0, unit: "g", unitCost: 0.007 },
    { inventoryId: "INS-0074", item: "Fudge de chocolate", qty: 30.0, unit: "g", unitCost: 0.018 }
  ], variants: [] },
  { id: "RCP-072", name: "Terremoto de Mango/Plátano/Fresa", section: "POSTRES", productIds: ["postre-terremoto-de-mango-platano-o-fre"], productId: "postre-terremoto-de-mango-platano-o-fre", station: "Cocina", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.38, ingredients: [
    { inventoryId: "INS-0070", item: "Fruta a elección (mango/plátano/fresa)", qty: 100.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0082", item: "Helado casero", qty: 70.0, unit: "g", unitCost: 0.007 },
    { inventoryId: "INS-0032", item: "Brownie picado", qty: 30.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0044", item: "Caramelo", qty: 20.0, unit: "ml", unitCost: 0.012 }
  ], variants: [] },
  { id: "RCP-073", name: "Infusión de Muña / Cedrón / Menta / Hierba Luisa / Té verde / Té negro", section: "INFUSIONES", productIds: ["infusi-infusion-de-muna", "infusi-infusion-de-cedron", "infusi-infusion-de-menta", "infusi-hierba-luisa", "infusi-te-verde", "infusi-te-negro"], productId: "infusi-infusion-de-muna", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 0.4, ingredients: [
    { inventoryId: "INS-0087", item: "Hojas seleccionadas (seca/fresca)", qty: 3.0, unit: "g", unitCost: 0.05 },
    { inventoryId: "INS-0008", item: "Agua hirviendo", qty: 250.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-074", name: "Infusión con pétalos de flores", section: "INFUSIONES", productIds: ["infusi-infusion-con-petalos-de-flores"], productId: "infusi-infusion-con-petalos-de-flores", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 0.41, ingredients: [
    { inventoryId: "INS-0164", item: "Pétalos de flores aromáticas", qty: 2.0, unit: "g", unitCost: 0.08 },
    { inventoryId: "INS-0008", item: "Agua hirviendo", qty: 250.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-075", name: "Té de manzana casera", section: "INFUSIONES", productIds: ["infusi-te-de-manzana-casera"], productId: "infusi-te-de-manzana-casera", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 0.67, ingredients: [
    { inventoryId: "INS-0126", item: "Manzana picada", qty: 50.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0199", item: "Té o infusión base", qty: 3.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0008", item: "Agua hirviendo", qty: 250.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-076", name: "Té limón, kion y miel", section: "INFUSIONES", productIds: ["infusi-te-limon-kion-y-miel"], productId: "infusi-te-limon-kion-y-miel", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.06, ingredients: [
    { inventoryId: "INS-0117", item: "Limón", qty: 20.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0106", item: "Kion (jengibre)", qty: 5.0, unit: "g", unitCost: 0.014 },
    { inventoryId: "INS-0135", item: "Miel de abeja", qty: 20.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0197", item: "Té base", qty: 2.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0008", item: "Agua hirviendo", qty: 250.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-077", name: "Hoja de coca, pisco, miel y limón", section: "INFUSIONES", productIds: ["infusi-hoja-de-coca-pisco-miel-y-limon"], productId: "infusi-hoja-de-coca-pisco-miel-y-limon", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.51, ingredients: [
    { inventoryId: "INS-0086", item: "Hoja de coca", qty: 3.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0169", item: "Pisco", qty: 30.0, unit: "ml", unitCost: 0.055 },
    { inventoryId: "INS-0135", item: "Miel de abeja", qty: 15.0, unit: "g", unitCost: 0.025333 },
    { inventoryId: "INS-0117", item: "Limón", qty: 20.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0006", item: "Agua caliente", qty: 200.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] },
  { id: "RCP-078", name: "Aguas frescas", section: "JUGOS/BATIDOS", productIds: ["jugos-aguas-frescas"], productId: "jugos-aguas-frescas", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.47, ingredients: [
    { inventoryId: "INS-0072", item: "Fruta / Vegetal infusionado", qty: 80.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0011", item: "Agua purificada", qty: 250.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-079", name: "Uva / Piña / Papaya", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-de-uva-pina-o-papaya"], productId: "jugos-jugo-de-uva-pina-o-papaya", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.1, ingredients: [
    { inventoryId: "INS-0071", item: "Fruta elegida", qty: 200.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0010", item: "Agua o hielo", qty: 100.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-080", name: "Naranja", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-de-naranja"], productId: "jugos-jugo-de-naranja", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.0, ingredients: [
    { inventoryId: "INS-0137", item: "Naranja fresca (jugo exprimido)", qty: 250.0, unit: "ml", unitCost: 0.008 }
  ], variants: [] },
  { id: "RCP-081", name: "Tuna y limón", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-de-tuna-y-limon"], productId: "jugos-jugo-de-tuna-y-limon", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.9, ingredients: [
    { inventoryId: "INS-0203", item: "Tuna", qty: 180.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0117", item: "Limón", qty: 20.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0005", item: "Agua", qty: 100.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-082", name: "Zanahoria, manzana y kion", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-de-zanahoria-manzana-y-kion"], productId: "jugos-jugo-de-zanahoria-manzana-y-kion", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.25, ingredients: [
    { inventoryId: "INS-0210", item: "Zanahoria", qty: 120.0, unit: "g", unitCost: 0.005 },
    { inventoryId: "INS-0124", item: "Manzana", qty: 100.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0105", item: "Kion", qty: 5.0, unit: "g", unitCost: 0.01 }
  ], variants: [] },
  { id: "RCP-083", name: "Piña y kion", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-de-pina-y-kion"], productId: "jugos-jugo-de-pina-y-kion", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.43, ingredients: [
    { inventoryId: "INS-0168", item: "Piña", qty: 180.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0105", item: "Kion", qty: 5.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0005", item: "Agua", qty: 100.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-084", name: "Vital", section: "JUGOS/BATIDOS", productIds: ["jugos-jugo-vital"], productId: "jugos-jugo-vital", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 1.47, ingredients: [
    { inventoryId: "INS-0124", item: "Manzana", qty: 80.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0168", item: "Piña", qty: 80.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0160", item: "Perejil", qty: 5.0, unit: "g", unitCost: 0.01 },
    { inventoryId: "INS-0066", item: "Espinaca", qty: 20.0, unit: "g", unitCost: 0.008 },
    { inventoryId: "INS-0005", item: "Agua", qty: 100.0, unit: "ml", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-085", name: "Energético (Mango y quinoa)", section: "JUGOS/BATIDOS", productIds: ["jugos-batido-energetico-de-mango-y-qui"], productId: "jugos-batido-energetico-de-mango-y-qui", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.22, ingredients: [
    { inventoryId: "INS-0120", item: "Mango", qty: 100.0, unit: "g", unitCost: 0.009 },
    { inventoryId: "INS-0182", item: "Quinoa cocida", qty: 40.0, unit: "g", unitCost: 0.012 },
    { inventoryId: "INS-0024", item: "Base cremosa / Leche", qty: 120.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-086", name: "Locura Oreo", section: "JUGOS/BATIDOS", productIds: ["jugos-batido-locura-oreo"], productId: "jugos-batido-locura-oreo", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.26, ingredients: [
    { inventoryId: "INS-0075", item: "Galletas Oreo", qty: 4.0, unit: "un", unitCost: 0.25 },
    { inventoryId: "INS-0025", item: "Base para batido / Helado", qty: 180.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-087", name: "Cacao Power (Plátano y cocoa)", section: "JUGOS/BATIDOS", productIds: ["jugos-batido-cacao-power"], productId: "jugos-batido-cacao-power", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.58, ingredients: [
    { inventoryId: "INS-0170", item: "Plátano", qty: 120.0, unit: "g", unitCost: 0.006 },
    { inventoryId: "INS-0061", item: "Cocoa", qty: 15.0, unit: "g", unitCost: 0.04 },
    { inventoryId: "INS-0110", item: "Leche / Base", qty: 180.0, unit: "ml", unitCost: 0.007 }
  ], variants: [] },
  { id: "RCP-088", name: "Bubble tea", section: "JUGOS/BATIDOS", productIds: ["jugos-bubble-tea"], productId: "jugos-bubble-tea", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.93, ingredients: [
    { inventoryId: "INS-0198", item: "Té base (café, oreo o matcha)", qty: 200.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0161", item: "Perlas de tapioca", qty: 40.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0109", item: "Leche", qty: 60.0, unit: "ml", unitCost: 0.0055 }
  ], variants: [] },
  { id: "RCP-089", name: "Cerveza Cusqueña / Pilsen / Trigo / Artesanal", section: "TRAGOS/CÓCTELES", productIds: [], productId: null, station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Preparación base", referenceCost: 2.64, ingredients: [
    { inventoryId: "INS-0029", item: "Botella / Lata", qty: 330.0, unit: "ml", unitCost: 0.008 }
  ], variants: [] },
  { id: "RCP-090", name: "Copa de vino (Tinto / Blanco)", section: "TRAGOS/CÓCTELES", productIds: [], productId: null, station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Preparación base", referenceCost: 5.25, ingredients: [
    { inventoryId: "INS-0205", item: "Vino", qty: 150.0, unit: "ml", unitCost: 0.035 }
  ], variants: [] },
  { id: "RCP-091", name: "Botella de vino", section: "TRAGOS/CÓCTELES", productIds: [], productId: null, station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Preparación base", referenceCost: 26.25, ingredients: [
    { inventoryId: "INS-0205", item: "Vino", qty: 750.0, unit: "ml", unitCost: 0.035 }
  ], variants: [] },
  { id: "RCP-092", name: "Psicola", section: "TRAGOS/CÓCTELES", productIds: ["tragos-psicola"], productId: "tragos-psicola", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.71, ingredients: [
    { inventoryId: "INS-0169", item: "Pisco", qty: 45.0, unit: "ml", unitCost: 0.055111 },
    { inventoryId: "INS-0076", item: "Gaseosa cola", qty: 200.0, unit: "ml", unitCost: 0.005 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-093", name: "Gallito de las rocas", section: "TRAGOS/CÓCTELES", productIds: ["tragos-gallito-de-las-rocas"], productId: "tragos-gallito-de-las-rocas", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.64, ingredients: [
    { inventoryId: "INS-0098", item: "Jengibre", qty: 10.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0136", item: "Naranja", qty: 50.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0169", item: "Pisco", qty: 45.0, unit: "ml", unitCost: 0.055111 },
    { inventoryId: "INS-0078", item: "Granadina", qty: 15.0, unit: "ml", unitCost: 0.025333 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-094", name: "Pisco Sour", section: "TRAGOS/CÓCTELES", productIds: ["tragos-pisco-sour"], productId: "tragos-pisco-sour", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.69, ingredients: [
    { inventoryId: "INS-0169", item: "Pisco", qty: 60.0, unit: "ml", unitCost: 0.055 },
    { inventoryId: "INS-0101", item: "Jugo de limón", qty: 30.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0095", item: "Jarabe de goma", qty: 20.0, unit: "ml", unitCost: 0.015 },
    { inventoryId: "INS-0060", item: "Clara de huevo", qty: 1.0, unit: "un", unitCost: 0.55 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 100.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-095", name: "Coca Sour", section: "TRAGOS/CÓCTELES", productIds: ["tragos-coca-sour"], productId: "tragos-coca-sour", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.36, ingredients: [
    { inventoryId: "INS-0169", item: "Pisco", qty: 60.0, unit: "ml", unitCost: 0.055 },
    { inventoryId: "INS-0093", item: "Infusión de hoja de coca", qty: 30.0, unit: "ml", unitCost: 0.01 },
    { inventoryId: "INS-0101", item: "Jugo de limón", qty: 20.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0095", item: "Jarabe de goma", qty: 20.0, unit: "ml", unitCost: 0.015 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 100.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-096", name: "Mojito", section: "TRAGOS/CÓCTELES", productIds: ["tragos-mojito"], productId: "tragos-mojito", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.34, ingredients: [
    { inventoryId: "INS-0183", item: "Ron", qty: 50.0, unit: "ml", unitCost: 0.045 },
    { inventoryId: "INS-0131", item: "Menta fresca", qty: 10.0, unit: "g", unitCost: 0.015 },
    { inventoryId: "INS-0101", item: "Jugo de limón", qty: 30.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0007", item: "Agua con gas", qty: 100.0, unit: "ml", unitCost: 0.004 },
    { inventoryId: "INS-0023", item: "Azúcar blanca", qty: 15.0, unit: "g", unitCost: 0.004 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-097", name: "Chilcano", section: "TRAGOS/CÓCTELES", productIds: ["tragos-chilcano"], productId: "tragos-chilcano", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.16, ingredients: [
    { inventoryId: "INS-0169", item: "Pisco", qty: 50.0, unit: "ml", unitCost: 0.055 },
    { inventoryId: "INS-0077", item: "Ginger ale", qty: 150.0, unit: "ml", unitCost: 0.007 },
    { inventoryId: "INS-0101", item: "Jugo de limón", qty: 15.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-098", name: "Cuba Libre", section: "TRAGOS/CÓCTELES", productIds: ["tragos-cuba-libre"], productId: "tragos-cuba-libre", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.32, ingredients: [
    { inventoryId: "INS-0183", item: "Ron", qty: 50.0, unit: "ml", unitCost: 0.045 },
    { inventoryId: "INS-0076", item: "Gaseosa cola", qty: 150.0, unit: "ml", unitCost: 0.005 },
    { inventoryId: "INS-0101", item: "Jugo de limón", qty: 10.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 80.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-099", name: "Algarrobina Express", section: "TRAGOS/CÓCTELES", productIds: ["tragos-algarrobina-express"], productId: "tragos-algarrobina-express", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 3.95, ingredients: [
    { inventoryId: "INS-0169", item: "Pisco", qty: 45.0, unit: "ml", unitCost: 0.055111 },
    { inventoryId: "INS-0017", item: "Algarrobina", qty: 30.0, unit: "ml", unitCost: 0.025 },
    { inventoryId: "INS-0115", item: "Leche evaporada / Crema", qty: 40.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0096", item: "Jarabe / Huevo", qty: 15.0, unit: "g", unitCost: 0.014667 },
    { inventoryId: "INS-0085", item: "Hielo", qty: 60.0, unit: "g", unitCost: 0.003 }
  ], variants: [] },
  { id: "RCP-100", name: "Macho Regional", section: "TRAGOS/CÓCTELES", productIds: ["tragos-macho-regional"], productId: "tragos-macho-regional", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 4.4, ingredients: [
    { inventoryId: "INS-0133", item: "Mezcla de licores locales", qty: 60.0, unit: "ml", unitCost: 0.06 },
    { inventoryId: "INS-0094", item: "Insumos regionales", qty: 40.0, unit: "ml", unitCost: 0.02 }
  ], variants: [] },
  { id: "RCP-101", name: "Calientito", section: "TRAGOS/CÓCTELES", productIds: ["tragos-calientito"], productId: "tragos-calientito", station: "Barra", yieldQty: 1, yieldUnit: "ración", version: "1.0", status: "Activa", referenceCost: 2.82, ingredients: [
    { inventoryId: "INS-0013", item: "Aguardiente / Cañazo", qty: 45.0, unit: "ml", unitCost: 0.035111 },
    { inventoryId: "INS-0135", item: "Miel de abeja", qty: 20.0, unit: "g", unitCost: 0.025 },
    { inventoryId: "INS-0102", item: "Jugo de naranja", qty: 80.0, unit: "ml", unitCost: 0.008 },
    { inventoryId: "INS-0006", item: "Agua caliente", qty: 100.0, unit: "ml", unitCost: 0.001 }
  ], variants: [] }
];
