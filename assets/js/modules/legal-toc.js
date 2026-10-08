/* ============================================================
   ÍNDICE LATERAL LEGAL (TABLE OF CONTENTS)
   Seguimiento activo de lectura y control interactivo en la barra lateral.
   Garantiza el marcado exacto al desplazarse o seleccionar cualquier sección,
   incluyendo las secciones finales e inferiores de la página.
   ============================================================ */
(function() {
  function initLegalToc() {
    var tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks.length) return;

    var sections = [];
    tocLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var el = document.getElementById(href.slice(1));
        if (el) {
          sections.push({ id: href.slice(1), el: el, link: link });
        }
      }
    });

    if (!sections.length) return;

    var activeLink = null;
    function setActive(link) {
      if (!link) return;
      if (activeLink === link) return;
      tocLinks.forEach(function(l) { l.classList.remove('is-active'); });
      link.classList.add('is-active');
      activeLink = link;

      // Mantener visible el enlace activo dentro de la barra lateral si tiene scroll propio
      try {
        var sidebar = link.closest('.legal-sidebar');
        if (sidebar && sidebar.scrollHeight > sidebar.clientHeight) {
          var linkRect = link.getBoundingClientRect();
          var sidebarRect = sidebar.getBoundingClientRect();
          if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
            link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }
      } catch (e) {}
    }

    var isClickNavigating = false;
    var clickNavTimer = null;
    var userSelectedSection = null;

    // 1. Manejo explícito de selección (clic) en cualquier punto del índice
    tocLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        var matched = sections.find(function(s) { return s.link === link; });
        if (matched) {
          userSelectedSection = matched;
          setActive(matched.link);
          isClickNavigating = true;
          clearTimeout(clickNavTimer);
          // Bloquear sobreescritura de scroll durante la animación de desplazamiento suave
          clickNavTimer = setTimeout(function() {
            isClickNavigating = false;
          }, 1200);
        }
      });
    });

    // 2. Reactivar detección al detectar interacción directa del usuario
    function onManualInput() {
      if (isClickNavigating) {
        isClickNavigating = false;
        clearTimeout(clickNavTimer);
      }
    }
    window.addEventListener('wheel', onManualInput, { passive: true });
    window.addEventListener('touchmove', onManualInput, { passive: true });
    window.addEventListener('keydown', function(e) {
      // Teclas de desplazamiento: Espacio, RePág, AvPág, Fin, Inicio, Flechas Arriba/Abajo
      if ([32, 33, 34, 35, 36, 38, 40].indexOf(e.keyCode) !== -1) {
        onManualInput();
      }
    }, { passive: true });

    // 3. Cálculo de la sección activa según la posición de lectura
    var ticking = false;
    function updateActiveSection() {
      ticking = false;
      if (isClickNavigating) return;

      var scrollY = window.pageYOffset || document.documentElement.scrollTop;
      var windowHeight = window.innerHeight;
      var scrollHeight = document.documentElement.scrollHeight;
      var remainingScroll = scrollHeight - (scrollY + windowHeight);

      // CASO A: Al llegar hasta abajo de la página
      // El scroll físico del navegador no puede avanzar más allá del pie de página.
      if (remainingScroll <= 40) {
        if (userSelectedSection) {
          var selRect = userSelectedSection.el.getBoundingClientRect();
          if (selRect.top >= 0 && selRect.top < windowHeight * 0.85) {
            setActive(userSelectedSection.link);
            return;
          }
        }
        setActive(sections[sections.length - 1].link);
        return;
      }

      // CASO B: Desplazamiento regular
      // Umbral de lectura: normalmente 130px (bajo el header fijo).
      // Al aproximarse al fondo de la página, expandir gradualmente el umbral
      // hacia el centro de la pantalla porque los encabezados finales no pueden llegar a 130px.
      var threshold = 130;
      var maxBottomZone = windowHeight * 0.6;
      if (remainingScroll < 400) {
        var progress = (400 - remainingScroll) / 400;
        threshold = 130 + progress * (maxBottomZone - 130);
      }

      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        var top = sections[i].el.getBoundingClientRect().top;
        if (top <= threshold) {
          current = sections[i];
        } else {
          break;
        }
      }

      if (current) {
        userSelectedSection = current;
        setActive(current.link);
      }
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // 4. Inicializar según hash en URL o primera sección
    var initialHash = window.location.hash;
    if (initialHash) {
      var initialMatched = sections.find(function(s) { return '#' + s.id === initialHash; });
      if (initialMatched) {
        userSelectedSection = initialMatched;
        setActive(initialMatched.link);
        return;
      }
    }

    setActive(sections[0].link);
    updateActiveSection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLegalToc);
  } else {
    initLegalToc();
  }
})();
