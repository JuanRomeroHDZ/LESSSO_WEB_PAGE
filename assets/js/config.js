/* ============================================================
   CONFIGURACIÓN CENTRALIZADA LESSSO (Fuente Única de Verdad)
   Principios aplicados: DRY, Single Source of Truth, Immutability
   ============================================================ */

export const CONFIG = Object.freeze({
  site: Object.freeze({
    contactEmail: 'contacto@lessso.com',
    themeStorageKey: 'lessso-theme',
    consentStorageKey: 'lessso-cookie-consent',
  }),
  themeMetaColors: Object.freeze({
    dark: '#0b0f19',
    light: '#ffffff',
  }),
  canvasPalette: Object.freeze({
    dark: { node: '#38bdf8', line: 'rgba(56, 189, 248, 0.22)' },
    light: { node: '#0284c7', line: 'rgba(2, 132, 199, 0.18)' },
  }),
  stripeAllowedHosts: Object.freeze(['buy.stripe.com', 'checkout.stripe.com']),
  plans: Object.freeze({
    basico: Object.freeze({
      name: 'Básico',
      price: 799,
      currency: 'MXN',
      period: 'mes',
      paymentLink: 'https://buy.stripe.com/6oUfZj7Kn2bbbIQ2j838400',
    }),
    profesional: Object.freeze({
      name: 'Profesional',
      price: 1499,
      currency: 'MXN',
      period: 'mes',
      paymentLink: 'https://buy.stripe.com/dRmfZjaWzcPP9AI5vk38402',
    }),
    negocio: Object.freeze({
      name: 'Negocio',
      price: 2499,
      currency: 'MXN',
      period: 'mes',
      paymentLink: 'https://buy.stripe.com/fZu7sNc0D5nncMU0b038401',
    }),
  }),
  budgetOptions: Object.freeze([
    '',
    'Plan por Suscripción',
    'Proyecto Inicial',
    'Proyecto Profesional',
    'Proyecto Avanzado',
    'A la Medida / Por definir',
    'Suscripción Web',
    'Suscripción Web ($799 - $2,499 MXN/mes)',
    'Menos de $10,000 MXN',
    '$10,000 a $25,000 MXN',
    '$25,000 a $50,000 MXN',
    'Más de $50,000 MXN',
    'Por definir / Explorando',
  ]),
  services: Object.freeze([
    'Desarrollo Web a la Medida',
    'Suscripción Mensual de Página Web',
    'Mantenimiento o Actualización Web',
    'E-commerce / Tienda en Línea',
    'Infraestructura & Servidores Linux',
    'Seguridad Web & Hardening',
    'Cotización General o Duda',
  ]),
  urgencyOptions: Object.freeze([
    'Inmediato / Menos de 1 mes',
    '1 a 3 meses',
    'Solo explorando opciones',
  ]),
});

// Re-exportaciones nombradas para consumo ergonómico y tipado
export const SITE = CONFIG.site;
export const THEME_META_COLORS = CONFIG.themeMetaColors;
export const CANVAS_PALETTE = CONFIG.canvasPalette;
export const STRIPE_ALLOWED_HOSTS = CONFIG.stripeAllowedHosts;
export const SUBSCRIPTION_PLANS = CONFIG.plans;
export const BUDGET_OPTIONS = CONFIG.budgetOptions;
export const SERVICES = CONFIG.services;
export const URGENCY_OPTIONS = CONFIG.urgencyOptions;
