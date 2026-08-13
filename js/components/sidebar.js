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
      <a
        class="brand-lockup"
        href="dashboard.html"
        aria-label="Cafe Fusiones inicio"
      >
        <img
          src="../assets/img/cafe-fusiones-mark.svg"
          alt=""
          aria-hidden="true"
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
