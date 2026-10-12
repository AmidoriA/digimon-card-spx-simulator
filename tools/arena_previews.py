"""Draw the previews of the arena picker.

Usage (venv python):  arena_previews.py <web_dir> [--no-open]

Serves the web folder with one extra page (arena_previews.html) that draws every arena of
web/assets/battle/arenas.json with the game's own renderer (web/js/battle3d.js) and sends
the pictures back. The page opens in the default browser, or open the address this prints.

  web/assets/battle/arena/NNN.webp    320x240, arena file NNN seen from the middle of it

The views are this project's: the camera stands where the arena is drawn around, level, with
a wider angle than the battle's, turned to the side that shows most when the front shows little.
"""
import functools
import http.server
import io
import os
import socket
import sys
import threading
import webbrowser

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    out = None

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/__arenas.html":
            body = open(os.path.join(HERE, "arena_previews.html"), "rb").read()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if self.path.startswith("/__shot/"):
            num = int(self.path.rsplit("/", 1)[1])
            im = Image.open(io.BytesIO(body)).convert("RGB")
            assert im.size == (320, 240), im.size
            im.save(os.path.join(self.out, "%d.webp" % num), "WEBP", quality=90, method=6)
            print("  arena %d" % num, flush=True)
        self.send_response(204)
        self.end_headers()
        if self.path == "/__done":
            threading.Thread(target=self.server.shutdown, daemon=True).start()


def free_port(port):
    while True:
        try:
            with socket.socket() as s:
                s.bind(("127.0.0.1", port))
            return port
        except OSError:
            port += 1


def main():
    web = sys.argv[1]
    Handler.out = os.path.join(web, "assets", "battle", "arena")
    os.makedirs(Handler.out, exist_ok=True)
    port = free_port(8770)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(Handler, directory=web))
    url = "http://localhost:%d/__arenas.html" % port
    print("open %s" % url, flush=True)
    if "--no-open" not in sys.argv:
        webbrowser.open(url)
    srv.serve_forever()
    print("done")


if __name__ == "__main__":
    main()
