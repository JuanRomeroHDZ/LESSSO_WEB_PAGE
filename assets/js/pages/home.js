/* ============================================================
   PÁGINA: INICIO (home.js) — Punto de entrada oficial
   ============================================================ */
import { initTheme } from '../modules/theme.js';
import { initNetworkCanvas } from '../modules/network-canvas.js';
import { initHeaderScroll } from '../modules/header-scroll.js';
import { initReveal } from '../modules/reveal.js';
import { initProjectsCarousel } from '../modules/carousel.js';
import { initContactForm } from '../modules/contact-form.js';
import { initPrivacyDock } from '../modules/privacy-dock.js';
import { initModals } from '../modules/modal.js';

function init() {
  initTheme(document.getElementById('themeToggle'));
  initNetworkCanvas(document.getElementById('canvas-bg'));
  initHeaderScroll(document.getElementById('header'));
  initReveal();
  initProjectsCarousel();
  initContactForm(document.getElementById('contactForm'));
  initPrivacyDock();
  initModals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
