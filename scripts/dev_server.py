#!/usr/bin/env python3
"""
Servidor de desarrollo local para LESSSO
Permite probar la web en http://localhost:8080 y conecta el formulario
DIRECTAMENTE con Twenty CRM para ver los leads reflejados en tiempo real.
"""

import http.server
import socketserver
import urllib.parse
import json
import sys
import os
from pathlib import Path

# Importar la función push_to_twenty del sincronizador
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "scripts"))
from sync_twenty import push_to_twenty, load_env

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
ENV_FILE = BASE_DIR / ".env"

class DevHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_POST(self):
        """Maneja el envío del formulario en local e inserta directo en Twenty CRM."""
        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length).decode("utf-8")
        parsed = urllib.parse.parse_qs(post_data)

        # Aplanar campos del formulario
        lead = {k: v[0] if v else "" for k, v in parsed.items()}

        env = load_env(ENV_FILE)
        twenty_url = os.environ.get("TWENTY_API_URL", env.get("TWENTY_API_URL", "http://localhost:3000"))
        twenty_key = os.environ.get("TWENTY_API_KEY", env.get("TWENTY_API_KEY"))

        print(f"\n📨 [LOCAL DEV SERVER] Recibido mensaje de formulario de: {lead.get('name')} ({lead.get('email')})")
        print(f"   Servicio: {lead.get('service')} | Presupuesto: {lead.get('budget')}")

        if not twenty_key:
            print("   ❌ Error: No se encontró TWENTY_API_KEY en .env\n")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            err_body = json.dumps({"error": "Falta TWENTY_API_KEY en el archivo .env del servidor local."})
            self.wfile.write(err_body.encode("utf-8"))
            return

        success = push_to_twenty(lead, twenty_url, twenty_key)
        if success:
            print(f"   ✅ ¡Insertado con éxito en Twenty CRM ({twenty_url})!\n")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            ok_body = json.dumps({"ok": True, "message": "Recibido e insertado en Twenty CRM con éxito."})
            self.wfile.write(ok_body.encode("utf-8"))
        else:
            print(f"   ❌ Falló la inserción en Twenty CRM ({twenty_url}).\n")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            err_body = json.dumps({"error": "No se pudo sincronizar con Twenty CRM. Revisa que el servicio local esté activo."})
            self.wfile.write(err_body.encode("utf-8"))

def run():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), DevHandler) as httpd:
        print(f"============================================================")
        print(f"🚀 Servidor de desarrollo LESSSO corriendo en http://localhost:{PORT}")
        print(f"🔗 Conectado a Twenty CRM en tiempo real")
        print(f"Presiona Ctrl + C para detenerlo")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")

if __name__ == "__main__":
    run()
