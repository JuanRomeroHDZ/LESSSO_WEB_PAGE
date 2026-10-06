/* ============================================================
   CARRUSEL HORIZONTAL DE PROYECTOS (Accesible)
   ============================================================ */

export function initProjectsCarousel() {
  const slider = document.getElementById('projectsSlider');
  const prevBtn = document.getElementById('projPrevBtn');
  const nextBtn = document.getElementById('projNextBtn');
  const dots = document.querySelectorAll('#carouselDots .dot');
  if (!slider) return;

  function getStep() {
    const card = slider.querySelector('.project');
    return card ? card.offsetWidth + 28 : 340;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      slider.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      slider.scrollBy({ left: getStep(), behavior: 'smooth' });
    });
  }

  // Actualizar dots e indicadores accesibles
  slider.addEventListener('scroll', () => {
    const step = getStep();
    const index = Math.round(slider.scrollLeft / step);
    dots.forEach((dot, i) => {
      const isActive = i === index;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }, { passive: true });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      slider.scrollTo({ left: i * getStep(), behavior: 'smooth' });
    });
  });
}
