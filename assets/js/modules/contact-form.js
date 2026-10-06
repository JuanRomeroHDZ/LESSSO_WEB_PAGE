/* ============================================================
   FORMULARIO DE CONTACTO (Arquitectura Unificada)
   - Un solo flujo seguro: Formulario -> Validación -> /.netlify/functions/contacto
   - Validación y saneamiento riguroso de entradas
   - Filtro de teléfono puramente en JS (sin oninput inline)
   - Mensajes con textContent y fallback estructurado
   ============================================================ */

const ALLOWED_SERVICES = [
  'Auditoría de Seguridad & Pentesting',
  'Desarrollo Web a la Medida',
  'Suscripción Mensual de Página Web',
  'Hardening & Seguridad de Servidores',
  'Capacitación en Ciberseguridad',
  'Cotización General o Duda'
];

const ALLOWED_URGENCY = [
  'Inmediato / Menos de 1 mes',
  '1 a 3 meses',
  'Solo explorando opciones'
];

const ALLOWED_BUDGET = [
  '',
  'Suscripción Web ($799 - $2,499 MXN/mes)',
  'Menos de $10,000 MXN',
  '$10,000 a $25,000 MXN',
  '$25,000 a $50,000 MXN',
  'Más de $50,000 MXN',
  'Por definir / Explorando'
];

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\0/g, '').trim();
}

function sanitizeSingleLine(str) {
  return sanitizeString(str).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');
}

export function initContactForm(form) {
  if (!form) return;

  const phoneInput = form.querySelector('#phone');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  // Restricción de teléfono: bloquear letras en tiempo real puramente en JS
  if (phoneInput) {
    phoneInput.addEventListener('keydown', (e) => {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/[0-9+\s\-()]/.test(e.key)) {
        e.preventDefault();
      }
    });

    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^0-9+\s\-()]/g, '');
    });
  }

  function showStatus(msg, type, isHtml = false) {
    if (!statusEl) return;
    if (isHtml) {
      statusEl.innerHTML = msg;
    } else {
      statusEl.textContent = msg;
    }
    statusEl.className = `form-status ${type}`;
    statusEl.style.display = 'block';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // 1. Honeypot check en cliente
    const botField = form.querySelector('[name="bot-field"]');
    if (botField && botField.value.trim() !== '') {
      showStatus('✅ Mensaje procesado.', 'success');
      form.reset();
      return;
    }

    // 2. Extracción y saneamiento
    const name = sanitizeSingleLine(form.elements['name']?.value || '');
    const email = sanitizeSingleLine(form.elements['email']?.value || '');
    const phone = sanitizeSingleLine(form.elements['phone']?.value || '');
    const service = sanitizeSingleLine(form.elements['service']?.value || '');
    const urgency = sanitizeSingleLine(form.elements['urgency']?.value || '');
    const budget = sanitizeSingleLine(form.elements['budget']?.value || '');
    const subject = sanitizeSingleLine(form.elements['subject']?.value || '');
    const message = sanitizeString(form.elements['message']?.value || '');
    const privacyConsent = form.elements['privacyConsent']?.checked;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    if (name.length < 2 || name.length > 100) {
      showStatus('Por favor ingresa un nombre válido (2 a 100 caracteres).', 'error');
      form.elements['name']?.focus();
      return;
    }

    if (!emailRegex.test(email) || email.length > 150) {
      showStatus('Por favor introduce un correo electrónico válido.', 'error');
      form.elements['email']?.focus();
      return;
    }

    if (phone && (phone.length > 25 || !/^[0-9+\-()\s.]{7,25}$/.test(phone))) {
      showStatus('Por favor introduce un número de teléfono o WhatsApp válido.', 'error');
      form.elements['phone']?.focus();
      return;
    }

    if (!ALLOWED_SERVICES.includes(service)) {
      showStatus('Por favor selecciona un servicio válido de la lista.', 'error');
      form.elements['service']?.focus();
      return;
    }

    if (!ALLOWED_URGENCY.includes(urgency)) {
      showStatus('Por favor selecciona un plazo o urgencia de la lista.', 'error');
      form.elements['urgency']?.focus();
      return;
    }

    if (budget && !ALLOWED_BUDGET.includes(budget)) {
      showStatus('Por favor selecciona una opción de presupuesto válida.', 'error');
      form.elements['budget']?.focus();
      return;
    }

    if (subject.length < 3 || subject.length > 120) {
      showStatus('El asunto debe contener entre 3 y 120 caracteres.', 'error');
      form.elements['subject']?.focus();
      return;
    }

    if (message.length < 10 || message.length > 3000) {
      showStatus('El mensaje debe contener entre 10 y 3,000 caracteres.', 'error');
      form.elements['message']?.focus();
      return;
    }

    if (!privacyConsent) {
      showStatus('Debes aceptar el Aviso de Privacidad para continuar.', 'error');
      form.elements['privacyConsent']?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }
    if (statusEl) statusEl.style.display = 'none';

    // 3. Envío al endpoint unificado
    // Si estamos en localhost y corre dev_server.py en puerto 8080, POST a '/' maneja Twenty CRM directo
    const isDevServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const targetEndpoint = isDevServer ? '/' : '/.netlify/functions/contacto';

    const payload = new URLSearchParams({
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

    try {
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: payload
      });

      const resData = await res.json().catch(() => ({}));

      if (res.ok) {
        showStatus('✅ ¡Mensaje recibido y registrado con éxito! Nos comunicaremos dentro de 24 horas.', 'success');
        form.reset();
        setTimeout(() => {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar mensaje';
          }
        }, 3500);
      } else {
        const errorMsg = resData.error || 'Error al procesar el mensaje en el servidor.';
        showStatus(`⚠️ ${errorMsg}`, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Reintentar envío';
        }
      }
    } catch (err) {
      console.error('Error de red al enviar formulario:', err);
      showStatus(
        '⚠️ No se pudo conectar con el servidor. Puedes escribirnos directamente a ' +
        '<a href="mailto:contacto@lessso.com?subject=Contacto%20LESSSO" style="text-decoration:underline;color:inherit;font-weight:600;">contacto@lessso.com</a> ' +
        'o vía <a href="https://wa.me/526644267704" target="_blank" rel="noopener" style="text-decoration:underline;color:inherit;font-weight:600;">WhatsApp (+52 664 426-7704)</a>.',
        'error',
        true
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reintentar envío';
      }
    }
  });
}
