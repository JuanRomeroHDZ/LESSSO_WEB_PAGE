/* ============================================================
   SCROLL HEADER — agrega .scrolled al bajar
   ============================================================ */

/**
 * @param {HTMLElement|null} header
 * @param {number} threshold Píxeles de scroll antes de activar el estado.
 */
export function initHeaderScroll(header, threshold = 30) {
  if (!header) return;

  const update = () => header.classList.toggle('scrolled', window.scrollY > threshold);

  window.addEventListener('scroll', update, { passive: true });
  update();
}
