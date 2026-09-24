// Cafe Fusiones - Header/footer compartidos de las paginas publicas (landing-*.html).
// Replica la navegacion real de cafefusiones.com: cada opcion es una pagina distinta
// (sin anclas), mas "Trazabilidad", que es la seccion nueva que no existe en el sitio real.

const navItems = [
  { id: "inicio", label: "Inicio", href: "landing.html" },
  { id: "laboratorio", label: "Laboratorio", href: "landing-laboratorio.html" },
  { id: "nosotros", label: "Nosotros", href: "landing-nosotros.html" },
  { id: "menu", label: "Menú", href: "landing-menu.html" },
  { id: "trazabilidad", label: "Trazabilidad", href: "landing-trazabilidad.html" },
  { id: "galeria", label: "Galería", href: "landing-galeria.html" },
  { id: "contacto", label: "Contacto", href: "landing-contacto.html" }
];

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com/cafefusiones", icon: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>' },
  { label: "Facebook", href: "https://facebook.com/cafefusiones", icon: '<path d="M14 9h3V5h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 0 1 1-1Z"/>' },
  { label: "Tripadvisor", href: "https://www.tripadvisor.com.pe/Restaurant_Review-g799618-d1894882-Reviews-Cafe_Fusiones-Chachapoyas_Amazonas_Region.html", icon: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>' }
];

export function renderSiteHeader(activeId, { solid = false } = {}) {
  const root = document.getElementById("site-header");
  if (!root) return;
  root.className = `site-header${solid ? " is-solid" : ""}`;
  root.innerHTML = `
    <div class="site-header__inner">
      <a class="site-brand" href="landing.html">
        <img src="../assets/img/site/logo-elixir.webp" alt="Café Fusiones">
      </a>
      <nav class="site-nav" id="site-nav" aria-label="Navegación principal">
        ${navItems.map((item) => `<a href="${item.href}"${item.id === activeId ? ' class="is-active" aria-current="page"' : ""}>${item.label}</a>`).join("")}
      </nav>
      <button class="site-nav-toggle" id="site-nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Abrir menú">
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>
      </button>
    </div>`;

  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("site-nav-toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  if (!solid) {
    const onScroll = () => root.classList.toggle("is-scrolled", window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

export function renderRecognitions() {
  const root = document.getElementById("site-recognitions");
  if (!root) return;
  root.innerHTML = `
    <div class="site-container">
      <h2>Reconocimientos:</h2>
      <div class="site-recognitions__row">
        <a href="https://cafelab.pe/2019/01/01/top-5-de-cafes-y-cafeterias-del-2018_cafelab_peru/" target="_blank" rel="noopener">
          <img src="../assets/img/site/cafelab.webp" alt="Cafélab">
        </a>
        <a href="https://www.tripadvisor.com.pe/Restaurant_Review-g799618-d1894882-Reviews-Cafe_Fusiones-Chachapoyas_Amazonas_Region.html" target="_blank" rel="noopener">
          <img src="../assets/img/site/tripadvisor.webp" alt="Tripadvisor">
        </a>
      </div>
    </div>`;
}

export function renderSiteFooter() {
  const root = document.getElementById("site-footer");
  if (!root) return;
  root.innerHTML = `
    <div class="site-container site-footer__inner">
      <div class="site-footer__brand">
        <img src="../assets/img/site/logo-elixir.webp" alt="">
        <span class="site-footer__address">Jr. Ortiz Arrieta 779, Chachapoyas</span>
      </div>
      <div class="site-footer__social">
        ${socialLinks.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}"><svg aria-hidden="true" viewBox="0 0 24 24">${s.icon}</svg></a>`).join("")}
      </div>
    </div>
    <p class="site-footer__legal site-container">© 2026 Café Fusiones. Prototipo de demostración.</p>`;
}

export function wirePageLink() {
  const links = document.querySelectorAll('.site-nav a[href^="landing"]');
  links.forEach((link) => link.addEventListener("click", () => {
    document.getElementById("site-nav")?.classList.remove("is-open");
  }));
}
