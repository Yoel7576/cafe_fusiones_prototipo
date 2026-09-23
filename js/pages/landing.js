// Cafe Fusiones - LandingPage publica (sitio informativo, sin login).
// No usa requireAuth/getState: es contenido publico independiente del ERP interno.
import { icon } from "../core/utils.js";
import { showToast } from "../components/toast.js";

/* Iconos propios de esta pantalla (no se comparten con el ERP interno). */
const localIcons = {
  cup: '<path d="M4 8h13a3 3 0 0 1 0 6h-1"/><path d="M4 8v7a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-2"/><path d="M8 2c-.4 1 .4 1.4 0 2.4"/><path d="M12 2c-.4 1 .4 1.4 0 2.4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  sandwich: '<path d="M3 11h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M4 11a8 5 0 0 1 16 0"/><path d="M3 16h18"/>',
  bowl: '<path d="M3 12h18a9 6 0 0 1-18 0Z"/><path d="M12 12V5"/><path d="M9 7l3-2 3 2"/>',
  leaf: '<path d="M5 21c9 0 14-5 14-14V4h-3C7 4 4 10 4 16v5Z"/><path d="M5 21c3-6 6-9 12-12"/>',
  pasta: '<circle cx="12" cy="12" r="9"/><path d="M7 8c2 3 2 5 0 8M12 7c2 3 2 6 0 9M17 8c2 3 2 5 0 8"/>',
  cake: '<path d="M4 21v-8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8Z"/><path d="M4 16h16"/><path d="M9 11V7a1 1 0 1 1 2 0v1M15 11V7a1 1 0 1 1 2 0v1"/><path d="M12 5V3"/>',
  box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  tree: '<path d="M12 3v18"/><path d="M12 9 6 5"/><path d="M12 9l6-4"/><path d="M12 15 5 10"/><path d="M12 15l7-5"/>'
};
function localIcon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${localIcons[name] || localIcons.cup}</svg>`;
}

const menuCategories = [
  { icon: "cup", title: "Café", desc: "Espresso, cappuccino, latte y filtrados con grano de Amazonas.", tags: [] },
  { icon: "sun", title: "Desayunos", desc: "Combos para empezar el día, dulces y salados.", tags: ["VG"] },
  { icon: "sandwich", title: "Sándwiches", desc: "Pan artesanal con rellenos de la casa.", tags: [] },
  { icon: "bowl", title: "Cremas", desc: "Cremas calientes de temporada, ideales para las tardes frías de Chachapoyas.", tags: ["VG"] },
  { icon: "leaf", title: "Ensaladas", desc: "Frescas, con vegetales de la zona.", tags: ["V", "SG"] },
  { icon: "pasta", title: "Pastas", desc: "Clásicas y de la casa, en porción individual.", tags: [] },
  { icon: "chef", title: "Platos especiales", desc: "Propuestas de temporada de nuestra cocina.", tags: [] },
  { icon: "cake", title: "Postres", desc: "Reposteria de la casa para cerrar con dulce.", tags: ["VG"] },
  { icon: "box", title: "Box lunches", desc: "Listos para llevar, ideales para grupos y excursiones.", tags: [] }
];

const traceSteps = [
  { step: "01", title: "Origen", text: "Cerezas cultivadas en el Valle del Huayabamba, Amazonas, entre 1,200 y 1,800 msnm, variedad Caturra." },
  { step: "02", title: "Recepción", text: "Cada lote se identifica con un código propio, por ejemplo AMZ-2608-01, que lo acompaña en todo el proceso." },
  { step: "03", title: "Tueste", text: "Tueste artesanal en tandas pequeñas dentro del mismo local, con perfil medio." },
  { step: "04", title: "Preparación", text: "El café molido se usa en barra para el espresso, cappuccino y latte de la carta." },
  { step: "05", title: "Tu taza", text: "Servida fresca. Si preguntas en barra, te contamos de qué productor y valle viene." }
];

const galleryTiles = [
  { type: "photo", src: "../assets/img/cafe-hero.webp", alt: "Fachada de Café Fusiones", wide: true },
  { type: "tile", icon: "cup", label: "Barra de café" },
  { type: "tile", icon: "leaf", label: "Ambiente" },
  { type: "tile", icon: "cake", label: "Repostería" },
  { type: "tile", icon: "sun", label: "Desayunos" },
  { type: "tile", icon: "tree", label: "Terraza", wide: true }
];

renderMenu();
renderTrace();
renderGallery();
wireHeader();
wireContactForm();

function renderMenu() {
  const grid = document.getElementById("landing-menu-grid");
  grid.innerHTML = menuCategories.map((item) => `
    <article class="landing-menu-card">
      ${item.icon === "chef" ? icon("chef") : localIcon(item.icon)}
      <h3>${item.title}</h3>
      <p>${item.desc}</p>
      ${item.tags.length ? `<div class="landing-menu-card__tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>` : ""}
    </article>
  `).join("");
}

function renderTrace() {
  const wrap = document.getElementById("landing-trace-timeline");
  wrap.innerHTML = traceSteps.map((item) => `
    <div class="timeline-item">
      <time>${item.step}</time>
      <div>
        <strong>${item.title}</strong>
        <p>${item.text}</p>
      </div>
    </div>
  `).join("");
}

function renderGallery() {
  const grid = document.getElementById("landing-gallery");
  grid.innerHTML = galleryTiles.map((item) => {
    if (item.type === "photo") {
      return `<figure class="landing-gallery__photo${item.wide ? " landing-gallery__photo--wide" : ""}"><img src="${item.src}" alt="${item.alt}" loading="lazy"></figure>`;
    }
    return `<div class="landing-gallery__tile${item.wide ? " landing-gallery__tile--wide" : ""}">${localIcon(item.icon)}<span>${item.label}</span></div>`;
  }).join("");
}

function wireHeader() {
  const header = document.getElementById("landing-header");
  const nav = document.getElementById("landing-nav");
  const toggle = document.getElementById("landing-nav-toggle");
  const navLinks = [...nav.querySelectorAll("a")];

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 16);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = nav.querySelector(`a[href="#${entry.target.id}"]`);
        if (!link) return;
        navLinks.forEach((item) => item.classList.remove("is-active"));
        link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    sections.forEach((section) => observer.observe(section));
  }
}

function wireContactForm() {
  const form = document.getElementById("landing-contact-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showToast("Gracias por escribirnos, te responderemos pronto.");
    form.reset();
  });
}
