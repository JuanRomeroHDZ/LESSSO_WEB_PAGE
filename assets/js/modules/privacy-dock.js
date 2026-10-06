/* ============================================================
   DOCK DE PRIVACIDAD Y CONSENTIMIENTO DE COOKIES
   - Unificado en 'lessso-cookie-consent'
   - Sin heurísticas frágiles de bloqueo
   - Compatible con Google Consent Mode v2
   ============================================================ */

const CONSENT_STORAGE_KEY = 'lessso-cookie-consent';

export function initPrivacyDock() {
  const dock = document.getElementById('siteNoticeDock');
  const closeBtn = document.getElementById('dockCloseBtn');
  const acceptBtn = document.getElementById('dockAcceptBtn');
  const rejectBtn = document.getElementById('dockRejectBtn');
  const openLink = document.getElementById('openSiteNotice');

  if (!dock) return;

  function setConsent(status) {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, status);
    } catch (e) {}

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: status === 'granted' ? 'granted' : 'denied'
        });
      }
    } catch (e) {}

    dock.classList.remove('active');
  }

  if (acceptBtn) acceptBtn.addEventListener('click', () => setConsent('granted'));
  if (rejectBtn) rejectBtn.addEventListener('click', () => setConsent('denied'));
  if (closeBtn) closeBtn.addEventListener('click', () => dock.classList.remove('active'));

  if (openLink) {
    openLink.addEventListener('click', (e) => {
      e.preventDefault();
      dock.classList.add('active');
    });
  }

  // Mostrar el dock si no hay preferencia guardada previa
  let saved = null;
  try {
    saved = localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch (e) {}

  if (!saved) {
    // Dar un breve retraso para no bloquear la carga inicial
    setTimeout(() => {
      dock.classList.add('active');
    }, 600);
  }
}
