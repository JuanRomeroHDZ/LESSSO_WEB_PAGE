/* ============================================================
   CONFIGURACIÓN DE SUSCRIPCIONES (STRIPE)
   ------------------------------------------------------------
   Cómo conectar Stripe sin backend:
   1. Stripe Dashboard → Catálogo de productos → crea un producto
      por plan con precio recurrente (mensual).
   2. Stripe Dashboard → Payment Links → crea un enlace por plan.
   3. Pega cada URL (https://buy.stripe.com/...) en `paymentLink`.

   Mientras `paymentLink` esté vacío, el botón del plan conserva el
   enlace de respaldo definido en el HTML (WhatsApp).
   ============================================================ */

export const SUBSCRIPTION_PLANS = Object.freeze({
  esencial: { paymentLink: '' },
  profesional: { paymentLink: '' },
  negocio: { paymentLink: '' },
});

/** Solo se aceptan enlaces oficiales de Stripe Checkout / Payment Links. */
export const STRIPE_ALLOWED_HOSTS = Object.freeze(['buy.stripe.com', 'checkout.stripe.com']);
