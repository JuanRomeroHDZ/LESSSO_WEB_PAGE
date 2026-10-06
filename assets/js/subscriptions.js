/* ============================================================
   SUSCRIPCIONES — LESSSO
   Configuración de Stripe Payment Links y lógica interactiva
   ============================================================ */

/* 1. CONFIGURACIÓN DE STRIPE PAYMENT LINKS
   Enlaces oficiales de producción en Stripe. */
const STRIPE_PLANS = {
  esencial: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400',       // Plan $799 MXN
  profesional: 'https://buy.stripe.com/dRmfZjaWzcPP9AI5vk38402',    // Plan $1,499 MXN
  negocio: 'https://buy.stripe.com/fZu7sNc0D5nncMU0b038401'         // Plan $2,499 MXN
};

// Asignar enlaces de Stripe si están configurados
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-plan]').forEach(link => {
    const planKey = link.getAttribute('data-plan');
    const stripeUrl = STRIPE_PLANS[planKey];
    if (stripeUrl && stripeUrl.startsWith('https://')) {
      link.href = stripeUrl;
      link.removeAttribute('target'); // Lleva al checkout en la misma pestaña de forma limpia
    }
  });
});
