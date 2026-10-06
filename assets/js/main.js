/* ============================================================
   LESSSO — JavaScript Principal
   Modo claro/oscuro, red interactiva en canvas, header, modal y contacto
   ============================================================ */

/* 1. TEMA CLARO / OSCURO */
const root = document.documentElement;
const themeColors = { dark: '#0c0a09', light: '#fafaf9' };

function applyTheme(t) {
  root.setAttribute('data-theme', t);
  const metaTheme = document.getElementById('metaTheme');
  if (metaTheme) metaTheme.setAttribute('content', themeColors[t]);
  try { localStorage.setItem('lessso-theme', t); } catch (e) {}
  if (typeof drawNetworkCanvas === 'function') {
    drawNetworkCanvas();
  }
}

function initTheme() {
  let t = null;
  try { t = localStorage.getItem('lessso-theme'); } catch (e) {}
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(t);
}

/* 2. CANVAS ANIMATION — Red de partículas */
let canvas, ctx;
let nodes = [];
let animationId;

function getCanvasColors() {
  const isDark = root.getAttribute('data-theme') === 'dark';
  return {
    node: isDark ? '#1a9e9e' : '#09363c',
    line: isDark ? 'rgba(26, 158, 158, 0.15)' : 'rgba(9, 54, 60, 0.1)',
    particle: isDark ? 'rgba(26, 158, 158, 0.3)' : 'rgba(9, 54, 60, 0.2)'
  };
}

function resizeCanvas() {
  if (!canvas || !canvas.parentElement) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  initNodes();
}

function initNodes() {
  if (!canvas) return;
  nodes = [];
  const count = Math.min(8, Math.max(4, Math.floor(canvas.width / 200)));
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 2 + Math.random() * 1.5
    });
  }
}

function drawNetworkCanvas() {
  if (!canvas || !ctx) return;
  const colors = getCanvasColors();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.node;
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 0.8;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    n.x += n.vx;
    n.y += n.vy;

    if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
    if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

    n.x = Math.max(0, Math.min(canvas.width, n.x));
    n.y = Math.max(0, Math.min(canvas.height, n.y));

    for (let j = i + 1; j < nodes.length; j++) {
      const n2 = nodes[j];
      const dx = n2.x - n.x;
      const dy = n2.y - n.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        ctx.globalAlpha = 1 - dist / 150;
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

  if (animationId) cancelAnimationFrame(animationId);
  animationId = requestAnimationFrame(drawNetworkCanvas);
}

/* Timestamp para detección de bots por tiempo (OWASP Anti-Automation) */
const formLoadTime = Date.now();

/* Funciones de saneamiento y validación OWASP Top 10 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/\0/g, '') // Eliminar null bytes
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .trim();
}

function sanitizeSingleLine(str) {
  if (typeof str !== 'string') return '';
  return sanitizeInput(str)
    .replace(/[\r\n\t]/g, ' ') // Prevenir CRLF injection / SMTP header splitting
    .replace(/\s+/g, ' ');
}

const ALLOWED_SERVICES = [
  'Auditoría de Seguridad & Pentesting',
  'Desarrollo Web a la Medida',
  'Suscripción Mensual de Página Web',
  'Hardening & Seguridad de Servidores',
  'Capacitación en Ciberseguridad',
  'Cotización General o Duda'
];

const ALLOWED_URGENCY = [
  'Inmediato / Menos de 1 mes',
  '1 a 3 meses',
  'Solo explorando opciones'
];

/* 3. MANEJADOR DEL FORMULARIO DE CONTACTO (OWASP Top 10 + Netlify Resiliente) */
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  // 1. Detección de bots por tiempo (si se envió en menos de 2 segundos, probable bot)
  if (Date.now() - formLoadTime < 1800) {
    console.warn('[Seguridad] Envío bloqueado por velocidad excesiva (Anti-bot).');
    if (statusEl) {
      statusEl.textContent = '⚠️ Envío detectado como automatizado. Por favor intenta de nuevo.';
      statusEl.className = 'form-status error';
      statusEl.style.display = 'block';
    }
    return;
  }

  // 2. Comprobación de honeypot (OWASP Anti-Automation)
  const botField = form.querySelector('[name="bot-field"]');
  if (botField && botField.value.trim() !== '') {
    console.warn('[Seguridad] Honeypot activado. Rechazando envío.');
    if (statusEl) {
      statusEl.textContent = '✅ Mensaje procesado.';
      statusEl.className = 'form-status success';
      statusEl.style.display = 'block';
    }
    form.reset();
    return;
  }

  // 3. Extracción y Saneamiento riguroso de entradas
  const nameRaw = sanitizeSingleLine(form.elements['name']?.value || '');
  const emailRaw = sanitizeSingleLine(form.elements['email']?.value || '');
  const phoneRaw = sanitizeSingleLine(form.elements['phone']?.value || '');
  const serviceRaw = sanitizeSingleLine(form.elements['service']?.value || '');
  const urgencyRaw = sanitizeSingleLine(form.elements['urgency']?.value || '');
  const subjectRaw = sanitizeSingleLine(form.elements['subject']?.value || '');
  const messageRaw = sanitizeInput(form.elements['message']?.value || '');
  const privacyConsent = form.elements['privacyConsent']?.checked;

  // 4. Validaciones estrictas de reglas de negocio y seguridad
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (nameRaw.length < 2 || nameRaw.length > 100) {
    showStatus('Por favor ingresa un nombre válido (2 a 100 caracteres).', 'error');
    form.elements['name']?.focus();
    return;
  }

  if (!emailRegex.test(emailRaw) || emailRaw.length > 150) {
    showStatus('Por favor introduce un correo electrónico válido.', 'error');
    form.elements['email']?.focus();
    return;
  }

  if (phoneRaw && (phoneRaw.length > 25 || !/^[0-9+\-()\s.]{7,25}$/.test(phoneRaw))) {
    showStatus('Por favor introduce un número de teléfono o WhatsApp válido.', 'error');
    form.elements['phone']?.focus();
    return;
  }

  if (!ALLOWED_SERVICES.some(s => serviceRaw.startsWith(s.split(' ')[0]))) {
    showStatus('Por favor selecciona un servicio válido de la lista.', 'error');
    form.elements['service']?.focus();
    return;
  }

  if (subjectRaw.length < 3 || subjectRaw.length > 120) {
    showStatus('Por favor ingresa un asunto entre 3 y 120 caracteres.', 'error');
    form.elements['subject']?.focus();
    return;
  }

  if (messageRaw.length < 10 || messageRaw.length > 3000) {
    showStatus('El mensaje debe contener entre 10 y 3,000 caracteres.', 'error');
    form.elements['message']?.focus();
    return;
  }

  if (!privacyConsent) {
    showStatus('Debes aceptar el Aviso de Privacidad para continuar.', 'error');
    form.elements['privacyConsent']?.focus();
    return;
  }

  function showStatus(msg, type) {
    if (!statusEl) return;
    statusEl.innerHTML = msg;
    statusEl.className = `form-status ${type}`;
    statusEl.style.display = 'block';
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
  }
  if (statusEl) statusEl.style.display = 'none';

  // 5. Construcción de carga de datos codificada
  const formData = new FormData(form);
  formData.set('name', nameRaw);
  formData.set('email', emailRaw);
  formData.set('phone', phoneRaw);
  formData.set('service', serviceRaw);
  formData.set('urgency', urgencyRaw);
  formData.set('subject', subjectRaw);
  formData.set('message', messageRaw);
  formData.set('form-name', 'contacto');

  // En entorno local (localhost o file://), simulamos éxito sin 404
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
    setTimeout(() => {
      showStatus('✅ [MODO LOCAL] Mensaje validado y enviado con éxito.', 'success');
      form.reset();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar mensaje';
      }
    }, 700);
    return;
  }

  const encodedBody = new URLSearchParams(formData).toString();

  // 6. Intento de envío a Netlify con fallback de ruta
  try {
    let response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodedBody
    });

    // Fallback: si '/' retorna 404, intentar con '/index.html'
    if (response.status === 404) {
      console.warn('POST a "/" devolvió 404, reintentando en "/index.html"...');
      response = await fetch('/index.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodedBody
      });
    }

    if (response.ok) {
      showStatus('✅ ¡Mensaje recibido con éxito! Nos comunicaremos dentro de 24 horas.', 'success');
      form.reset();
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar mensaje';
        }
      }, 4000);
    } else {
      throw new Error(`Servidor respondió con código ${response.status}`);
    }
  } catch (error) {
    console.error('Error al enviar formulario:', error);
    showStatus(
      '⚠️ No se pudo procesar el envío automático (código 404). Puedes escribirnos directamente a ' +
      '<a href="mailto:contacto@lessso.com?subject=Contacto%20LESSSO" style="text-decoration:underline;color:inherit;font-weight:600;">contacto@lessso.com</a> ' +
      'o enviarnos un mensaje por <a href="https://wa.me/526644267704" target="_blank" rel="noopener" style="text-decoration:underline;color:inherit;font-weight:600;">WhatsApp (+52 664 426-7704)</a>.',
      'error'
    );
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Reintentar envío';
    }
  }
}
window.handleFormSubmit = handleFormSubmit;

