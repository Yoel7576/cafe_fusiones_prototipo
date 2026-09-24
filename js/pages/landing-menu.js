// Cafe Fusiones - LandingPage publica: Menu completo (pages/landing-menu.html).
//
// La carta sale de los platos marcados como "Publicar en landing" en
// Administracion, agrupados por categoria. Si todavia no hay ninguno publicado
// (por ejemplo en un navegador que nunca abrio el sistema), se muestran las
// categorias estaticas de site-menu.js.
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { cartaPublica, siteMenuCategories } from "../data/site-data.js";
import { escapeHtml, money } from "../core/utils.js";

renderSiteHeader("menu", { solid: true });
renderRecognitions();
renderSiteFooter();

const contenedor = document.getElementById("site-menu-grid");
const grupos = cartaPublica();

if (grupos.length) {
  contenedor.classList.remove("site-menu-grid", "site-menu-grid--lg");
  contenedor.classList.add("site-carta");
  contenedor.innerHTML = grupos.map(grupoHtml).join("");
} else {
  contenedor.innerHTML = siteMenuCategories.map((cat) => `
    <div class="site-menu-card">
      <img src="${cat.image}" alt="${escapeHtml(cat.title)}" loading="lazy">
      <h3>${escapeHtml(cat.title)}</h3>
    </div>
  `).join("");
}

function grupoHtml(grupo) {
  return `
    <section class="site-carta__grupo">
      <h2 class="site-carta__titulo">${escapeHtml(grupo.titulo)}</h2>
      <ul class="site-carta__lista">
        ${grupo.items.map(platoHtml).join("")}
      </ul>
    </section>`;
}

function platoHtml(plato) {
  const dieta = (plato.dietary || [])
    .map((etiqueta) => `<span class="site-carta__tag">${escapeHtml(etiqueta)}</span>`)
    .join("");

  return `
    <li class="site-carta__item">
      <div class="site-carta__fila">
        <h3>${escapeHtml(plato.name)}</h3>
        <span class="site-carta__puntos" aria-hidden="true"></span>
        <strong>${money(plato.price)}</strong>
      </div>
      ${plato.description ? `<p>${escapeHtml(plato.description)}</p>` : ""}
      ${plato.descriptionEn ? `<p class="site-carta__en">${escapeHtml(plato.descriptionEn)}</p>` : ""}
      ${dieta ? `<div class="site-carta__tags">${dieta}</div>` : ""}
    </li>`;
}
