#!/usr/bin/env python3
"""
Simple HTTP server for testing the wine collection website.
Run with: python3 server.py
Then open: http://localhost:3000
"""

import http.server
import socketserver
import os
import sys

PORT = 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Set correct MIME type for JSON files
        if self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
        super().end_headers()

    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.address_string()}] {format % args}")

def main():
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print("=" * 60)
            print("🚀 Server locale avviato!")
            print("=" * 60)
            print(f"📍 URL: http://localhost:{PORT}")
            print(f"📁 Directory: {os.getcwd()}")
            print("=" * 60)
            print("\nPer fermare il server, premi Ctrl+C\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server fermato. Arrivederci!")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Errore: La porta {PORT} è già in uso.")
            print(f"   Prova a cambiare la porta o chiudi l'altro processo.")
        else:
            print(f"❌ Errore: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

