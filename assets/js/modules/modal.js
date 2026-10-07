/* ============================================================
   MODALES (Accesible, declarativo y desacoplado)
   Uso:
     <button data-modal-open="contactModal">…</button>
     <div class="modal" id="contactModal">
       <button data-modal-close>×</button>
     </div>
   Principios aplicados: Law of Demeter, SRP, A11y (soporte tecla Escape)
   ============================================================ */

const ACTIVE_CLASS = 'active';

export function openModal(modal) {
  modal?.classList.add(ACTIVE_CLASS);
}

export function closeModal(modal) {
  modal?.classList.remove(ACTIVE_CLASS);
}

export function initModals(root = document) {
  root.querySelectorAll('[data-modal-open]').forEach((trigger) => {
    const modalId = trigger.dataset.modalOpen;
    const modal = document.getElementById(modalId);
    trigger.addEventListener('click', () => openModal(modal));
  });

  root.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      // Cerrar al hacer clic afuera (en el fondo) o en un botón de cierre
      if (e.target === modal || e.target.closest('[data-modal-close]')) {
        closeModal(modal);
      }
    });
  });

  // Cerrar modal activo al presionar la tecla Escape (A11y)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector(`.modal.${ACTIVE_CLASS}`);
      if (activeModal) closeModal(activeModal);
    }
  });
}
