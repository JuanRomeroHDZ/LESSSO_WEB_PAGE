/* ============================================================
   SUSCRIPCIONES — LESSSO
   Configuración de Stripe Payment Links y lógica interactiva
   ============================================================ */

/* 1. CONFIGURACIÓN DE STRIPE PAYMENT LINKS
   Enlaces oficiales generados en Stripe (Modo Test).
   Para cambiar a producción más adelante, solo reemplaza los links. */
const STRIPE_PLANS = {
  prueba: 'https://buy.stripe.com/test_14AdR8gGi8nX0406HEcV200',      // Plan Oculto $0 (Para pruebas / borrar después)
  esencial: 'https://buy.stripe.com/test_cNi3cudu6eMlaIE9TQcV201',    // Plan $799 MXN
  profesional: 'https://buy.stripe.com/test_fZu9ASfCefQp1846HEcV202', // Plan $1,499 MXN
  negocio: 'https://buy.stripe.com/test_cNifZgeya33D040c1YcV203'      // Plan $2,499 MXN
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
