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
  const progressBar = section.querySelector('#carouselProgressBar') || document.getElementById('carouselProgressBar');
  const cards = slider.querySelectorAll('.project');

  function getStep() {
    const card = slider.querySelector('.project');
    if (!card) return 350;
    const style = window.getComputedStyle(slider);
    const gap = parseFloat(style.gap) || 28;
    return card.offsetWidth + gap;
  }

  function getCurrentIndex() {
    const step = getStep();
    return Math.round(slider.scrollLeft / step);
  }

  function scrollToCard(index) {
    const step = getStep();
    const clamped = Math.max(0, Math.min(index, cards.length - 1));
    slider.scrollTo({
      left: clamped * step,
      behavior: 'smooth'
    });
  }

  prevBtn?.addEventListener('click', () => {
    const idx = getCurrentIndex();
    scrollToCard(idx - 1);
  });

  nextBtn?.addEventListener('click', () => {
    const idx = getCurrentIndex();
    scrollToCard(idx + 1);
  });

  function updateIndicators() {
    const maxScroll = slider.scrollWidth - slider.clientWidth;
    const progress = maxScroll > 0 ? Math.max(0, Math.min(1, slider.scrollLeft / maxScroll)) : 0;

    if (progressBar) {
      const trackWidth = progressBar.parentElement ? progressBar.parentElement.offsetWidth : 140;
      const count = cards.length || 3;
      const barWidth = trackWidth / count;
      progressBar.style.width = `${barWidth}px`;
      const travel = trackWidth - barWidth;
      progressBar.style.transform = `translateX(${progress * travel}px)`;
    }
  }

  slider.addEventListener('scroll', updateIndicators, { passive: true });
  window.addEventListener('resize', updateIndicators, { passive: true });
  updateIndicators();
}
