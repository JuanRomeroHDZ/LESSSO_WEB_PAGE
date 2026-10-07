/* ============================================================
   CHECKOUT DE PLANES (STRIPE PAYMENT LINKS)
   Cada botón lleva data-plan="<id>". Si el plan tiene un
   Payment Link válido en config.js, el botón apunta a Stripe.
   Principios aplicados: DRY, Law of Demeter, ISP
   ============================================================ */

import { SUBSCRIPTION_PLANS, STRIPE_ALLOWED_HOSTS } from '../config.js';

/**
 * Valida que una URL pertenezca a los dominios seguros permitidos de Stripe.
 * @param {string} url
 * @param {readonly string[]} [allowedHosts]
 * @returns {boolean}
 */
export function isValidStripeLink(url, allowedHosts = STRIPE_ALLOWED_HOSTS) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && allowedHosts.includes(hostname);
  } catch {
    return false;
  }
}

/**
 * Vincula los enlaces de suscripción a Stripe dentro del contenedor raíz indicado.
 * @param {Document|HTMLElement} [root] Contenedor de búsqueda.
 */
export function initPlanCheckout(root = document) {
  root.querySelectorAll('[data-plan]').forEach((link) => {
    const planId = link.dataset.plan;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || !isValidStripeLink(plan.paymentLink)) return;

    link.href = plan.paymentLink;
    link.removeAttribute('target');
    link.rel = 'noopener';
  });
}
