/* ============================================================
   LESSSO — JavaScript Principal Autónomo y Modular
   - Compatible 100% con file:// (sin restricciones CORS de módulos ES)
   - Compatible con servidores locales (localhost:8080) y producción (lessso.com)
   - Tema claro/oscuro con detección de sistema y persistencia segura
   - Animaciones reveal progresivas (visibles por defecto ante fallos)
   - Carrusel de proyectos táctil y accesible
   - Formulario de contacto con validación en cliente
   - Canvas animado de red de nodos
   ============================================================ */

(function () {
  'use strict';

  // Marcar capacidad JS inmediatamente
  document.documentElement.classList.add('js');

  /* ============ CONFIGURACIÓN GLOBAL ============ */
  var SITE = Object.freeze({
    contactEmail: 'contacto@lessso.com',
    themeStorageKey: 'lessso-theme',
    consentStorageKey: 'lessso-cookie-consent'
  });

  var THEME_META_COLORS = Object.freeze({
    dark: '#0c0a09',
    light: '#fafaf9'
  });

  var CANVAS_PALETTE = Object.freeze({
    dark: { node: '#1a9e9e', line: 'rgba(26, 158, 158, 0.15)' },
    light: { node: '#09363c', line: 'rgba(9, 54, 60, 0.1)' }
  });

  var STRIPE_ALLOWED_HOSTS = ['buy.stripe.com', 'checkout.stripe.com'];

  var SUBSCRIPTION_PLANS = {
    basico: { paymentLink: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400' },
    esencial: { paymentLink: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400' },
    profesional: { paymentLink: 'https://buy.stripe.com/dRmfZjaWzcPP9AI5vk38402' },
    negocio: { paymentLink: 'https://buy.stripe.com/fZu7sNc0D5nncMU0b038401' }
  };

  /* ============ ALMACENAMIENTO SEGURO ============ */
  function readStorage(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  /* ============ TEMA CLARO / OSCURO ============ */
  var root = document.documentElement;
  var THEMES = ['light', 'dark'];
  var THEME_CHANGE_EVENT = 'lessso:themechange';

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', THEME_META_COLORS[theme] || THEME_META_COLORS.light);
    }

    var toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }

    writeStorage(SITE.themeStorageKey, theme);
    document.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme: theme } }));
  }

  function getInitialTheme() {
    var stored = readStorage(SITE.themeStorageKey);
    if (THEMES.includes(stored)) return stored;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  function initTheme(toggle) {
    applyTheme(getInitialTheme());

    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
      });
    }

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (!readStorage(SITE.themeStorageKey)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  /* ============ CANVAS DE RED HERO ============ */
  var LINK_DISTANCE = 150;

  function initNetworkCanvas(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var nodes = [];
    var colors = CANVAS_PALETTE[getTheme()] || CANVAS_PALETTE.light;
    var animationId = null;
    var isRunning = false;
    var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    function initNodes() {
      nodes = [];
      var count = Math.min(8, Math.max(4, Math.floor(canvas.width / 200)));
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: 2 + Math.random() * 1.5,
        });
      }
    }

    function resize() {
      if (!canvas.parentElement) return;
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initNodes();
      if (prefersReducedMotion && prefersReducedMotion.matches) {
        renderFrame();
      }
    }

    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.node;
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.8;

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        n.x = Math.max(0, Math.min(canvas.width, n.x));
        n.y = Math.max(0, Math.min(canvas.height, n.y));

        for (var j = i + 1; j < nodes.length; j++) {
          var n2 = nodes[j];
          var dx = n2.x - n.x;
          var dy = n2.y - n.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            ctx.globalAlpha = 1 - dist / LINK_DISTANCE;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      if (!isRunning) return;
      renderFrame();
      animationId = requestAnimationFrame(loop);
    }

    function startAnimation() {
      if (isRunning || (prefersReducedMotion && prefersReducedMotion.matches) || document.hidden) return;
      isRunning = true;
      animationId = requestAnimationFrame(loop);
    }

    function stopAnimation() {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAnimation();
      else startAnimation();
    });

    document.addEventListener(THEME_CHANGE_EVENT, function (e) {
      colors = CANVAS_PALETTE[e.detail.theme] || CANVAS_PALETTE.light;
      if (prefersReducedMotion && prefersReducedMotion.matches) renderFrame();
    });

    window.addEventListener('resize', resize, { passive: true });

    resize();
    if ((!prefersReducedMotion || !prefersReducedMotion.matches) && !document.hidden) {
      startAnimation();
    }
  }

  /* ============ HEADER SCROLL ============ */
  function initHeaderScroll(header, threshold) {
    if (!header) return;
    threshold = threshold || 30;
    function update() {
      header.classList.toggle('scrolled', window.scrollY > threshold);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ============ REVEAL ANIMATIONS (Progresivas y Resilientes) ============ */
  function initReveal(selector) {
    selector = selector || '.reveal';
    var elements = document.querySelectorAll(selector);
    if (!elements.length) return;

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Si prefiere movimiento reducido o no soporta IntersectionObserver: todo visible de inmediato
    if (prefersReduced || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in-view');
      } else {
        observer.observe(el);
      }
    });

    // Respaldo de seguridad: garantizar que todo se haga visible en máximo 800ms
    setTimeout(function () {
      elements.forEach(function (el) { el.classList.add('in-view'); });
    }, 800);
  }

  /* ============ CARRUSEL DE PROYECTOS ============ */
  function initProjectsCarousel() {
    var slider = document.getElementById('projectsSlider');
    var prevBtn = document.getElementById('projPrevBtn');
    var nextBtn = document.getElementById('projNextBtn');
    var dots = document.querySelectorAll('#carouselDots .dot');
    if (!slider) return;

    function getStep() {
      var card = slider.querySelector('.project');
      return card ? card.offsetWidth + 28 : 340;
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        slider.scrollBy({ left: -getStep(), behavior: 'smooth' });
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        slider.scrollBy({ left: getStep(), behavior: 'smooth' });
      });
    }

    slider.addEventListener('scroll', function () {
      var step = getStep();
      var index = Math.round(slider.scrollLeft / step);
      dots.forEach(function (dot, i) {
        var isActive = i === index;
        dot.classList.toggle('active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }, { passive: true });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        slider.scrollTo({ left: i * getStep(), behavior: 'smooth' });
      });
    });
  }

  /* ============ FORMULARIO DE CONTACTO ============ */
  var ALLOWED_SERVICES = [
    'Desarrollo Web a la Medida',
    'Suscripción Mensual de Página Web',
    'Mantenimiento o Actualización Web',
    'E-commerce / Tienda en Línea',
    'Infraestructura & Servidores Linux',
    'Seguridad Web & Hardening',
    'Cotización General o Duda'
  ];

  var ALLOWED_URGENCY = [
    'Inmediato / Menos de 1 mes',
    '1 a 3 meses',
    'Solo explorando opciones'
  ];

  var ALLOWED_BUDGET = [
    '',
    'Suscripción Web ($799 - $2,499 MXN/mes)',
    'Menos de $10,000 MXN',
    '$10,000 a $25,000 MXN',
    '$25,000 a $50,000 MXN',
    'Más de $50,000 MXN',
    'Por definir / Explorando'
  ];

  function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/\0/g, '').trim();
  }

  function sanitizeSingleLine(str) {
    return sanitizeString(str).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');
  }

  function initContactForm(form) {
    if (!form || typeof form.querySelector !== 'function') return;

    var phoneInput = form.querySelector('#phone');
    var statusEl = document.getElementById('formStatus');
    var submitBtn = document.getElementById('submitBtn');

    if (phoneInput) {
      phoneInput.addEventListener('keydown', function (e) {
        var allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (!/[0-9+\s\-()]/.test(e.key)) {
          e.preventDefault();
        }
      });

      phoneInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/[^0-9+\s\-()]/g, '');
      });
    }

    function showStatus(msg, type, isHtml) {
      if (!statusEl) return;
      if (isHtml) statusEl.innerHTML = msg;
      else statusEl.textContent = msg;
      statusEl.className = 'form-status ' + type;
      statusEl.style.display = 'block';
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      var botField = form.querySelector('[name="bot-field"]');
      if (botField && botField.value.trim() !== '') {
        showStatus('✅ Mensaje procesado.', 'success');
        form.reset();
        return;
      }

      var name = sanitizeSingleLine(form.elements['name'] ? form.elements['name'].value : '');
      var email = sanitizeSingleLine(form.elements['email'] ? form.elements['email'].value : '');
      var phone = sanitizeSingleLine(form.elements['phone'] ? form.elements['phone'].value : '');
      var service = sanitizeSingleLine(form.elements['service'] ? form.elements['service'].value : '');
      var urgency = sanitizeSingleLine(form.elements['urgency'] ? form.elements['urgency'].value : '');
      var budget = sanitizeSingleLine(form.elements['budget'] ? form.elements['budget'].value : '');
      var subject = sanitizeSingleLine(form.elements['subject'] ? form.elements['subject'].value : '');
      var message = sanitizeString(form.elements['message'] ? form.elements['message'].value : '');
      var privacyConsent = form.elements['privacyConsent'] ? form.elements['privacyConsent'].checked : false;

      var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

      if (name.length < 2 || name.length > 100) {
        showStatus('Por favor ingresa un nombre válido (2 a 100 caracteres).', 'error');
        if (form.elements['name']) form.elements['name'].focus();
        return;
      }

      if (!emailRegex.test(email) || email.length > 150) {
        showStatus('Por favor introduce un correo electrónico válido.', 'error');
        if (form.elements['email']) form.elements['email'].focus();
        return;
      }

      if (phone && (phone.length > 25 || !/^[0-9+\-()\s.]{7,25}$/.test(phone))) {
        showStatus('Por favor introduce un número de teléfono o WhatsApp válido.', 'error');
        if (form.elements['phone']) form.elements['phone'].focus();
        return;
      }

      if (!ALLOWED_SERVICES.includes(service)) {
        showStatus('Por favor selecciona un servicio válido de la lista.', 'error');
        if (form.elements['service']) form.elements['service'].focus();
        return;
      }

      if (!ALLOWED_URGENCY.includes(urgency)) {
        showStatus('Por favor selecciona un plazo o urgencia de la lista.', 'error');
        if (form.elements['urgency']) form.elements['urgency'].focus();
        return;
      }

      if (budget && !ALLOWED_BUDGET.includes(budget)) {
        showStatus('Por favor selecciona una opción de presupuesto válida.', 'error');
        if (form.elements['budget']) form.elements['budget'].focus();
        return;
      }

      if (subject.length < 3 || subject.length > 120) {
        showStatus('El asunto debe contener entre 3 y 120 caracteres.', 'error');
        if (form.elements['subject']) form.elements['subject'].focus();
        return;
      }

      if (message.length < 10 || message.length > 3000) {
        showStatus('El mensaje debe contener entre 10 y 3,000 caracteres.', 'error');
        if (form.elements['message']) form.elements['message'].focus();
        return;
      }

      if (!privacyConsent) {
        showStatus('Debes aceptar el Aviso de Privacidad para continuar.', 'error');
        if (form.elements['privacyConsent']) form.elements['privacyConsent'].focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }
      if (statusEl) statusEl.style.display = 'none';

      // Validación de protocolo file:// (navegación sin servidor web)
      var isFileProtocol = window.location.protocol === 'file:';
      if (isFileProtocol) {
        showStatus(
          'ℹ️ Estás visualizando los archivos directamente en tu navegador (protocolo file://). ' +
          'Para probar el envío en vivo con Twenty CRM, inicia el servidor local ejecutando ' +
          '<code>python3 scripts/dev_server.py</code> en tu terminal y abre <code>http://localhost:8080</code>. ' +
          'También puedes contactarnos directo por WhatsApp (+52 664 426-7704).',
          'error',
          true
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar mensaje';
        }
        return;
      }

      var isDevServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      var targetEndpoint = isDevServer ? '/' : '/.netlify/functions/contacto';

      var payload = new URLSearchParams({
        'form-name': 'contacto',
        name: name,
        email: email,
        phone: phone,
        service: service,
        urgency: urgency,
        budget: budget,
        subject: subject,
        message: message
      }).toString();

      try {
        var res = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: payload
        });

        var resData = await res.json().catch(function () { return {}; });

        if (res.ok) {
          showStatus('✅ ¡Mensaje recibido y registrado con éxito! Nos comunicaremos dentro de 24 horas.', 'success');
          form.reset();
          setTimeout(function () {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Enviar mensaje';
            }
          }, 3500);
        } else {
          var errorMsg = resData.error || 'Error al procesar el mensaje en el servidor.';
          showStatus('⚠️ ' + errorMsg, 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reintentar envío';
          }
        }
      } catch (err) {
        console.error('Error de red al enviar formulario:', err);
        showStatus(
          '⚠️ No se pudo conectar con el servidor. Puedes escribirnos directamente a ' +
          '<a href="mailto:contacto@lessso.com?subject=Contacto%20LESSSO" style="text-decoration:underline;color:inherit;font-weight:600;">contacto@lessso.com</a> ' +
          'o vía <a href="https://wa.me/526644267704" target="_blank" rel="noopener" style="text-decoration:underline;color:inherit;font-weight:600;">WhatsApp (+52 664 426-7704)</a>.',
          'error',
          true
        );
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reintentar envío';
        }
      }
    });
  }

  /* ============ DOCK DE PRIVACIDAD & COOKIES ============ */
  function initPrivacyDock() {
    var dock = document.getElementById('siteNoticeDock');
    var closeBtn = document.getElementById('dockCloseBtn');
    var acceptBtn = document.getElementById('dockAcceptBtn');
    var rejectBtn = document.getElementById('dockRejectBtn');
    var openLink = document.getElementById('openSiteNotice');

    if (!dock) return;

    function setConsent(status) {
      writeStorage(SITE.consentStorageKey, status);
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('consent', 'update', {
            analytics_storage: status === 'granted' ? 'granted' : 'denied'
          });
        }
      } catch (e) {}
      dock.classList.remove('active');
    }

    if (acceptBtn) acceptBtn.addEventListener('click', function () { setConsent('granted'); });
    if (rejectBtn) rejectBtn.addEventListener('click', function () { setConsent('denied'); });
    if (closeBtn) closeBtn.addEventListener('click', function () { dock.classList.remove('active'); });

    if (openLink) {
      openLink.addEventListener('click', function (e) {
        e.preventDefault();
        dock.classList.add('active');
      });
    }

    var saved = readStorage(SITE.consentStorageKey);
    if (!saved) {
      setTimeout(function () {
        dock.classList.add('active');
      }, 600);
    }
  }

  /* ============ MODALES ============ */
  function initModals() {
    var ACTIVE_CLASS = 'active';
    document.querySelectorAll('[data-modal-open]').forEach(function (trigger) {
      var modal = document.getElementById(trigger.dataset.modalOpen);
      trigger.addEventListener('click', function () {
        if (modal) modal.classList.add(ACTIVE_CLASS);
      });
    });

    document.querySelectorAll('.modal').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.closest('[data-modal-close]')) {
          modal.classList.remove(ACTIVE_CLASS);
        }
      });
    });
  }

  /* ============ CHECKOUT DE SUSCRIPCIONES ============ */
  function initPlanCheckout() {
    document.querySelectorAll('[data-plan]').forEach(function (link) {
      var plan = SUBSCRIPTION_PLANS[link.dataset.plan];
      if (!plan || !plan.paymentLink) return;
      try {
        var url = new URL(plan.paymentLink);
        if (url.protocol === 'https:' && STRIPE_ALLOWED_HOSTS.includes(url.hostname)) {
          link.href = plan.paymentLink;
          link.removeAttribute('target');
          link.rel = 'noopener';
        }
      } catch (e) {}
    });
  }

  /* ============ INICIALIZACIÓN GLOBAL ============ */
  function initApp() {
    var themeToggle = document.getElementById('themeToggle');
    initTheme(themeToggle);

    var canvas = document.getElementById('canvas-bg');
    if (canvas) initNetworkCanvas(canvas);

    var header = document.getElementById('header');
    if (header) initHeaderScroll(header);

    initReveal();

    var slider = document.getElementById('projectsSlider');
    if (slider) initProjectsCarousel();

    var contactForm = document.getElementById('contactForm');
    if (contactForm) initContactForm(contactForm);

    initPlanCheckout();
    initPrivacyDock();
    initModals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
