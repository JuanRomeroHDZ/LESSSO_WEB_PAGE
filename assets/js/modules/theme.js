/* ============================================================
   TEMA CLARO / OSCURO (Con accesibilidad en español)
   ============================================================ */
import { SITE, THEME_META_COLORS } from '../config/site.js';
import { readStorage, writeStorage } from '../core/storage.js';

const root = document.documentElement;
const THEMES = ['light', 'dark'];

/** Evento emitido en `document` cada vez que cambia el tema. */
export const THEME_CHANGE_EVENT = 'lessso:themechange';

export function getTheme() {
  return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  root.setAttribute('data-theme', theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_META_COLORS[theme]);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  writeStorage(SITE.themeStorageKey, theme);
  document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } }));
}

function getInitialTheme() {
  const stored = readStorage(SITE.themeStorageKey);
  if (THEMES.includes(stored)) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Aplica el tema guardado (o el del sistema) y conecta el botón de cambio.
 * @param {HTMLElement|null} toggle Botón que alterna el tema.
 */
export function initTheme(toggle) {
  applyTheme(getInitialTheme());

  toggle?.addEventListener('click', () => {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  // Escuchar cambios de preferencia en el sistema operativo
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!readStorage(SITE.themeStorageKey)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}
