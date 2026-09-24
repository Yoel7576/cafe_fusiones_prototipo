// Cafe Fusiones - LandingPage publica: ficha de un lote (pages/landing-lote.html).
// Se llega aqui desde el buscador de landing-trazabilidad.html o directo por
// ?codigo=... (el mismo enlace que llevaria un QR de empaque o mesa).
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { findTraceableProduct } from "../data/site-traceability.js";
import { formatDate } from "../core/utils.js";

renderSiteHeader("trazabilidad", { solid: true });
renderRecognitions();
renderSiteFooter();

const checkIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
const qrIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h.01"/></svg>';

const params = new URLSearchParams(window.location.search);
const code = params.get("codigo");
const product = findTraceableProduct(code);
const root = document.getElementById("site-lote-content");

document.title = product ? `${product.lotCode} | Café Fusiones` : "Ficha no encontrada | Café Fusiones";

root.innerHTML = product ? renderProduct(product) : renderNotFound(code);

function renderProduct(p) {
  return `
    <section class="site-lote-hero">
      <div class="site-container site-lote-hero__grid">
        <aside class="site-lote-preps">
          <h2>Preparaciones con este café</h2>
          <p>Así se usa este lote en nuestra barra.</p>
          <ul>${p.preparations.map((prep) => `<li>${prep}</li>`).join("")}</ul>
        </aside>
        <div class="site-lote-card">
          <span class="eyebrow">Ficha de trazabilidad del lote</span>
          <h1>${p.lotCode}</h1>
          <span class="site-lote-badge">${checkIcon} Lote verificado</span>
          <div class="site-lote-facts">
            <div><span>Producto</span><strong>${p.name}</strong></div>
            <div><span>Origen</span><strong>${p.valley}</strong></div>
            <div><span>Altitud</span><strong>${p.altitude}</strong></div>
            <div><span>Variedad</span><strong>${p.variety}</strong></div>
          </div>
          <a class="site-button" href="landing-trazabilidad.html">← Volver a la búsqueda</a>
        </div>
      </div>
    </section>

    <section class="site-lote-origin">
      <div class="site-container site-lote-origin__grid">
        <img src="${p.image}" alt="Origen de ${p.name}">
        <div>
          <h2>Origen del café</h2>
          <dl>
            <div><dt>Región</dt><dd>${p.region}</dd></div>
            <div><dt>Valle</dt><dd>${p.valley}</dd></div>
            <div><dt>Altitud</dt><dd>${p.altitude}</dd></div>
          </dl>
          <div class="site-lote-origin__producer">
            <img src="${p.producerImage}" alt="${p.producer}">
            <div>
              <h3>Aliado productor: ${p.producer}</h3>
              <p>Trabajamos de forma directa con esta organización comunal como co-productores del insumo.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="site-lote-timeline">
      <div class="site-container">
        <div class="site-section__head"><h2>Recorrido del café</h2></div>
        <div class="site-lote-steps">
          ${p.steps.map((step, i) => `
            <article class="site-lote-step ${i % 2 === 0 ? "site-lote-step--left" : "site-lote-step--right"}">
              <span class="site-lote-step__num">${String(i + 1).padStart(2, "0")}</span>
              <h3>${step.title}</h3>
              ${step.date ? `<time>${formatDate(step.date)}</time>` : ""}
              <p>${step.text}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>

    <section class="site-lote-datasheet">
      <div class="site-container">
        <div class="site-section__head"><h2>Datos técnicos</h2></div>
        <div class="site-lote-datasheet__box">
          <div class="site-lote-verified">
            <span class="site-lote-verified__check">${checkIcon}</span>
            <div><strong>Autenticidad verificada</strong><p>Lote inspeccionado y aprobado en nuestro sistema interno.</p></div>
          </div>
          <div class="site-lote-datagrid">
            <div><span>Código de lote</span><strong>${p.lotCode}</strong></div>
            <div><span>Estado del lote</span><strong>Activo</strong></div>
            <div><span>Origen</span><strong>${p.valley}</strong></div>
            <div><span>Altitud</span><strong>${p.altitude}</strong></div>
            <div><span>Variedad</span><strong>${p.variety}</strong></div>
            <div><span>Tueste</span><strong>${p.roast}</strong></div>
            <div><span>Fecha de recepción</span><strong>${formatDate(p.received)}</strong></div>
            <div><span>Fecha de tueste</span><strong>${formatDate(p.roastedAt)}</strong></div>
            <div><span>Stock disponible</span><strong>${p.stock} ${p.unit}</strong></div>
            <div><span>Aliado productor</span><strong>${p.producer}</strong></div>
            <div><span>Preparaciones</span><strong>${p.preparations.join(", ")}</strong></div>
            <div><span>Conservación</span><strong>${p.storage}</strong></div>
          </div>
          <div class="site-lote-qr">
            <span class="site-lote-qr__mark">${qrIcon}</span>
            <div><span>Código QR</span><strong>Escanéalo en el empaque o en la mesa para volver a esta ficha</strong></div>
          </div>
        </div>
      </div>
    </section>`;
}

function renderNotFound(searchedCode) {
  return `
    <div class="site-lote-notfound">
      <h1>No encontramos esa ficha</h1>
      <p>${searchedCode ? `No existe ningún lote con el código "${searchedCode}".` : "Falta indicar un código de lote."} Prueba buscarlo de nuevo.</p>
      <a class="site-button" href="landing-trazabilidad.html">← Volver a la búsqueda</a>
    </div>`;
}
