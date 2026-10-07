/* ============================================================
   DOCK DE PRIVACIDAD Y CONSENTIMIENTO DE COOKIES
   - Unificado con SITE.consentStorageKey desde config.js
   - Almacenamiento resiliente vía core/storage.js
   - Compatible con Google Consent Mode v2
   - Principios aplicados: DRY, Law of Demeter, SRP
   ============================================================ */

import { SITE } from '../config.js';
import { readStorage, writeStorage } from '../core/storage.js';

export function initPrivacyDock() {
  const dock = document.getElementById('siteNoticeDock');
  if (!dock) return;

  const closeBtn = dock.querySelector('#dockCloseBtn') || document.getElementById('dockCloseBtn');
  const acceptBtn = dock.querySelector('#dockAcceptBtn') || document.getElementById('dockAcceptBtn');
  const rejectBtn = dock.querySelector('#dockRejectBtn') || document.getElementById('dockRejectBtn');
  const openLink = document.getElementById('openSiteNotice');

  function setConsent(status) {
    writeStorage(SITE.consentStorageKey, status);

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: status === 'granted' ? 'granted' : 'denied',
        });
      }
    } catch {
      // Ignorar si gtag no está disponible
    }

    dock.classList.remove('active');
    document.body.classList.remove('has-notice-dock');
  }

  acceptBtn?.addEventListener('click', () => setConsent('granted'));
  rejectBtn?.addEventListener('click', () => setConsent('denied'));
  closeBtn?.addEventListener('click', () => {
    dock.classList.remove('active');
    document.body.classList.remove('has-notice-dock');
  });

  openLink?.addEventListener('click', (e) => {
    e.preventDefault();
    dock.classList.add('active');
    document.body.classList.add('has-notice-dock');
  });

  // Mostrar el dock si no hay preferencia previa guardada
  const saved = readStorage(SITE.consentStorageKey);
  if (!saved) {
    setTimeout(() => {
      dock.classList.add('active');
      document.body.classList.add('has-notice-dock');
    }, 600);
  }
}
