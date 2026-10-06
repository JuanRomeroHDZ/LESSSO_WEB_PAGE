/* ============================================================
   PÁGINA: SUSCRIPCIONES (subscriptions.js) — Punto de entrada
   ============================================================ */
import { initTheme } from '../modules/theme.js';
import { initNetworkCanvas } from '../modules/network-canvas.js';
import { initHeaderScroll } from '../modules/header-scroll.js';
import { initReveal } from '../modules/reveal.js';
import { initPlanCheckout } from '../modules/plan-checkout.js';
import { initPrivacyDock } from '../modules/privacy-dock.js';

function init() {
  initTheme(document.getElementById('themeToggle'));
  initNetworkCanvas(document.getElementById('canvas-bg'));
  initHeaderScroll(document.getElementById('header'));
  initReveal();
  initPlanCheckout();
  initPrivacyDock();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
