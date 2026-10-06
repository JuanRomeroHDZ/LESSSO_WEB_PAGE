/* ============================================================
   ALMACENAMIENTO SEGURO
   localStorage puede lanzar errores (modo privado, cookies
   bloqueadas); estas funciones nunca rompen la página.
   ============================================================ */

export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Almacenamiento no disponible: se ignora. */
  }
}
