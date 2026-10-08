#!/usr/bin/env python3
"""
sync_twenty.py — LESSSO Form Submissions -> Twenty CRM Pull Worker
===================================================================
Este script corre localmente en tu Debian 13 (vía cron o servicio systemd).
1. Consulta la API de Netlify vía HTTPS para obtener nuevos envíos del formulario de contacto.
2. Evita duplicados recordando qué envíos ya fueron procesados en processed_ids.json.
3. Inserta cada nuevo prospecto en la API local de Twenty CRM (Docker).

Cero puertos abiertos en tu router: 100% arquitectura Pull segura.
"""

import os
import sys
import json
import time
import re
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

# Rutas del entorno
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
ENV_FILE = PROJECT_DIR / ".env"
STATE_FILE = SCRIPT_DIR / "processed_ids.json"


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {msg}")


def load_env(env_path):
    """Carga variables desde el archivo .env sin requerir librerías externas."""
    config = {}
    if not env_path.exists():
        return config
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            config[k.strip()] = v.strip().strip('"').strip("'")
    return config


def get_processed_ids():
    if not STATE_FILE.exists():
        return set()
    try:
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return set(json.load(f))
    except Exception as e:
        log(f"Aviso: No se pudo leer {STATE_FILE.name}: {e}")
        return set()


def save_processed_ids(ids_set):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(sorted(list(ids_set)), f, indent=2)
    except Exception as e:
        log(f"Error al guardar {STATE_FILE.name}: {e}")


def netlify_request(endpoint, token):
    """Realiza una petición GET autenticada a la API de Netlify."""
    url = f"https://api.netlify.com/api/v1/{endpoint.lstrip('/')}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "LESSSO-TwentySync/1.0"
        }
    )
    with urllib.request.urlopen(req, timeout=15) as res:
        return json.loads(res.read().decode("utf-8"))


def find_form_id(site_id, form_name, token):
    """Obtiene el ID del formulario registrado en el sitio de Netlify."""
    forms = netlify_request(f"sites/{site_id}/forms", token)
    for f in forms:
        if f.get("name") == form_name:
            return f.get("id")
    # Si solo hay uno, usamos ese
    if len(forms) == 1:
        return forms[0].get("id")
    return None


