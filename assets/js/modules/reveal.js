/* ============================================================
   REVEAL ANIMATIONS — agrega .in-view al entrar en pantalla
   ============================================================ */

export function initReveal(selector = '.reveal', options = { threshold: 0.1 }) {
  const elements = document.querySelectorAll(selector);
  if (!elements.length) return;

  // Navegadores sin soporte: mostrar todo de inmediato.
  if (!('IntersectionObserver' in window)) {
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
