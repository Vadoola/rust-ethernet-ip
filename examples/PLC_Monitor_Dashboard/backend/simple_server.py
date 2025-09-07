#!/usr/bin/env python3
"""
Simple HTTP server to test if the basic setup works
"""

import http.server
import socketserver
import json
from datetime import datetime

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'message': 'Simple server is working!'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = """
            <html>
            <head><title>PLC Monitor Dashboard - Simple Server</title></head>
            <body>
                <h1>PLC Monitor Dashboard</h1>
                <p>Simple server is running!</p>
                <p><a href="/health">Health Check</a></p>
            </body>
            </html>
            """
            self.wfile.write(html.encode())

if __name__ == "__main__":
    PORT = 8000
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
