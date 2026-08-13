// Cafe Fusiones - Autenticacion (regla 9: mantener el login funcionando).
import { demoUser } from "../data/data.js";

const SESSION_KEY = "cafeFusionesSession";

export { demoUser };

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function setSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Protege las paginas internas: si no hay sesion, vuelve al login.
export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

export function sessionRole() {
  return getSession()?.role || demoUser.role || "Gerencia";
}
