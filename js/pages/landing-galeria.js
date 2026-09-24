// Cafe Fusiones - LandingPage publica: Galeria (pages/landing-galeria.html).
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";

const categories = [
  { title: "Platos", image: "../assets/img/site/galeria-platos.jpg" },
  { title: "Bebidas", image: "../assets/img/site/galeria-bebidas.jpg" },
  { title: "Comercio Justo", image: "../assets/img/site/galeria-comercio-justo.jpg" },
  { title: "Social", image: "../assets/img/site/galeria-social.jpg" }
];

renderSiteHeader("galeria", { solid: true });
renderRecognitions();
renderSiteFooter();

document.getElementById("site-gallery-grid").innerHTML = categories.map((cat) => `
  <figure class="site-gallery-card">
    <img src="${cat.image}" alt="${cat.title}" loading="lazy">
    <h3>${cat.title}</h3>
  </figure>
`).join("");
