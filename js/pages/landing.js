// Cafe Fusiones - LandingPage publica: Inicio (pages/landing.html).
// No usa requireAuth: lee el estado en modo solo lectura para mostrar la carta
// que Administracion publica, con las categorias estaticas como respaldo.
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { cartaPublica, imagenDeCategoria, siteMenuCategories } from "../data/site-data.js";
import { escapeHtml } from "../core/utils.js";

const heroImages = [
  "../assets/img/site/hero-1.webp",
  "../assets/img/site/hero-2.webp",
  "../assets/img/site/hero-3.webp",
  "../assets/img/site/hero-4.webp"
];

renderSiteHeader("inicio");
renderRecognitions();
renderSiteFooter();
renderHero();
renderMenuPreview();

function renderHero() {
  const track = document.getElementById("site-hero-track");
  const dots = document.getElementById("site-hero-dots");
  track.innerHTML = heroImages.map((src, i) => `<img src="${src}" alt="" loading="${i === 0 ? "eager" : "lazy"}" class="${i === 0 ? "is-active" : ""}">`).join("");
  dots.innerHTML = heroImages.map((_, i) => `<button type="button" aria-label="Imagen ${i + 1}" class="${i === 0 ? "is-active" : ""}"></button>`).join("");

  const slides = [...track.querySelectorAll("img")];
  const dotButtons = [...dots.querySelectorAll("button")];
  let current = 0;
  let timer = startAutoplay();

  function show(index) {
    slides[current].classList.remove("is-active");
    dotButtons[current].classList.remove("is-active");
    current = index;
    slides[current].classList.add("is-active");
    dotButtons[current].classList.add("is-active");
  }
  function startAutoplay() {
    return window.setInterval(() => show((current + 1) % slides.length), 5500);
  }
  dotButtons.forEach((btn, i) => btn.addEventListener("click", () => {
    window.clearInterval(timer);
    show(i);
    timer = startAutoplay();
  }));
}

// La vista previa muestra las categorias de la carta publicada en
// Administracion; si no hay nada publicado, las estaticas del sitio.
function renderMenuPreview() {
  const grid = document.getElementById("site-menu-grid");
  const grupos = cartaPublica();

  const categorias = grupos.length
    ? grupos.map((grupo) => ({ title: grupo.titulo, image: imagenDeCategoria(grupo.titulo) }))
    : siteMenuCategories;

  grid.innerHTML = categorias.map((cat) => `
    <a class="site-menu-card" href="landing-menu.html">
      <img src="${cat.image}" alt="${escapeHtml(cat.title)}" loading="lazy">
      <h3>${escapeHtml(cat.title)}</h3>
    </a>
  `).join("");
}
