#!/usr/bin/env python

# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
# changeme
# python3 server.py
import http.server
import ssl

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(CORSRequestHandler, self).end_headers()

httpd = http.server.HTTPServer(('localhost', 4443), CORSRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket,
                                keyfile="./key.pem",
                                certfile='./cert.pem',
                                server_side=True)
httpd.serve_forever()