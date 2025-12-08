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

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow loading local files
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

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

