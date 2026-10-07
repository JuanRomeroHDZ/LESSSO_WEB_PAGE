/* ============================================================
   FORMULARIO DE CONTACTO (Arquitectura Modular y Segura)
   Principios aplicados:
   - SOLID (SRP: validación pura aislada de UI; OCP: reglas extensibles)
   - DRY: consume opciones y listas desde CONFIG
   - Law of Demeter: consultas DOM acotadas al contenedor del formulario
   - KISS: flujo predecible con manejo amigable de fallos
   ============================================================ */

import { SERVICES, URGENCY_OPTIONS, BUDGET_OPTIONS } from '../config.js';

/**
 * Sanitiza cadenas de texto eliminando caracteres nulos y espacios residuales.
 * @param {unknown} str
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\0/g, '').trim();
}

/**
 * Sanitiza cadenas a una sola línea (para campos como nombre, email, teléfono, asunto).
 * @param {unknown} str
 * @returns {string}
 */
export function sanitizeSingleLine(str) {
  return sanitizeString(str).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Validador puro de datos del formulario de contacto (SRP).
 * Sin efectos secundarios ni dependencias de DOM.
 * @param {Object} data Datos saneados del formulario.
 * @param {Object} [options] Listas permitidas opcionales para extensión (OCP).
 * @returns {{ isValid: boolean, error?: string, field?: string }}
 */
export function validateContactFormData(data, options = {}) {
  const allowedServices = options.services || SERVICES;
  const allowedUrgency = options.urgencyOptions || URGENCY_OPTIONS;
  const allowedBudget = options.budgetOptions || BUDGET_OPTIONS;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!data.name || data.name.length < 2 || data.name.length > 100) {
    return { isValid: false, field: 'name', error: 'Por favor ingresa un nombre válido (2 a 100 caracteres).' };
  }

  if (!data.email || !emailRegex.test(data.email) || data.email.length > 150) {
    return { isValid: false, field: 'email', error: 'Por favor introduce un correo electrónico válido.' };
  }

  if (data.phone && (data.phone.length > 25 || !/^[0-9+\-()\s.]{7,25}$/.test(data.phone))) {
    return { isValid: false, field: 'phone', error: 'Por favor introduce un número de teléfono o WhatsApp válido.' };
  }

  if (!allowedServices.includes(data.service)) {
    return { isValid: false, field: 'service', error: 'Por favor selecciona un servicio válido de la lista.' };
  }

  if (!allowedUrgency.includes(data.urgency)) {
    return { isValid: false, field: 'urgency', error: 'Por favor selecciona un plazo o urgencia de la lista.' };
  }

  if (data.budget && !allowedBudget.includes(data.budget)) {
    return { isValid: false, field: 'budget', error: 'Por favor selecciona una opción de presupuesto válida.' };
  }

  if (!data.subject || data.subject.length < 3 || data.subject.length > 120) {
    return { isValid: false, field: 'subject', error: 'El asunto debe contener entre 3 y 120 caracteres.' };
  }

  if (!data.message || data.message.length < 10 || data.message.length > 3000) {
    return { isValid: false, field: 'message', error: 'El mensaje debe contener entre 10 y 3,000 caracteres.' };
  }

  if (!data.privacyConsent) {
    return { isValid: false, field: 'privacyConsent', error: 'Debes aceptar el Aviso de Privacidad para continuar.' };
  }

  return { isValid: true };
}

/**
 * Inicializa el comportamiento interactivo del formulario de contacto.
 * @param {HTMLFormElement|null} form Elemento del formulario.
 */
export function initContactForm(form) {
  if (!form) return;

  // Law of Demeter: Búsqueda acotada al contexto del formulario
  const phoneInput = form.querySelector('#phone');
  const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('#submitBtn');
  const statusEl = form.querySelector('.form-status') || form.parentElement?.querySelector('#formStatus') || document.getElementById('formStatus');

  // Filtro de teclado en tiempo real para teléfono (solo dígitos y símbolos válidos)
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

    // 2. Extracción y saneamiento de datos
    const formData = {
      name: sanitizeSingleLine(form.elements['name']?.value || ''),
      email: sanitizeSingleLine(form.elements['email']?.value || ''),
      phone: sanitizeSingleLine(form.elements['phone']?.value || ''),
      service: sanitizeSingleLine(form.elements['service']?.value || ''),
      urgency: sanitizeSingleLine(form.elements['urgency']?.value || ''),
      budget: sanitizeSingleLine(form.elements['budget']?.value || ''),
      subject: sanitizeSingleLine(form.elements['subject']?.value || ''),
      message: sanitizeString(form.elements['message']?.value || ''),
      privacyConsent: Boolean(form.elements['privacyConsent']?.checked),
    };

    // 3. Validación pura delegada (SRP)
    const validation = validateContactFormData(formData);
    if (!validation.isValid) {
      showStatus(validation.error, 'error');
      if (validation.field && form.elements[validation.field]) {
        form.elements[validation.field].focus();
      }
      return;
    }

    // 4. Actualizar estado de interfaz
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }
    if (statusEl) statusEl.style.display = 'none';

    // 5. Envío al endpoint unificado
    // Si corre dev_server.py en localhost:8080, POST a '/' maneja Twenty CRM directo
    const isDevServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const targetEndpoint = isDevServer ? '/' : '/.netlify/functions/contacto';

    const payload = new URLSearchParams({
      'form-name': 'contacto',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      service: formData.service,
      urgency: formData.urgency,
      budget: formData.budget,
      subject: formData.subject,
      message: formData.message,
    }).toString();

    try {
      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: payload,
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
