/* ============================================================
   PÁGINA: INICIO — punto de entrada JS
   ============================================================ */
import { initTheme } from '../modules/theme.js';
import { initNetworkCanvas } from '../modules/network-canvas.js';
import { initHeaderScroll } from '../modules/header-scroll.js';
import { initReveal } from '../modules/reveal.js';
import { initModals } from '../modules/modal.js';
import { initContactForm } from '../modules/contact-form.js';

initTheme(document.getElementById('themeToggle'));
initNetworkCanvas(document.querySelector('[data-network-canvas]'));
initHeaderScroll(document.getElementById('header'));
initReveal();
initModals();
initContactForm(document.getElementById('contactForm'));
