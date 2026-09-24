// Cafe Fusiones - LandingPage publica: Contacto (pages/landing-contacto.html).
import { renderSiteHeader, renderRecognitions, renderSiteFooter } from "../components/sitenav.js";
import { showToast } from "../components/toast.js";

const testimonials = [
  { text: "Me encantó la decoración y atención del lugar. Es uno de los puntos en la “Ruta del café”, la cual recomiendo tomar si eres amante del café artesanal. La atención del personal fue acogedora y los panqueques estuvieron deliciosos!", author: "Gaby Cerna — Tripadvisor" },
  { text: "Pedimos un capuccino fusiones y un brownie con helado y estaba muy rico. El capuccino tiene pisco, chocolate y helado. La atención es muy buena y amable.", author: "Grace V — Tripadvisor" },
  { text: "El lugar me encantó, está en la misma plaza de armas. Es amplio y muy acogedor, perfecto para comer o tomar algo. Tienen un rincón de biblioteca y de tienda de comercio justo con artesanías locales. También cerveza artesana! Definitivamente un lugar muy agradable :)", author: "Julia Sanges — Tripadvisor" }
];

renderSiteHeader("contacto", { solid: true });
renderRecognitions();
renderSiteFooter();

document.getElementById("site-testimonials").innerHTML = testimonials.map((t) => `
  <article class="site-testimonial">
    <p>"${t.text}"</p>
    <cite>${t.author}</cite>
  </article>
`).join("");

document.getElementById("site-contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  showToast("Gracias por escribirnos, te responderemos pronto.");
  event.target.reset();
});
