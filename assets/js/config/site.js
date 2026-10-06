/* ============================================================
   CONFIGURACIÓN GLOBAL DEL SITIO
   Un solo lugar para datos de contacto y paletas usadas por JS.
   ============================================================ */

export const SITE = Object.freeze({
  contactEmail: 'contacto@lessso.com',
  themeStorageKey: 'lessso-theme',
});

/** Color de la barra del navegador (<meta name="theme-color">) por tema. */
export const THEME_META_COLORS = Object.freeze({
  dark: '#0c0a09',
  light: '#fafaf9',
});

/** Colores de la red animada del hero por tema. */
export const CANVAS_PALETTE = Object.freeze({
  dark: { node: '#1a9e9e', line: 'rgba(26, 158, 158, 0.15)' },
  light: { node: '#09363c', line: 'rgba(9, 54, 60, 0.1)' },
});
