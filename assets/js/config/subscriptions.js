/* ============================================================
   CONFIGURACIÓN DE SUSCRIPCIONES (STRIPE)
   Única fuente de verdad para los Payment Links de Stripe
   ============================================================ */

export const SUBSCRIPTION_PLANS = Object.freeze({
  basico: { paymentLink: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400' },
  esencial: { paymentLink: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400' },
  profesional: { paymentLink: 'https://buy.stripe.com/dRmfZjaWzcPP9AI5vk38402' },
  negocio: { paymentLink: 'https://buy.stripe.com/fZu7sNc0D5nncMU0b038401' },
});

/** Solo se aceptan enlaces oficiales de Stripe Checkout / Payment Links. */
export const STRIPE_ALLOWED_HOSTS = Object.freeze(['buy.stripe.com', 'checkout.stripe.com']);
