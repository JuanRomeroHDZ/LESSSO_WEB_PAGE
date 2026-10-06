// Netlify Serverless Function — Endpoint de contacto con blindaje OWASP
// ======================================================================

exports.handler = async function (event, context) {
  // Configurar cabeceras CORS seguras
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido. Solo se acepta POST.' })
    };
  }

  try {
    let data = {};

    // Soportar tanto urlencoded como application/json
    const contentType = event.headers['content-type'] || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(event.body || '');
      data = Object.fromEntries(params.entries());
    } else {
      data = JSON.parse(event.body || '{}');
    }

    // OWASP: Comprobación de Honeypot
    if (data['bot-field'] && data['bot-field'].trim() !== '') {
      console.warn('[Seguridad Function] Honeypot activado. Descartando.');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, message: 'Recibido correctamente.' })
      };
    }

    // Saneamiento básico
    const name = (data.name || '').trim().slice(0, 100);
    const email = (data.email || '').trim().slice(0, 150);
    const phone = (data.phone || '').trim().slice(0, 25);
    const service = (data.service || '').trim().slice(0, 120);
    const urgency = (data.urgency || '').trim().slice(0, 80);
    const budget = (data.budget || '').trim().slice(0, 80);
    const subject = (data.subject || '').trim().slice(0, 120);
    const message = (data.message || '').trim().slice(0, 3000);

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Faltan campos obligatorios (nombre, correo o mensaje).' })
      };
    }

    console.log('[Nuevo Contacto Recibido]', {
      name,
      email,
      phone,
      service,
      urgency,
      budget,
      subject,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        message: '¡Mensaje recibido con éxito! Nos comunicaremos contigo pronto.'
      })
    };
  } catch (err) {
    console.error('[Error en función de contacto]', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor procesando el mensaje.' })
    };
  }
};
