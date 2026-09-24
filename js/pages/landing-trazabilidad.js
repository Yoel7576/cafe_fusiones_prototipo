// Cafe Fusiones - LandingPage publica: Trazabilidad (pages/landing-trazabilidad.html).
// Seccion nueva (no existe en cafefusiones.com): busca la trazabilidad de un producto
// por codigo. Los lotes salen de Administracion > Trazabilidad (mismo localStorage,
// mismo origen), en modo solo lectura. El QR de un empaque/boleta apunta directo a landing-lote.html?codigo=...;
// escribir el mismo codigo aqui encuentra el producto y lleva a esa misma ficha.
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { buscarLotePublico } from "../data/site-data.js";

renderSiteHeader("trazabilidad", { solid: true });
renderRecognitions();
renderSiteFooter();

const form = document.getElementById("site-trace-search");
const input = document.getElementById("trace-code");
const message = document.getElementById("site-trace-message");
const result = document.getElementById("site-trace-result");
const exampleButton = document.getElementById("site-trace-example");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(input.value);
});

exampleButton.addEventListener("click", () => {
  input.value = "Caficultores_Valle_Huayabamba";
  search(input.value);
});

const params = new URLSearchParams(window.location.search);
const initialCode = params.get("codigo");
if (initialCode) {
  input.value = initialCode;
  search(initialCode);
}

function search(code) {
  const product = buscarLotePublico(code);
  const cleanCode = String(code ?? "").trim();

  if (!cleanCode) {
    message.textContent = "Ingresa un código para buscar.";
    message.className = "site-trace-search__message is-error";
    hideResult();
    return;
  }

  if (!product) {
    message.textContent = `No encontramos ningún producto con el código "${cleanCode}". Verifica e intenta nuevamente.`;
    message.className = "site-trace-search__message is-error";
    hideResult();
    return;
  }

  message.textContent = "";
  message.className = "site-trace-search__message";
  showResult(product);
}

function hideResult() {
  result.hidden = true;
  result.innerHTML = "";
}

function showResult(product) {
  result.hidden = false;
  const detailUrl = `landing-lote.html?codigo=${encodeURIComponent(product.code)}`;
  result.innerHTML = `
    <a class="site-trace-found" href="${detailUrl}">
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="site-trace-found__copy">
        <span class="eyebrow">${product.type}</span>
        <h3>${product.name}</h3>
        <p>${product.valley} · Lote ${product.lotCode}</p>
      </div>
      <span class="site-trace-found__cta">Ver trazabilidad completa →</span>
    </a>`;
  result.scrollIntoView({ behavior: "smooth", block: "start" });
}
