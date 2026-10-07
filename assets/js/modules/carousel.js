/* ============================================================
   CARRUSEL HORIZONTAL DE PROYECTOS (Accesible y responsivo)
   Principios aplicados: Law of Demeter, SRP
   ============================================================ */

export function initProjectsCarousel(slider = document.getElementById('projectsSlider')) {
  if (!slider) return;

  const section = slider.closest('section') || document;
  const prevBtn = section.querySelector('#projPrevBtn') || document.getElementById('projPrevBtn');
  const nextBtn = section.querySelector('#projNextBtn') || document.getElementById('projNextBtn');
  const dots = section.querySelectorAll('#carouselDots .dot');

  function getStep() {
    const card = slider.querySelector('.project');
    return card ? card.offsetWidth + 28 : 340;
  }

  prevBtn?.addEventListener('click', () => {
    slider.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });

  nextBtn?.addEventListener('click', () => {
    slider.scrollBy({ left: getStep(), behavior: 'smooth' });
  });

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
