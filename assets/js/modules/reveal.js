/* ============================================================
   REVEAL ANIMATIONS — Inherently Safe Animation Engine
   - Por defecto: todo el contenido es 100% visible (sin fallbacks frágiles)
   - Solo activa animaciones si IntersectionObserver está disponible y listo
   - Respeta prefers-reduced-motion
   ============================================================ */

export function initReveal(selector = '.reveal', options = { threshold: 0.1 }) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Si el usuario prefiere menos movimiento o no soporta IntersectionObserver:
  // no activar clases de animación; el contenido permanece visible por defecto
  if (prefersReduced || !('IntersectionObserver' in window)) {
    return;
  }

  // Activar animación SOLO AHORA que el observador está confirmado y listo
  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  elements.forEach((el) => observer.observe(el));
}
