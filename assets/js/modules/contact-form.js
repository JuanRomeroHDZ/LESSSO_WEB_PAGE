/* ============================================================
   FORMULARIO DE CONTACTO — envío por mailto
   ============================================================ */
import { SITE } from '../config/site.js';
import { closeModal } from './modal.js';

export function buildMailtoLink({ name = '', email = '', subject = '', message = '' }) {
  const body = `Nombre: ${name}\nEmail: ${email}\n\n${message}`;
  return `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** @param {HTMLFormElement|null} form */
export function initContactForm(form) {
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    // Enviar por mailto como fallback
    window.location.href = buildMailtoLink(data);

    // Cerrar modal
    setTimeout(() => {
      closeModal(form.closest('.modal'));
      form.reset();
    }, 500);
  });
}
