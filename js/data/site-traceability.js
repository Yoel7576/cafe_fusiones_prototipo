// Cafe Fusiones - Productos con trazabilidad publica (pages/landing-trazabilidad.html
// busca por codigo, pages/landing-lote.html muestra la ficha completa). Hoy solo hay un
// producto; la estructura queda lista para sumar mas sin tocar la logica de busqueda.
export const traceableProducts = [
  {
    code: "Caficultores_Valle_Huayabamba",
    name: "Caficultores del Valle del Huayabamba",
    type: "Granos de café de especialidad",
    region: "Andes orientales de Perú",
    valley: "Valle del Huayabamba, Amazonas",
    altitude: "1200–1800 m s. n. m.",
    description: "Granos orgánicos seleccionados para las preparaciones de espresso, métodos filtrados (V60, Chemex, Prensa Francesa, etc.) y bebidas de la casa.",
    image: "../assets/img/site/hero-3.webp",
    producerImage: "../assets/img/menu-cafe.jpg",
    lotCode: "AMZ-2608-01",
    variety: "Caturra",
    roast: "Medio, artesanal",
    producer: "Cooperativa Agraria Rodríguez de Mendoza",
    received: "2026-08-02",
    roastedAt: "2026-08-05",
    stock: 7,
    unit: "kg",
    preparations: ["Espresso", "V60", "Chemex", "Prensa Francesa", "Bebidas de la casa"],
    storage: "Grano tostado; conservar en envase hermético, en un lugar fresco y seco, lejos de la luz directa.",
    steps: [
      { title: "Cultivo", text: "En las parcelas de altura del Valle del Huayabamba, cuidadas por los caficultores aliados." },
      { title: "Cosecha", text: "Selección manual de las cerezas más maduras." },
      { title: "Recepción", date: "2026-08-02", text: "El lote llega y se identifica con el código AMZ-2608-01." },
      { title: "Tostado", date: "2026-08-05", text: "Tueste medio y artesanal, en tandas pequeñas dentro del local." },
      { title: "Molienda", text: "Molienda ajustada a cada método de preparación." },
      { title: "Extracción", text: "Espresso, V60, Chemex, Prensa Francesa y demás bebidas de la casa." },
      { title: "Degustación", text: "Servido fresco en barra, con trazabilidad hasta el productor." }
    ]
  }
];

function normalizeCode(value) {
  return String(value ?? "").trim().replace(/\s+/g, "_").toLowerCase();
}

export function findTraceableProduct(code) {
  const target = normalizeCode(code);
  if (!target) return null;
  return traceableProducts.find((p) => normalizeCode(p.code) === target) || null;
}
