/* ============================================================
   TEMA CLARO / OSCURO (Accesible y resiliente)
   Principios aplicados: DRY, Law of Demeter, SRP
   ============================================================ */

import { SITE, THEME_META_COLORS } from '../config.js';
import { readStorage, writeStorage } from '../core/storage.js';

const root = document.documentElement;
const THEMES = ['light', 'dark'];

/** Evento emitido en `document` cada vez que cambia el tema. */
export const THEME_CHANGE_EVENT = 'lessso:themechange';

export function getTheme() {
  const current = root.getAttribute('data-theme');
  return current === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  root.setAttribute('data-theme', nextTheme);
  root.classList.toggle('dark', nextTheme === 'dark');
  root.classList.toggle('light', nextTheme === 'light');

  if (document.body) {
    document.body.setAttribute('data-theme', nextTheme);
    document.body.classList.toggle('dark', nextTheme === 'dark');
    document.body.classList.toggle('light', nextTheme === 'light');
  }

  // Actualizar meta theme-color para navegadores móviles
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_META_COLORS[nextTheme] || THEME_META_COLORS.light);
  }

  // Actualizar accesibilidad en todos los botones de tema presentes
  const label = nextTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  document.querySelectorAll('#themeToggle, .theme-toggle').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });

  writeStorage(SITE.themeStorageKey, nextTheme);
  document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: nextTheme } }));
}

export function getInitialTheme() {
  const stored = readStorage(SITE.themeStorageKey);
  if (THEMES.includes(stored)) return stored;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

/**
 * Aplica el tema guardado (o el del sistema) y conecta los escuchadores de eventos.
 */
export function initTheme() {
  applyTheme(getInitialTheme());

  if (window.__lesssoThemeListenerAttached) return;
  window.__lesssoThemeListenerAttached = true;

  // Delegación de eventos infalible: captura clics en el botón o en sus hijos SVG/path
  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#themeToggle, .theme-toggle');
    if (!toggleBtn) return;
    e.preventDefault();
    const currentTheme = getTheme();
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // Escuchar cambios de preferencia en el sistema operativo si el usuario no ha fijado una manualmente
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!readStorage(SITE.themeStorageKey)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
