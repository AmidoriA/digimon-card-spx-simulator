"""Serve the site for looking at a model, and keep the pictures the page makes of it.

Usage:  python tools/sheet_server.py <web dir> <port> <save dir>

Like `python -m http.server`, bound to 127.0.0.1, with three differences:
  - nothing is cached by the browser, so a rebuilt model is the one you see after a reload;
  - GET /sheet-qa.html is tools/model_sheet_page.html, the six-case review page;
  - GET /sheet.js is tools/model_sheet.js, the page helper that steps the 3D battle and
    draws contact sheets (load it into battle-preview.html; its head says how);
  - POST /save/<name>.png|jpg|json writes the body to <save dir>/<name>. The helper posts
    its sheets there, since a page cannot write files.
Used by the import-ts-model skill. It is a tool for checking, not part of the site.
"""
import functools
import http.server
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    save = "."

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        route = {"/sheet.js": ("model_sheet.js", "text/javascript"),
                 "/sheet-qa.html": ("model_sheet_page.html", "text/html; charset=utf-8")}
        resource = route.get(self.path.split("?")[0])
        if resource:
            filename, content_type = resource
            data = open(os.path.join(HERE, filename), "rb").read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def do_POST(self):
        m = re.fullmatch(r"/save/([A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:png|jpg|json))", self.path)
        if not m:
            self.send_error(404)
            return
        data = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        os.makedirs(self.save, exist_ok=True)
        with open(os.path.join(self.save, m.group(1)), "wb") as f:
            f.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    web, port, save = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    os.makedirs(save, exist_ok=True)
    Handler.save = save
    http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=web)).serve_forever()


if __name__ == "__main__":
    main()
