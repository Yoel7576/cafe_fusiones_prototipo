// Cafe Fusiones - Barra lateral de navegacion V4.
// Ruta: js/components/sidebar.js
//
// Configuracion es ahora un MODULO del ERP:
//   pages/configuracion.html
//
// Ya no se ejecuta openSettings() desde el sidebar.
// El modal antiguo puede permanecer temporalmente en useractions.js por
// compatibilidad, pero este componente deja de llamarlo.
//
// Notificaciones, Ayuda y Cerrar sesion siguen siendo acciones contextuales.

import { NAV, allowedIds } from "../core/router.js";
import { icon } from "../core/utils.js";
import { handleUserAction } from "./useractions.js";

function navLink(item, activeId) {
  const current = item.id === activeId ? ' aria-current="page"' : "";

  return `
    <a
      class="nav-button"
      href="${item.id}.html"
      ${current}
    >
      ${icon(item.icon)}
      <span>${item.label}</span>
    </a>
  `;
}

const secondaryItems = [
  {
    type: "action",
    action: "notifications",
    icon: "bell",
    label: "Notificaciones"
  },
  {
    type: "link",
    id: "configuracion",
    href: "configuracion.html",
    icon: "gear",
    label: "Configuracion"
  },
  {
    type: "action",
    action: "help",
    icon: "help",
    label: "Ayuda"
  },
  {
    type: "action",
    action: "logout",
    icon: "logout",
    label: "Cerrar sesion"
  }
];

function secondaryItem(item, activeId) {
  if (item.type === "link") {
    const current = item.id === activeId ? ' aria-current="page"' : "";

    return `
      <a
        class="nav-button"
        href="${item.href}"
        ${current}
      >
        ${icon(item.icon)}
        <span>${item.label}</span>
      </a>
    `;
  }

  return `
    <button
      class="nav-button"
      type="button"
      data-user-action="${item.action}"
    >
      ${icon(item.icon)}
      <span>${item.label}</span>
    </button>
  `;
}

export function renderSidebar(activeId, role) {
  const ids = allowedIds(role);
  const items = NAV.filter((item) => ids.includes(item.id));

  const sidebar = document.getElementById("sidebar");

  if (sidebar) {
    sidebar.innerHTML = `
      <button
        class="sidebar-toggle"
        type="button"
        aria-label="Ocultar o mostrar menu lateral"
        title="Ocultar o mostrar menu lateral"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>

      <a
        class="brand-lockup"
        href="dashboard.html"
        aria-label="Cafe Fusiones inicio"
      >
        <img
          src="../assets/img/Logo café fusiones.png"
          alt="Cafe Fusiones"
          aria-hidden="false"
        >
        <span>
          <strong>Cafe Fusiones</strong>
          <small>Sistema integral</small>
        </span>
      </a>
 
      <nav
        class="side-nav"
        aria-label="Navegacion principal"
      >
        ${items.map((item) => navLink(item, activeId)).join("")}
      </nav>

      <nav
        class="side-actions"
        aria-label="Cuenta y opciones"
      >
        ${secondaryItems.map((item) => secondaryItem(item, activeId)).join("")}
      </nav>
    `;

    const shell = document.querySelector(".app-shell");
    const toggleButton = sidebar.querySelector(".sidebar-toggle");

    toggleButton?.addEventListener("click", () => {
      const collapsed = shell?.classList.toggle("sidebar-collapsed");
      sidebar.classList.toggle("is-collapsed", collapsed);
      toggleButton.setAttribute("aria-expanded", String(!collapsed));
    });

    // Solo los elementos que siguen siendo acciones utilizan useractions.js.
    // Configuracion es un <a> y por tanto no pasa por handleUserAction().
    sidebar
      .querySelectorAll("[data-user-action]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          handleUserAction(button.dataset.userAction);
        });
      });
  }

  const bottomNav = document.getElementById("bottom-nav");

  if (bottomNav) {
    bottomNav.innerHTML = items
      .filter((item) => item.mobile)
      .map((item) => navLink(item, activeId))
      .join("");
  }
}
