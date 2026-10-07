/* ============================================================
   CANVAS ANIMATION — Red sutil de fondo (Optimizado)
   - Pausa cuando la pestaña está inactiva (document.hidden)
   - Respeta prefers-reduced-motion
   - Principios: DRY (importa paleta desde config.js), SRP
   ============================================================ */

import { CANVAS_PALETTE } from '../config.js';
import { getTheme, THEME_CHANGE_EVENT } from './theme.js';

const LINK_DISTANCE = 150;

export function initNetworkCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let nodes = [];
  let colors = CANVAS_PALETTE[getTheme()] || CANVAS_PALETTE.light;
  let animationId = null;
  let isRunning = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function initNodes() {
    nodes = [];
    const count = Math.min(8, Math.max(4, Math.floor(canvas.width / 200)));
    for (let i = 0; i < count; i++) {
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
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initNodes();
    if (prefersReducedMotion.matches) {
      renderFrame(); // Dibujar solo un cuadro estático si prefiere movimiento reducido
    }
  }

  function renderFrame() {
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
    if (isRunning || prefersReducedMotion.matches || document.hidden) return;
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

  // Pausar cuando la pestaña esté oculta o en segundo plano
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  document.addEventListener(THEME_CHANGE_EVENT, (e) => {
    colors = CANVAS_PALETTE[e.detail.theme] || CANVAS_PALETTE.light;
    if (prefersReducedMotion.matches) renderFrame();
  });

  window.addEventListener('resize', resize, { passive: true });

  resize();
  if (!prefersReducedMotion.matches && !document.hidden) {
    startAnimation();
  }
}
