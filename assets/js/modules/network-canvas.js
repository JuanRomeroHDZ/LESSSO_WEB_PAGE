/* ============================================================
   CANVAS ANIMATION — Red sutil de fondo
   ============================================================ */
import { CANVAS_PALETTE } from '../config/site.js';
import { getTheme, THEME_CHANGE_EVENT } from './theme.js';

const LINK_DISTANCE = 150;

/**
 * Dibuja nodos que se mueven y se conectan cuando están cerca.
 * Se ejecuta un único ciclo de animación; los colores se actualizan
 * al escuchar el evento de cambio de tema.
 * @param {HTMLCanvasElement|null} canvas
 */
export function initNetworkCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let nodes = [];
  let colors = CANVAS_PALETTE[getTheme()];

  function initNodes() {
    nodes = [];
    const count = Math.min(8, Math.max(4, Math.floor(canvas.width / 200)));
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 2 + Math.random() * 1.5,
      });
    }
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    initNodes();
  }

  function draw() {
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

    requestAnimationFrame(draw);
  }

  document.addEventListener(THEME_CHANGE_EVENT, (e) => {
    colors = CANVAS_PALETTE[e.detail.theme];
  });
  window.addEventListener('resize', resize);

  resize();
  requestAnimationFrame(draw);
}
