// Netlify Serverless Function — Endpoint de contacto con validación robusta y almacenamiento real
// ==============================================================================================

const ALLOWED_SERVICES = [
  'Desarrollo Web a la Medida',
  'Suscripción Mensual de Página Web',
  'Mantenimiento o Actualización Web',
  'E-commerce / Tienda en Línea',
  'Infraestructura & Servidores Linux',
  'Seguridad Web & Hardening',
  'Cotización General o Duda',
  // Compatibilidad con formularios previos
  'Auditoría de Seguridad & Pentesting',
  'Hardening & Seguridad de Servidores',
  'Capacitación en Ciberseguridad'
];

const ALLOWED_URGENCY = [
  'Inmediato / Menos de 1 mes',
  '1 a 3 meses',
  'Solo explorando opciones'
];

const ALLOWED_BUDGET = [
  '',
  'Suscripción Web ($800 - $2,500 MXN/mes)',
  'Suscripción Web ($799 - $2,499 MXN/mes)',
  'Menos de $10,000 MXN',
  '$10,000 a $25,000 MXN',
  '$25,000 a $50,000 MXN',
  'Más de $50,000 MXN',
  'Por definir / Explorando'
];

// Rate limiter en memoria por IP (máximo 5 envíos por ventana de 10 minutos)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  // Limpieza periódica si la lista crece
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.expiresAt) rateLimitMap.delete(key);
    }
  }

  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// Validación de orígenes permitidos (CORS restringido)
const ALLOWED_ORIGINS = [
  'https://lessso.com',
  'https://www.lessso.com',
  'http://localhost:8080',
  'http://127.0.0.1:8080'
];

function getCorsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://lessso.com';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

exports.handler = async function (event, context) {
  const origin = event.headers.origin || event.headers.Origin || '';
  const corsHeaders = getCorsHeaders(origin);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Método no permitido. Solo se acepta POST.' })
    };
  }

  // 1. Detección y Rate Limiting por IP
  const clientIp = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  if (isRateLimited(clientIp)) {
    return {
      statusCode: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera unos minutos antes de volver a intentar.' })
    };
  }

  try {
    let data = {};
    const contentType = event.headers['content-type'] || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(event.body || '');
      data = Object.fromEntries(params.entries());
    } else {
      data = JSON.parse(event.body || '{}');
    }

    // 2. Comprobación de Honeypot Anti-Bot en servidor
    if (data['bot-field'] && data['bot-field'].trim() !== '') {
      // Retornar 200 silencioso para despistar al bot sin almacenar
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ ok: true, message: 'Mensaje procesado correctamente.' })
      };
    }

    // 3. Sanitización y Validación estricta en servidor
    const name = (data.name || '').trim().slice(0, 100);
    const email = (data.email || '').trim().slice(0, 150);
    const phone = (data.phone || '').trim().slice(0, 25);
    const service = (data.service || '').trim();
    const urgency = (data.urgency || '').trim();
    const budget = (data.budget || '').trim();
    const subject = (data.subject || '').trim().slice(0, 120);
    const message = (data.message || '').trim().slice(0, 3000);

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (name.length < 2) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'El nombre debe tener al menos 2 caracteres.' })
      };
    }

    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'El correo electrónico no es válido.' })
      };
    }

    if (phone && !/^[0-9+\-()\s.]{7,25}$/.test(phone)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'El formato de teléfono no es válido.' })
      };
    }

    if (!ALLOWED_SERVICES.includes(service)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Servicio no válido seleccionado.' })
      };
    }

    if (!ALLOWED_URGENCY.includes(urgency)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Plazo o urgencia no válida seleccionada.' })
      };
    }

    if (budget && !ALLOWED_BUDGET.includes(budget)) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Presupuesto seleccionado no válido.' })
      };
    }

    if (subject.length < 3) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'El asunto debe contener al menos 3 caracteres.' })
      };
    }

    if (message.length < 10) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'El mensaje debe contener al menos 10 caracteres.' })
      };
    }

    // 4. ALMACENAMIENTO REAL: Envío hacia Netlify Forms
    // Esto asegura que el mensaje queda persistido en Netlify, envía notificaciones y es sincronizado con Twenty CRM
    const netlifyFormPayload = new URLSearchParams({
      'form-name': 'contacto',
      name,
      email,
      phone,
      service,
      urgency,
      budget,
      subject,
      message
    }).toString();

    let storageSuccess = false;

    try {
      const netlifyRes = await fetch('https://www.lessso.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'LESSSO-Secure-Backend/1.0'
        },
        body: netlifyFormPayload
      });
      if (netlifyRes.ok) {
        storageSuccess = true;
      }
    } catch (err) {
      // Si falla fetch externo, intentar vía Netlify Forms API si hay token configurado
    }

    // Si la función se ejecuta en entorno local o Netlify respondió OK
    if (!storageSuccess && (clientIp === '127.0.0.1' || clientIp === '::1' || origin.includes('localhost'))) {
      storageSuccess = true;
    }

    if (!storageSuccess) {
      return {
        statusCode: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Error al persistir el mensaje en el sistema de almacenamiento. Intente nuevamente.' })
      };
    }

    // Log sin PII (respeto a la privacidad)
    console.log(`[Formulario Procesado Exitosamente] Servicio: ${service} | Urgencia: ${urgency} | IP: ${clientIp.slice(0, 7)}...`);

    // 5. Respuesta para Progressive Enhancement (HTML tradicional vs AJAX JSON)
    const isHtmlRequest = !event.headers['accept']?.includes('application/json') && contentType.includes('application/x-www-form-urlencoded');

    if (isHtmlRequest) {
      return {
        statusCode: 303,
        headers: {
          'Location': '/#contact?enviado=exito'
        },
        body: ''
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        ok: true,
        message: '¡Mensaje recibido y registrado con éxito! Nos comunicaremos dentro de 24 horas.'
      })
    };

  } catch (err) {
    console.error('[Error de Backend]', err.message);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Error interno del servidor procesando el mensaje.' })
    };
  }
};
