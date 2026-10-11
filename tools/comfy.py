"""Minimal client for a local ComfyUI server: upscale one image with an ESRGAN-type model.

    upscale(pil_image, model="RealESRGAN_x4plus.safetensors") -> PIL.Image (RGB)

Uses only the stock nodes LoadImage / UpscaleModelLoader / ImageUpscaleWithModel / SaveImage.
"""
import io
import json
import time
import urllib.parse
import urllib.request
import uuid

from PIL import Image

HOST = "http://127.0.0.1:8188"


def _post_json(path, obj):
    req = urllib.request.Request(HOST + path, data=json.dumps(obj).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())


def _get(path):
    return urllib.request.urlopen(HOST + path, timeout=120).read()


def _upload(img, name):
    buf = io.BytesIO()
    img.save(buf, "PNG")
    boundary = uuid.uuid4().hex
    parts = []
    for k, v in (("overwrite", "true"), ("subfolder", "ddcb")):
        parts.append(("--%s\r\nContent-Disposition: form-data; name=\"%s\"\r\n\r\n%s\r\n" % (boundary, k, v)).encode())
    parts.append(("--%s\r\nContent-Disposition: form-data; name=\"image\"; filename=\"%s\"\r\nContent-Type: image/png\r\n\r\n" % (boundary, name)).encode())
    parts.append(buf.getvalue())
    parts.append(("\r\n--%s--\r\n" % boundary).encode())
    req = urllib.request.Request(HOST + "/upload/image", data=b"".join(parts),
                                 headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    return (r.get("subfolder") + "/" if r.get("subfolder") else "") + r["name"]


def upscale(img, model="RealESRGAN_x4plus.safetensors", tag="img"):
    name = _upload(img.convert("RGB"), "ddcb_%s.png" % tag)
    graph = {
        "1": {"class_type": "LoadImage", "inputs": {"image": name}},
        "2": {"class_type": "UpscaleModelLoader", "inputs": {"model_name": model}},
        "3": {"class_type": "ImageUpscaleWithModel", "inputs": {"upscale_model": ["2", 0], "image": ["1", 0]}},
        "4": {"class_type": "SaveImage", "inputs": {"images": ["3", 0], "filename_prefix": "ddcb/" + tag}},
    }
    pid = _post_json("/prompt", {"prompt": graph, "client_id": "ddcb"})["prompt_id"]
    t0 = time.time()
    while True:
        hist = json.loads(_get("/history/" + pid))
        if pid in hist:
            h = hist[pid]
            if h.get("status", {}).get("status_str") == "error":
                raise RuntimeError("ComfyUI error: %s" % json.dumps(h["status"])[:500])
            outs = h.get("outputs", {})
            if "4" in outs and outs["4"].get("images"):
                im = outs["4"]["images"][0]
                q = urllib.parse.urlencode({"filename": im["filename"], "subfolder": im["subfolder"], "type": im["type"]})
                return Image.open(io.BytesIO(_get("/view?" + q))).convert("RGB")
        if time.time() - t0 > 600:
            raise TimeoutError("ComfyUI did not finish")
        time.sleep(0.4)
