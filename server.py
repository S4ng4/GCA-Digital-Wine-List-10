#!/usr/bin/env python3
"""
Simple HTTP server for local development
Serves the wine_manager.html and allows loading JSON/CSV files via HTTP
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import json
import urllib.parse

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow loading local files
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/save-wines-json':
            try:
                # Leggi i dati inviati
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Parse JSON
                wines_data = json.loads(post_data.decode('utf-8'))
                
                # Salva nel file wines.json
                wines_json_path = os.path.join(os.getcwd(), 'data', 'wines.json')
                
                # Crea la directory se non esiste
                os.makedirs(os.path.dirname(wines_json_path), exist_ok=True)
                
                # Salva il file
                with open(wines_json_path, 'w', encoding='utf-8') as f:
                    json.dump(wines_data, f, indent=2, ensure_ascii=False)
                
                # Risposta di successo
                response = {
                    'success': True,
                    'message': f'File wines.json salvato con successo',
                    'path': wines_json_path
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
                print(f"✅ wines.json salvato: {wines_json_path}")
                
            except Exception as e:
                error_response = {
                    'success': False,
                    'error': str(e)
                }
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode('utf-8'))
                print(f"❌ Errore nel salvataggio: {e}")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.address_string()}] {format % args}")

def main():
    # Change to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("=" * 60)
            print(f"🚀 Server HTTP locale avviato!")
            print("=" * 60)
            print(f"📍 Porta: {PORT}")
            print(f"📂 Directory: {os.getcwd()}")
            print("=" * 60)
            print(f"\n🌐 Apri nel browser:")
            print(f"   http://localhost:{PORT}/wine_manager.html")
            print(f"\n⏹️  Premi CTRL+C per fermare il server\n")
            print("=" * 60)
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{PORT}/wine_manager.html')
            except:
                pass
            
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Errore: La porta {PORT} è già in uso.")
            print(f"💡 Prova a usare una porta diversa o chiudi l'altro processo.")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    main()

