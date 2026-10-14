"""Local ComfyUI image tools: ESRGAN upscale and repeatable masked restoration.

    upscale(pil_image, model="RealESRGAN_x4plus.safetensors") -> PIL.Image (RGB)
    inpaint(image, mask, prompt, seed=...) -> PIL.Image (RGB)
    outpaint(image, (left, top, right, bottom), prompt, seed=...) -> PIL.Image (RGB)

Edits use the stored stock-node workflow comfy_workflows/ts002-inpaint.json. White mask
pixels are editable; every black-mask pixel stays identical. Fixed seeds are explicit.
"""
import io
import json
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

HOST = "http://127.0.0.1:8188"


def inpaint(image, mask, prompt, *, seed, model="512-inpainting-ema.safetensors",
            workflow=None, tag="inpaint", steps=24, cfg=6, sampler_name="euler",
            scheduler="normal", denoise=1):
    """Restore only a native-size mask; output.info contains its ComfyUI prompt id.

    The stored workflow has parameter nodes 1=image, 2=model, 3=positive prompt,
    6=sampling and 8=save. Independent uploads permit checking repeatability rather
    than merely reusing a cached node. GPU/software reproducibility must be measured.
    """
    if image.size != mask.size:
        raise ValueError("inpaint mask must have the image's dimensions")
    source, mask = image.convert("RGB"), mask.convert("L")
    if not mask.getbbox():
        return source.copy()
    workflow = Path(workflow) if workflow else Path(__file__).resolve().parent / "comfy_workflows/ts002-inpaint.json"
    graph = json.loads(workflow.read_text(encoding="utf8"))
    model_image = source.resize((512, 512), Image.Resampling.LANCZOS).convert("RGBA")
    model_image.putalpha(ImageOps.invert(mask.resize((512, 512), Image.Resampling.NEAREST)))
    graph["1"]["inputs"]["image"] = _upload(model_image, "ddcb_edit_" + uuid.uuid4().hex + ".png")
    graph["2"]["inputs"]["ckpt_name"] = model
    graph["3"]["inputs"]["text"] = prompt
    graph["6"]["inputs"].update(seed=seed, steps=steps, cfg=cfg, sampler_name=sampler_name,
                                  scheduler=scheduler, denoise=denoise)
    graph["8"]["inputs"]["filename_prefix"] = "ddcb/" + tag
    pid = _post_json("/prompt", {"prompt": graph, "client_id": "ddcb-edit"})["prompt_id"]
    started = time.monotonic()
    while time.monotonic() - started < 600:
        history = json.loads(_get("/history/" + pid))
        if pid in history:
            result = history[pid]
            if result.get("status", {}).get("status_str") == "error":
                raise RuntimeError("ComfyUI edit failed: " + json.dumps(result["status"]))
            outputs = result.get("outputs", {}).get("8", {}).get("images", [])
            if outputs:
                query = urllib.parse.urlencode({key: outputs[0][key] for key in ("filename", "subfolder", "type")})
                generated = Image.open(io.BytesIO(_get("/view?" + query))).convert("RGB")
                generated = generated.resize(source.size, Image.Resampling.LANCZOS)
                feather = Image.composite(mask.filter(ImageFilter.GaussianBlur(1)), Image.new("L", mask.size), mask)
                output = Image.composite(generated, source, feather)
                output.info["comfy_prompt_id"] = pid
                return output
        time.sleep(0.5)
    raise TimeoutError("ComfyUI edit did not finish: " + tag)


def outpaint(image, padding, prompt, **options):
    """Extend background edges with (left, top, right, bottom) pixel padding.

    The existing image is wholly protected. Padding is generated through inpaint's
    same stored workflow and seed; it cannot recover artwork outside the source.
    """
    if len(padding) != 4 or any(not isinstance(value, int) or value < 0 for value in padding):
        raise ValueError("padding must be four nonnegative integers")
    left, top, right, bottom = padding
    source = image.convert("RGB")
    canvas = ImageOps.expand(source, border=padding, fill=source.getpixel((0, 0)))
    mask = Image.new("L", canvas.size, 255)
    mask.paste(Image.new("L", source.size, 0), (left, top))
    return inpaint(canvas, mask, prompt, **options)


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
