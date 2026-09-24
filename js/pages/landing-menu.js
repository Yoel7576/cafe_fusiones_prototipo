// Cafe Fusiones - LandingPage publica: Menu completo (pages/landing-menu.html).
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { siteMenuCategories } from "../data/site-menu.js";

renderSiteHeader("menu", { solid: true });
renderRecognitions();
renderSiteFooter();

document.getElementById("site-menu-grid").innerHTML = siteMenuCategories.map((cat) => `
  <div class="site-menu-card">
    <img src="${cat.image}" alt="${cat.title}" loading="lazy">
    <h3>${cat.title}</h3>
  </div>
`).join("");