/* 4. GESTIÓN DE CONSENTIMIENTO DE PRIVACIDAD & MÉTRICAS (Resistente a Brave / Adblockers) */
function initCookieConsent() {
  const banner = document.getElementById('privacyConsentBanner') || document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('consentAcceptBtn') || document.getElementById('cookieAccept');
  const rejectBtn = document.getElementById('consentRejectBtn') || document.getElementById('cookieReject');
  const openPrefsBtn = document.getElementById('openPrivacySettings') || document.getElementById('openCookieBanner');

  let currentConsent = null;
  try {
    currentConsent = localStorage.getItem('lessso-privacy-consent') || localStorage.getItem('lessso-cookie-consent');
  } catch (e) {
    console.warn('[Privacidad] Acceso a localStorage restringido por el navegador.');
  }

  // Si no ha decidido y existe el contenedor, lo mostramos
  if (!currentConsent && banner) {
    banner.classList.add('active');
  }

  function setConsent(status) {
    try {
      localStorage.setItem('lessso-privacy-consent', status);
      localStorage.setItem('lessso-cookie-consent', status);
    } catch (e) {}

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: status === 'granted' ? 'granted' : 'denied'
        });
      }
    } catch (e) {}

    if (banner) {
      banner.classList.remove('active');
    }
  }

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => setConsent('granted'));
  }

  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => setConsent('denied'));
  }

  if (openPrefsBtn) {
    openPrefsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (banner) banner.classList.add('active');
    });
  }
}

/* 5. INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO */
function initAll() {
  initTheme();
  initCookieConsent();

  // Botón de alternar tema
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  // Canvas
  canvas = document.getElementById('canvas-bg');
  if (canvas) {
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    drawNetworkCanvas();
  }

  // Header scroll
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
    header.classList.toggle('scrolled', window.scrollY > 30);
  }

  // Reveal animations
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  }

  // Cerrar modal al clickear afuera
  const contactModal = document.getElementById('contactModal');
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target.id === 'contactModal') {
        contactModal.classList.remove('active');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

