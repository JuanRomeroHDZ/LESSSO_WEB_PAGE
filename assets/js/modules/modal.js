/* ============================================================
   MODALES — sin onclick en el HTML
   Uso:
     <button data-modal-open="contactModal">…</button>
     <div class="modal" id="contactModal">
       <button data-modal-close>×</button>
     </div>
   ============================================================ */

const ACTIVE_CLASS = 'active';

export function openModal(modal) {
  modal?.classList.add(ACTIVE_CLASS);
}

export function closeModal(modal) {
  modal?.classList.remove(ACTIVE_CLASS);
}

export function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
    const modal = document.getElementById(trigger.dataset.modalOpen);
    trigger.addEventListener('click', () => openModal(modal));
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      // Cerrar al hacer clic afuera (en el fondo) o en un botón de cierre.
      if (e.target === modal || e.target.closest('[data-modal-close]')) {
        closeModal(modal);
      }
    });
  });
}
