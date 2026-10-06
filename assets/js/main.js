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

/* 3. MANEJADOR DEL FORMULARIO DE CONTACTO */
function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.querySelector('#name') ? form.querySelector('#name').value : '';
  const email = form.querySelector('#email') ? form.querySelector('#email').value : '';
  const subject = form.querySelector('#subject') ? form.querySelector('#subject').value : '';
  const message = form.querySelector('#message') ? form.querySelector('#message').value : '';

  // Enviar por mailto como fallback
  const mailtoLink = `mailto:contacto@lessso.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${message}`)}`;
  window.location.href = mailtoLink;

  // Cerrar modal si existe
  const contactModal = document.getElementById('contactModal');
  if (contactModal) {
    setTimeout(() => {
      contactModal.classList.remove('active');
      form.reset();
    }, 500);
  }
}
window.handleFormSubmit = handleFormSubmit;

/* 4. INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO */
function initAll() {
  initTheme();

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
