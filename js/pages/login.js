// Cafe Fusiones - Pantalla de Login (solo la logica de esta pantalla).
import { demoUser, getSession, setSession } from "../core/auth.js";

// Si ya hay sesion activa, ir directo al panel.
if (getSession()) window.location.replace("dashboard.html");

const form = document.querySelector("#login-form");
const username = document.querySelector("#username");
const password = document.querySelector("#password");
const message = document.querySelector("#login-message");
const toggle = document.querySelector("#toggle-password");

toggle.addEventListener("click", () => {
  const visible = password.type === "text";
  password.type = visible ? "password" : "text";
  toggle.setAttribute("aria-label", visible ? "Mostrar clave" : "Ocultar clave");
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const userOk = username.value.trim().toUpperCase() === demoUser.username;
  const passOk = password.value === demoUser.password;
  if (!userOk || !passOk) {
    message.textContent = "Credenciales no validas. Revisa usuario y clave.";
    return;
  }
  setSession({
    name: demoUser.name,
    role: demoUser.role,
    email: demoUser.email,
    initials: demoUser.initials,
    startedAt: new Date().toISOString()
  });
  window.location.href = "dashboard.html";
});
