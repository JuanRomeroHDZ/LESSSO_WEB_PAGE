/* ============================================================
   SCROLL HEADER INTELIGENTE
   - Oculta suavemente al hacer scroll down (translateY(-100%))
   - Reaparece suavemente al hacer scroll up (translateY(0)) con glassmorphism
   - Transparente en el tope superior
   - Optimizado con requestAnimationFrame y passive listener
   ============================================================ */

/**
 * @param {HTMLElement|null} header
 * @param {number} topThreshold Píxeles de scroll antes de activar el estado con fondo.
 */
export function initHeaderScroll(header, topThreshold = 20) {
  if (!header) return;

  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let ticking = false;
  const SCROLL_THRESHOLD = 8;

  const update = () => {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;

    // Estado con fondo glassmorphic y borde/sombra si no estamos arriba
    if (currentScrollY > topThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Comportamiento de dirección: siempre visible arriba o con menú abierto
    const isNavOpen = header.classList.contains('is-nav-open');
    if (currentScrollY <= 60 || isNavOpen) {
      header.classList.remove('header--hidden');
      lastScrollY = currentScrollY;
    } else {
      const diff = currentScrollY - lastScrollY;
      if (diff > SCROLL_THRESHOLD) {
        // Desplazamiento hacia abajo: ocultar header
        header.classList.add('header--hidden');
        lastScrollY = currentScrollY;
      } else if (diff < -SCROLL_THRESHOLD) {
        // Desplazamiento hacia arriba: mostrar header con animación suave
        header.classList.remove('header--hidden');
        lastScrollY = currentScrollY;
      }
    }

    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  // Control interactivo del menú móvil (A11y y Progressive Enhancement)
  const navToggle = header.querySelector('#navToggle, .nav-toggle');
  if (navToggle && !navToggle.__lesssoNavAttached) {
    navToggle.__lesssoNavAttached = true;
    const closeNav = () => {
      header.classList.remove('is-nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = header.classList.toggle('is-nav-open');
      if (isOpen) {
        header.classList.remove('header--hidden');
      }
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    header.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('click', (e) => {
      if (!header.contains(e.target) && header.classList.contains('is-nav-open')) {
        closeNav();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('is-nav-open')) {
        closeNav();
        navToggle.focus();
      }
    });
  }
}
