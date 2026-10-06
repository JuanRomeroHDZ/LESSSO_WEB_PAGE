/* ============================================================
   CHECKOUT DE PLANES (STRIPE PAYMENT LINKS)
   Cada botón lleva data-plan="<id>". Si el plan tiene un
   Payment Link válido en config/subscriptions.js, el botón
   apunta a Stripe; si no, conserva su href de respaldo.
   ============================================================ */
import { SUBSCRIPTION_PLANS, STRIPE_ALLOWED_HOSTS } from '../config/subscriptions.js';

function isValidStripeLink(url) {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && STRIPE_ALLOWED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

export function initPlanCheckout(root = document) {
  root.querySelectorAll('[data-plan]').forEach((link) => {
    const plan = SUBSCRIPTION_PLANS[link.dataset.plan];
    if (!plan || !isValidStripeLink(plan.paymentLink)) return;

    link.href = plan.paymentLink;
    link.removeAttribute('target');
    link.rel = 'noopener';
  });
}
