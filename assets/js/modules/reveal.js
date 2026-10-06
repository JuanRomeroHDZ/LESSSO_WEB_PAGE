/* ============================================================
   REVEAL ANIMATIONS — agrega .in-view al entrar en pantalla
   Respeta prefers-reduced-motion
   ============================================================ */

export function initReveal(selector = '.reveal', options = { threshold: 0.1 }) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Si prefiere movimiento reducido o no soporta IntersectionObserver: mostrar todo directo
  if (prefersReduced || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('in-view'));
    return;
  }

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
