// Cafe Fusiones - Utilidades compartidas (regla 7: logica compartida en core).

export const icons = {
  layout: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 4-2V2Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  chef: '<path d="M6 13.9A4.5 4.5 0 0 1 8.7 5a5.4 5.4 0 0 1 10 2.2A4 4 0 0 1 18 15H6Z"/><path d="M6 15v5h12v-5"/><path d="M10 18h4"/>',
  boxes: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'
};

export function icon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${icons[name] || icons.layout}</svg>`;
}

export function money(value) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 2 }).format(value || 0);
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function normalize(value) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function matchesSearch(query, ...values) {
  if (!query) return true;
  const q = normalize(query);
  return values.some((value) => normalize(value).includes(q));
}

export function statusClass(status) {
  const value = normalize(status);
  if (value.includes("libre") || value.includes("activo") || value.includes("oro")) return "status status--ok";
  if (value.includes("reservada") || value.includes("plata")) return "status status--info";
  if (value.includes("bajo") || value.includes("critico") || value.includes("venc")) return "status status--danger";
  if (value.includes("ocupada") || value.includes("bronce") || value.includes("pendiente")) return "status status--busy";
  return "status";
}

export function trendClass(tone) {
  if (tone === "danger") return "trend trend--danger";
  if (tone === "warn") return "trend trend--warn";
  return "trend";
}

export function formatDate(iso) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export const inventoryUnits = ["kg", "g", "L", "ml", "un", "docena", "paquete", "caja", "bolsa", "botella"];

export function unitOptions(selected, withPlaceholder = false) {
  const base = !selected || inventoryUnits.includes(selected) ? inventoryUnits : [selected, ...inventoryUnits];
  const placeholder = withPlaceholder ? `<option value="" disabled ${selected ? "" : "selected"}>Seleccione unidad</option>` : "";
  return placeholder + base.map((unit) => `<option value="${unit}" ${unit === selected ? "selected" : ""}>${unit}</option>`).join("");
}

export const TODAY = "2026-07-06";

export function isExpiringSoon(expiry) {
  const today = new Date(`${TODAY}T00:00:00`);
  const date = new Date(`${expiry}T00:00:00`);
  const diff = (date - today) / 86400000;
  return diff >= 0 && diff <= 7;
}

export function emptyState(message) {
  return `<p class="empty-state">${message}</p>`;
}

export const IGV_RATE = 0.18;

export function tableSubtotal(table) {
  return (table.items || []).reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function tableTotal(table) {
  const sub = tableSubtotal(table);
  return Math.round(sub * (1 + IGV_RATE) * 100) / 100;
}

/* ---- Exportacion de archivos (PDF / Excel) ---- */
export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function xmlEscape(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function pdfEscape(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function wrapPdfLine(value, maxLength) {
  const text = String(value ?? "");
  if (text.length <= maxLength) return [text];
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxLength) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });
  if (current) lines.push(current);
  return lines;
}

export function buildSimplePdf(lines) {
  const pages = [];
  const pageLines = [];
  lines.flatMap((line) => wrapPdfLine(line, 92)).forEach((line) => {
    if (pageLines.length >= 42) {
      pages.push([...pageLines]);
      pageLines.length = 0;
    }
    pageLines.push(line);
  });
  if (pageLines.length) pages.push([...pageLines]);

  const objects = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pages.map((_, index) => `${index * 2 + 3} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  pages.forEach((page, index) => {
    const contentObject = index * 2 + 4;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${pages.length * 2 + 3} 0 R >> >> /Contents ${contentObject} 0 R >>`);
    const stream = `BT\n/F1 10 Tf\n50 750 Td\n14 TL\n${page.map((line) => `(${pdfEscape(line)}) Tj T*`).join("\n")}\nET`;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}