def check_twenty_connectivity(twenty_url, twenty_key):
    """
    Verifica si Twenty CRM está disponible antes de procesar leads.
    Comprueba el endpoint /healthz y fallback a /rest/people.
    """
    if not twenty_url:
        return False
    # 1. Endpoint oficial de salud de Twenty
    health_url = f"{twenty_url.rstrip('/')}/healthz"
    try:
        req = urllib.request.Request(
            health_url,
            headers={"User-Agent": "LESSSO-TwentySync/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            if res.status == 200:
                return True
    except Exception:
        pass

    # 2. Respaldo: verificar autenticación y disponibilidad en REST API
    try:
        api_url = f"{twenty_url.rstrip('/')}/rest/people?limit=1"
        req = urllib.request.Request(
            api_url,
            headers={
                "Authorization": f"Bearer {twenty_key}",
                "User-Agent": "LESSSO-TwentySync/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            return res.status in (200, 201)
    except Exception as e:
        log(f"[AVISO] Verificación de conectividad a Twenty CRM falló en {twenty_url}: {e}")
        return False


def sanitize_text(text):
    """
    Sanitiza texto entrante eliminando bytes nulos, inyecciones de código HTML/JS (XSS)
    y patrones de inyección SQL comunes antes del procesamiento.
    """
    if not isinstance(text, str):
        return ""
    cleaned = re.sub(r'[\x00]', '', text)
    cleaned = re.sub(r'<script.*?>.*?</script>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'[<>]', '', cleaned)
    cleaned = re.sub(r'(\b(UNION|SELECT|DROP|ALTER|INSERT|DELETE|EXEC|xp_)\b\s+)', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def normalize_phone_number(raw_phone):
    """
    Normaliza el teléfono a formato internacional E.164 (+<código><número>).
    Twenty CRM valida estrictamente los números de teléfono con libphonenumber-js.
    Un número plano de 10 dígitos (ej. 1234567891) causa HTTP 400 INVALID_PHONE_NUMBER.
    Esta función asegura que los dígitos tengan el formato internacional adecuado.
    """
    if not raw_phone:
        return ""

    phone_clean = raw_phone.strip()
    has_plus = phone_clean.startswith("+")
    digits = re.sub(r'\D', '', phone_clean)

    if not digits:
        return ""

    # Si ya traía prefijo '+'
    if has_plus:
        return f"+{digits}"

    # Si son 10 dígitos (número estándar mexicano), anteponer +52
    if len(digits) == 10:
        return f"+52{digits}"

    # Si son 11 dígitos iniciando con 1 (USA / Canadá)
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"

    # Si ya incluía 52 al inicio (México con 12 dígitos)
    if digits.startswith("52") and len(digits) in (12, 13):
        return f"+{digits}"

    # Si tiene al menos 10 dígitos, añadir +52 por defecto (origen México)
    if len(digits) >= 10:
        return f"+52{digits}"

    return f"+{digits}"


def push_to_twenty(lead_data, twenty_url, twenty_key, dry_run=False):
    """
    Inserta el prospecto en Twenty CRM.
    Twenty CRM soporta REST (/rest/people) y GraphQL (/graphql).
    Incluye sanitización robusta anti-SQLi/XSS, normalización E.164
    y mecanismo de resiliencia frente a errores de formato telefónico.
    """
    name_raw = sanitize_text(lead_data.get("name", "Contacto"))
    email_raw = sanitize_text(lead_data.get("email", ""))
    phone_raw = sanitize_text(lead_data.get("phone", ""))
    service_raw = sanitize_text(lead_data.get("service", "General"))
    urgency_raw = sanitize_text(lead_data.get("urgency", "No especificado"))
    budget_raw = sanitize_text(lead_data.get("budget", "Por definir"))
    subject_raw = sanitize_text(lead_data.get("subject", "Solicitud Web"))
    message_raw = sanitize_text(lead_data.get("message", ""))

    normalized_phone = normalize_phone_number(phone_raw)

    name_parts = name_raw.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    if dry_run:
        log(f"[DRY-RUN] Lead a enviar a Twenty: {first_name} {last_name} <{email_raw}> | Tel: {normalized_phone} ({phone_raw}) | Servicio: {service_raw} | Presupuesto: {budget_raw}")
        return True

    # Endpoint REST de Twenty CRM para personas
    api_endpoint = f"{twenty_url.rstrip('/')}/rest/people"
    payload = {
        "name": {
            "firstName": first_name,
            "lastName": last_name
        },
        "emails": {
            "primaryEmail": email_raw
        },
        "jobTitle": f"{service_raw} [{budget_raw}]"
    }
    if normalized_phone:
        payload["phones"] = {
            "primaryPhoneNumber": normalized_phone
        }

    req = urllib.request.Request(
        api_endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {twenty_key}",
            "Content-Type": "application/json",
            "User-Agent": "LESSSO-TwentySync/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            if res.status in (200, 201):
                log(f"[OK] Prospecto registrado en Twenty CRM [Módulo: Personas]: {first_name} {last_name} ({email_raw})")

                # Intentar crear una nota con el detalle de la consulta
                if message_raw or service_raw or phone_raw:
                    try:
                        note_payload = {
                            "title": f"Consulta Web: {service_raw} | Presupuesto: {budget_raw}",
                            "body": f"Teléfono / WhatsApp: {phone_raw} (E.164: {normalized_phone})\nAsunto: {subject_raw}\nServicio: {service_raw}\nUrgencia: {urgency_raw}\nPresupuesto: {budget_raw}\n\nMensaje:\n{message_raw}"
                        }
                        note_req = urllib.request.Request(
                            f"{twenty_url.rstrip('/')}/rest/notes",
                            data=json.dumps(note_payload).encode("utf-8"),
                            headers={
                                "Authorization": f"Bearer {twenty_key}",
                                "Content-Type": "application/json",
                                "User-Agent": "LESSSO-TwentySync/1.0"
                            },
                            method="POST"
                        )
                        with urllib.request.urlopen(note_req, timeout=5) as note_res:
                            if note_res.status in (200, 201):
                                log(f"   [NOTA] Nota con mensaje y presupuesto vinculada con éxito.")
                    except Exception:
                        pass

                return True
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="ignore")
        if "duplicate entry was detected" in err_msg or "unique constraint" in err_msg:
            log(f"ℹ️ El contacto {email_raw} ya existe en Twenty CRM (duplicado detectado). Se considera procesado.")
            return True

        # Resiliencia: si Twenty CRM rechaza el teléfono con INVALID_PHONE_NUMBER, reintentar sin el campo 'phones'
        # para asegurar que el prospecto NO se pierda, guardando el número dentro de la nota.
        if "INVALID_PHONE_NUMBER" in err_msg and "phones" in payload:
            log(f"[AVISO] Twenty CRM reportó INVALID_PHONE_NUMBER ({normalized_phone}). Reintentando registro sin teléfono para salvar el prospecto...")
            payload_safe = dict(payload)
            payload_safe.pop("phones", None)
            retry_req = urllib.request.Request(
                api_endpoint,
                data=json.dumps(payload_safe).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {twenty_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "LESSSO-TwentySync/1.0"
                },
                method="POST"
            )
            try:
                with urllib.request.urlopen(retry_req, timeout=10) as retry_res:
                    if retry_res.status in (200, 201):
                        log(f"[OK] Prospecto registrado con éxito tras fallback: {first_name} {last_name} ({email_raw})")
                        try:
                            note_payload = {
                                "title": f"Consulta Web: {service_raw} | Presupuesto: {budget_raw}",
                                "body": f"Teléfono reportado: {phone_raw}\nAsunto: {subject_raw}\nServicio: {service_raw}\nUrgencia: {urgency_raw}\nPresupuesto: {budget_raw}\n\nMensaje:\n{message_raw}"
                            }
                            note_req = urllib.request.Request(
                                f"{twenty_url.rstrip('/')}/rest/notes",
                                data=json.dumps(note_payload).encode("utf-8"),
                                headers={
                                    "Authorization": f"Bearer {twenty_key}",
                                    "Content-Type": "application/json",
                                    "User-Agent": "LESSSO-TwentySync/1.0"
                                },
                                method="POST"
                            )
                            with urllib.request.urlopen(note_req, timeout=5):
                                log(f"   [NOTA] Nota con teléfono original vinculada con éxito.")
                        except Exception:
                            pass
                        return True
            except Exception as retry_err:
                log(f"[AVISO] Falló el reintento de guardado en Twenty: {retry_err}")
                return False

        log(f"[AVISO] Error HTTP {e.code} al enviar a Twenty CRM ({api_endpoint}): {err_msg[:200]}")
        return False
    except Exception as e:
        log(f"[AVISO] Error de conexión a Twenty CRM en {twenty_url}: {e}")
        return False


def main():
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv
    test_mode = "--test" in sys.argv

    env = load_env(ENV_FILE)
    netlify_token = os.environ.get("NETLIFY_TOKEN", env.get("NETLIFY_TOKEN"))
    site_id = os.environ.get("NETLIFY_SITE_ID", env.get("NETLIFY_SITE_ID"))
    form_name = os.environ.get("NETLIFY_FORM_NAME", env.get("NETLIFY_FORM_NAME", "contacto"))
    twenty_url = os.environ.get("TWENTY_API_URL", env.get("TWENTY_API_URL", "http://localhost:3000"))
    twenty_key = os.environ.get("TWENTY_API_KEY", env.get("TWENTY_API_KEY"))

    if test_mode:
        test_ts = datetime.now().strftime("%H%M%S")
        log(f"[TEST] [MODO DE PRUEBA] Enviando un prospecto de prueba único a Twenty CRM ({twenty_url})...")
        test_lead = {
            "name": f"Prospecto Web {test_ts}",
            "email": f"prospecto_{test_ts}@lessso.com",
            "phone": "+52 (664) 227-6711",
            "service": "Suscripción Mensual de Página Web",
            "urgency": "Inmediato / Menos de 1 mes",
            "budget": "Suscripción Web ($799 - $2,499 MXN/mes)",
            "subject": "Solicitud de sitio web por suscripción",
            "message": "Mensaje de prueba para verificar registro de prospecto de desarrollo web en People de Twenty CRM."
        }
        ok = push_to_twenty(test_lead, twenty_url, twenty_key, dry_run=dry_run)
        if ok:
            log("[EXITO] ¡Prueba exitosa! Abre http://twenty.crm:3000/objects/people en tu navegador para verlo reflejado.")
        else:
            log("[ERROR] La prueba falló. Revisa que tu contenedor de Twenty CRM esté corriendo y accesible.")
        return

    if not netlify_token or not site_id:
        log("[ERROR] Error: Faltan NETLIFY_TOKEN o NETLIFY_SITE_ID en .env")
        sys.exit(1)

    # Validación previa de conectividad hacia Twenty CRM
    if not dry_run:
        if not check_twenty_connectivity(twenty_url, twenty_key):
            log(f"[AVISO] Twenty CRM no está disponible en {twenty_url}. Abortando ciclo para no desincronizar leads.")
            sys.exit(1)
        if verbose:
            log(f"[OK] Twenty CRM accesible y respondiendo en {twenty_url}.")

    log("Iniciando verificación de nuevos leads en Netlify Forms...")
    try:
        form_id = find_form_id(site_id, form_name, netlify_token)
    except Exception as e:
        log(f"[ERROR] Error al consultar formularios en Netlify: {e}")
        sys.exit(1)

    if not form_id:
        log(f"ℹ️ El formulario '{form_name}' aún no tiene envíos registrados en Netlify.")
        log("   (Aparecerá automáticamente en cuanto se reciba el primer envío desde la web).")
        return

    # Obtener envíos
    try:
        submissions = netlify_request(f"forms/{form_id}/submissions", netlify_token)
    except Exception as e:
        log(f"[ERROR] Error al obtener envíos del formulario: {e}")
        return

    processed = get_processed_ids()
    nuevos = 0
    MAX_RETRIES = 3

    for sub in submissions:
        sub_id = sub.get("id")
        if not sub_id or sub_id in processed:
            continue

        data = sub.get("data", {})
        if verbose:
            log(f"Procesando envío ID {sub_id}: {data}")

        exito = False
        for intento in range(MAX_RETRIES):
            exito = push_to_twenty(data, twenty_url, twenty_key, dry_run=dry_run)
            if exito:
                break
            if intento < MAX_RETRIES - 1:
                backoff_sec = 2 ** intento
                log(f"   ⏳ Reintentando inserción en Twenty CRM ({intento + 1}/{MAX_RETRIES}) en {backoff_sec}s...")
                time.sleep(backoff_sec)

        if exito:
            processed.add(sub_id)
            nuevos += 1
        else:
            log(f"   [AVISO] Lead ID {sub_id} ({data.get('email', 'sin correo')}) falló tras {MAX_RETRIES} intentos. Se conservará para reintento en el próximo ciclo.")

    if not dry_run and nuevos > 0:
        save_processed_ids(processed)

    log(f"Finalizado: {nuevos} nuevos leads sincronizados. Total procesados: {len(processed)}.")


if __name__ == "__main__":
    main()
