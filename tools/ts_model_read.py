"""Read a Digimon Story Time Stranger model (.geom) and dump it for inspection.

Usage (run with tools/.venv python):
  python -I ts_model_read.py <file.geom>                  print what the file holds
  python -I ts_model_read.py <file.geom> --glb out.glb    write a glTF binary (mesh, skin, textures)
  python -I ts_model_read.py <file.geom> --png out.png    draw it (front and side), for a quick look
  ... --images <dir>   where the .img textures are (default: images/ beside the .geom)
  ... --all            also the meshes left out by default: those with no colour texture
                       (the black outline shell) and those drawn blended (the shine laid
                       over each eye), which a plain viewer shows as solid shapes
  ... --overlays       with --png: lay the two overlay textures of a face material over
                       the colour texture. How the game's shader mixes them was not read:
                       this takes OverlayColorSampler2 as the picture with a hole (alpha 0)
                       where OverlayColorSampler shows, on TEXCOORD2 and TEXCOORD1.

The file is one block with offsets from its start. Read from "Digimon Story Time
Stranger.exe" (Steam build 23514637, image base 0x140000000) where an address is given;
"data" marks what was read from the files only and how it was checked. README, "Time
Stranger models", has the same in full.

  header (loader 0x1402dec00)
    +0x00 u32 0x13c, the only version the loader takes (0x1402dedcf)
    +0x04 u16 meshes, +0x06 u16 materials (data), +0x08 and +0x0a u16 counts of the
          tables at +0x58 and +0x60 (0x1402e05a3, 0x1402e05f0), +0x0c u32 bones (data:
          equals the skeleton's count)
    +0x30 u32 flags: 0x10 vertex data in <name>.vert (0x1402dee09), 0x04 names in
          <name>.name (0x1402df04d)
    +0x38 u32 size of the skeleton block, +0x40 u32 size of the .vert file
    +0x48 meshes, 0x80 bytes each       +0x50 materials
    +0x58 and +0x60 records of 0x80 and of 0x38 bytes, each tied to the bone whose hash
          it starts with (0x1402e04b3, 0x1402e0640); not read further
    +0x68 one 3x4 float matrix a bone (data: times the bone's rest matrix it gives the
          unit matrix, so it is the inverse bind matrix; true of every bone in 495 of the
          532 chrNNN.geom, the rest have a few face and effect bones posed otherwise)
    +0x78 names (NUL-ended strings)     +0x90 name table: u32 bones, u32 materials,
          then the offset of a list of name offsets for each (0x1402def60)
    +0x98 skeleton block, or 0 and it is in <name>.skel (0x1402df2de, 0x1402df372)
  mesh
    +0x00 vertices, +0x08 indices (u16), +0x10 bone palette (u32 skeleton bones) (data:
          each ends where the next begins, at count * size)
    +0x20 vertex attributes (0x1402df27b), 8 bytes each: u8 kind, u16 +2 components,
          u16 +4 number type, u16 +6 offset in the vertex (0x14035f260, which makes the
          Direct3D input layout: kinds by the table at 0x14165bd30 are 1 POSITION,
          2 NORMAL, 3 TANGENT, 4 BINORMAL, 5-8 TEXCOORD 0-3, 9 COLOR, 10 BLENDINDICES,
          11 BLENDWEIGHT; number types 7 s16 normalised, 8 half float, 9 float; COLOR
          and BLENDINDICES of type 0 are bytes)
    +0x28 u16 palette size, +0x2a u16 attributes, +0x2c u32 bytes a vertex (data)
          A TEXCOORD is (u, v) with v counted from the bottom row of the picture (data:
          taken from the top row, as this reader did until TS-207, every model is wrongly
          painted but for what is the same upside down: Guilmon's face got its jaw's white,
          its belly lost its mark, its eyes took the last row of the eye sheet, the narrowed
          ones, instead of the first. Turned, Guilmon, Agumon, Coronamon and Goburimon are
          each painted as the Digimon is, and the halves of marks that are cut at a
          picture's edge meet). read_geom gives v already turned, 1 - v.
    +0x30 u8 weights a vertex (data), +0x31 u8 5 or 1, kept for each mesh by the loader
          (0x1402df1d5), meaning not read. The indices are a triangle strip with repeated
          indices between its pieces whichever it is (data: the count is seldom a
          multiple of 3 and four in ten of the strip's triangles are empty)
    +0x34 u32 hash of the name, +0x38 name, +0x40 u32 material, +0x44 u32 vertices,
          +0x48 u32 indices (data)
  material (walked at 0x1402df51a)
    +0x000 u32 hash of its name; the names are the second list of the name table, in
          another order (data)
    +0x320 u8 shader parameters, +0x321 u8 render states, then 0x20 bytes for each:
    +0x10 u16 id, +0x12 u8 number of floats (0: a texture, 100: a render state)
    a texture: +0 s32 name, +8 s32 length of the name (0x1402df666)
    The ids are rows of the table at 0x141ac4f00 (0x38 bytes: hash, name, id, kind, size).
  skeleton, "60SE" (offsets inside it count from the field that holds them, 0x1402e054a)
    +0x10 u16 bones, +0x20 offset of the bones' name hashes (0x1402e054a; data: the
          hash is crc32(name) without the final inversion)
    +0x18 offset of the rest pose, 12 floats a bone: rotation x y z w, position x y z 1,
          scale x y z 1; +0x3c u32 pairs; +0x40 the pairs, u16 bone and u16 parent
          (0x7fff: none; bit 15 is set on a few parents, its meaning was not read)
          (data: checked with the inverse bind matrices)
  texture (.img): a DDS file with a DX10 header (BC1 and BC7 in the models read so far).
"""
import io
import json
import os
import struct
import sys
import zlib

import numpy as np

VERSION = 0x13C
KINDS = {1: "POSITION", 2: "NORMAL", 3: "TANGENT", 4: "BINORMAL", 5: "TEXCOORD0",
         6: "TEXCOORD1", 7: "TEXCOORD2", 8: "TEXCOORD3", 9: "COLOR", 10: "BLENDINDICES",
         11: "BLENDWEIGHT", 12: "PSIZE", 13: "COLOR1"}
NUMBER = {0: "u1", 7: "<i2", 8: "<f2", 9: "<f4"}
# Rows of the executable's shader parameter table (0x141ac4f00): every id that a material of
# a chrNNN.geom of app_0 uses.
PARAMS = {0x18: "ColorSampler", 0x19: "DiffuseColor", 0x1b: "NormalSampler", 0x1c: "Bumpiness",
          0x1e: "SpecularStrength", 0x1f: "SpecularPower", 0x20: "EnvSampler",
          0x21: "ReflectionStrength", 0x2a: "OverlayColorSampler",
          0x2b: "OverlayNormalSampler", 0x2c: "OverlayBumpiness", 0x2d: "OverlayStrength",
          0x2e: "CLUTSampler", 0x35: "ParallaxBiasX", 0x36: "ParallaxStrength", 0x3a: "Time",
          0x3b: "ScrollSpeedSet1", 0x3e: "ScrollSpeedSet2", 0x41: "ScrollSpeedSet3",
          0x44: "OffsetSet1", 0x47: "OffsetSet2", 0x4a: "DistortionStrength",
          0x50: "AlphaTestRef", 0x5a: "OffsetSet3", 0x5d: "Fat", 0x64: "RotationSet3",
          0x67: "ScaleSet1", 0x74: "EnvsSampler", 0x75: "InnerGrowAValue", 0x7b: "alpha_func",
          0x7c: "alpha_test_enable", 0x7d: "blend_func", 0x7e: "blend_equation",
          0x7f: "blend_enable", 0x81: "cull_face_enable", 0x83: "depth_mask",
          0x8e: "alpha_to_coverage_enable", 0x95: "LocalIntensity", 0x96: "InnerGrowAColor",
          0x99: "ViewOffset", 0x9a: "MetalicValue", 0x9b: "RoughnessValue",
          0x9c: "PBRRefrectionRoughness", 0x9d: "PBRMaskSampler", 0x9f: "BloomStrength",
          0xa1: "OverlayColorSampler2", 0xa4: "OverlayStrength2",
          0xa7: "OverlayNormalSampler2", 0xaa: "RgbaMaskSampler", 0xab: "OverlayMaskSampler",
          0xac: "OverlayMaskSampler2", 0xaf: "OverlayBumpiness2", 0xb6: "ShadowBias",
          0xd1: "ProjTexSampler", 0xda: "IsHeatMap", 0xdb: "HeatMapColorB",
          0xdc: "HeatMapColorG", 0xe3: "ProjTexStrength", 0xff: "ReverseFresnelBase",
          0x100: "ReverseFresnelSub", 0x101: "ReverseFresnelRange",
          0x10b: "LightWeightSampler", 0x11d: "OverlayDistortionSampler",
          0x11e: "OverlayDistortionStrength", 0x120: "OverlayDistortionStrength2",
          0x122: "OverlayDistortionStrength3", 0x124: "OverlayDistortionStrength4",
          0x12a: "OverlayPBRMaskSampler2", 0x12d: "EmissiveColor", 0x12e: "EmissiveIntensity",
          0x12f: "EmissiveSampler", 0x131: "ScratchMaskSampler", 0x132: "ScratchBorder",
          0x133: "VerticalWaveSpeed", 0x134: "VerticalWaveScal", 0x135: "HorizontalWaveSpeed",
          0x136: "HorizontalWaveScal", 0x137: "Normal2Sampler", 0x138: "Normal2Strength",
          0x139: "MulDiffuseAlphaSampler", 0x13a: "VertexColorDegamma",
          0x14f: "WindLocalDirection", 0x150: "WindLocalPower", 0x151: "WindLocalRightVector",
          0x152: "ReflectionOverRayBlend", 0x161: "DistortionNormalSampler",
          0x162: "DistortionNormalStrength", 0x1a8: "AmbientModelIntensity",
          0x1ae: "DirectColorFilterColor"}
NO_PARENT = 0x7FFF


def name_hash(name):
    """crc32 without its final inversion: the hash of a bone, mesh or material name."""
    return zlib.crc32(name.encode()) ^ 0xFFFFFFFF


def read_skeleton(d, sk):
    if d[sk:sk + 4] != b"60SE":
        raise ValueError("no 60SE skeleton at 0x%x" % sk)
    n = struct.unpack_from("<H", d, sk + 0x10)[0]
    rel = lambda o: sk + o + struct.unpack_from("<I", d, sk + o)[0]
    rest, hashes = rel(0x18), rel(0x20)
    npair = struct.unpack_from("<I", d, sk + 0x3C)[0]
    pairs = struct.unpack_from("<%dH" % (npair * 2), d, sk + 0x40)
    parent, marked = [-1] * n, [False] * n
    for i in range(npair):
        child, up = pairs[2 * i], pairs[2 * i + 1]
        parent[child] = -1 if up & NO_PARENT == NO_PARENT else up & NO_PARENT
        marked[child] = bool(up & 0x8000) and up & NO_PARENT != NO_PARENT
    bones = []
    for i in range(n):
        f = struct.unpack_from("<12f", d, rest + 48 * i)
        bones.append({"hash": struct.unpack_from("<I", d, hashes + 4 * i)[0], "parent": parent[i],
                      "parent_marked": marked[i],
                      "rotation": f[0:4], "position": f[4:7], "scale": f[8:11]})
    return bones


def read_geom(path):
    d = open(path, "rb").read()
    version, nmesh, nmat, nrec80, nrec38, nbone = struct.unpack_from("<IHHHHI", d, 0)
    if version != VERSION:
        raise ValueError("version 0x%x, the loader only takes 0x%x" % (version, VERSION))
    flags = struct.unpack_from("<I", d, 0x30)[0]
    if flags & 0x10:
        raise ValueError("vertex data is in a .vert file; not read here")
    if flags & 0x04:
        raise ValueError("names are in a .name file; not read here")
    p_mesh, p_mat = struct.unpack_from("<QQ", d, 0x48)
    p_ibm, = struct.unpack_from("<Q", d, 0x68)
    p_str, = struct.unpack_from("<Q", d, 0x78)
    p_names, p_skel = struct.unpack_from("<QQ", d, 0x90)
    text = lambda o: d[p_str + o:d.index(b"\0", p_str + o)].decode("ascii", "replace")

    nbn, nmn, p_bn, p_mn = struct.unpack_from("<IIQQ", d, p_names)
    bone_names = [text(struct.unpack_from("<Q", d, p_bn + 8 * i)[0]) for i in range(nbn)]
    mat_names = [text(struct.unpack_from("<Q", d, p_mn + 8 * i)[0]) for i in range(nmn)]

    if p_skel:
        bones = read_skeleton(d, p_skel)
    else:
        sd = open(os.path.splitext(path)[0] + ".skel", "rb").read()
        bones = read_skeleton(sd, 0)
    for i, b in enumerate(bones):
        b["name"] = bone_names[i] if i < len(bone_names) else "bone%d" % i
        if name_hash(b["name"]) != b["hash"]:
            raise ValueError("bone %d: name %r does not have the skeleton's hash" % (i, b["name"]))
        m = np.eye(4)
        if p_ibm:
            m[:3, :] = np.array(struct.unpack_from("<12f", d, p_ibm + 48 * i)).reshape(3, 4)
        b["inverse_bind"] = m

    by_hash = {name_hash(n): n for n in mat_names}
    materials = []
    o = p_mat
    for m in range(nmat):
        nparam, nstate = d[o + 0x320], d[o + 0x321]
        params = []
        for i in range(nparam + nstate):
            e = o + 0x328 + i * 0x20
            pid, nfloat = struct.unpack_from("<HB", d, e + 0x10)
            if nfloat == 0:
                value = text(struct.unpack_from("<i", d, e)[0])
            elif nfloat <= 4:
                value = struct.unpack_from("<%df" % nfloat, d, e)
            else:
                value = struct.unpack_from("<4I", d, e)
            params.append({"id": pid, "name": PARAMS.get(pid, "0x%x" % pid), "floats": nfloat, "value": value})
        mat_hash, = struct.unpack_from("<I", d, o)
        materials.append({"name": by_hash.get(mat_hash, "material%d" % m), "params": params})
        o += 0x328 + (nparam + nstate) * 0x20

    meshes = []
    for m in range(nmesh):
        o = p_mesh + m * 0x80
        p_vert, p_idx, p_pal = struct.unpack_from("<QQQ", d, o)
        p_attr, = struct.unpack_from("<Q", d, o + 0x20)
        npal, nattr, stride = struct.unpack_from("<HHI", d, o + 0x28)
        nweight = d[o + 0x30]
        p_name, = struct.unpack_from("<Q", d, o + 0x38)
        mat, nvert, nidx = struct.unpack_from("<III", d, o + 0x40)
        attrs = {}
        for i in range(nattr):
            kind, comps, number, off = struct.unpack_from("<BxHHH", d, p_attr + 8 * i)
            a = np.ndarray((nvert, comps), NUMBER[number], d, p_vert + off, (stride, np.dtype(NUMBER[number]).itemsize))
            a = np.array(a)
            if 5 <= kind <= 8:
                # A texture coordinate's second number counts from the picture's LAST row: 0 is
                # the bottom of the picture as its .img (a DDS, first row on top) is decoded.
                # Given here turned (1 - v), so that it counts rows from the top like u counts
                # columns. Data, not read from the executable: see the note at the top.
                a = a.astype(np.float64)
                a[:, 1] = 1.0 - a[:, 1]
            attrs[KINDS.get(kind, "kind%d" % kind)] = a
        strip = np.frombuffer(d, "<u2", nidx, p_idx)
        meshes.append({"name": text(p_name), "material": mat, "weights": nweight,
                       "attributes": attrs, "strip": strip, "triangles": strip_triangles(strip),
                       "byte31": d[o + 0x31],
                       "palette": list(struct.unpack_from("<%dI" % npal, d, p_pal)), "vertices": nvert})
    return {"meshes": meshes, "materials": materials, "bones": bones,
            "counts": {"records80": nrec80, "records38": nrec38, "bones": nbone}, "flags": flags}


def strip_triangles(strip):
    """The triangles of a strip, the winding turned on every second one; empty ones dropped."""
    s = strip.astype(np.int64)
    a, b, c = s[:-2].copy(), s[1:-1].copy(), s[2:].copy()
    odd = np.arange(len(a)) % 2 == 1
    a[odd], b[odd] = s[1:-1][odd], s[:-2][odd]
    keep = (a != b) & (b != c) & (a != c)
    return np.stack([a[keep], b[keep], c[keep]], 1)


def param(material, name):
    for p in material["params"]:
        if p["name"] == name:
            return p["value"]
    return None


def load_image(images, name):
    from PIL import Image
    path = os.path.join(images, name + ".img")
    if not os.path.exists(path):
        return None
    b = bytearray(open(path, "rb").read())
    if b[0x54:0x58] == b"DX10" and struct.unpack_from("<I", b, 0x80)[0] == 72:
        struct.pack_into("<I", b, 0x80, 71)  # BC1 sRGB: the same blocks as BC1, which Pillow reads
    return Image.open(io.BytesIO(bytes(b)), formats=["DDS"]).convert("RGBA")


def dds_format(images, name):
    path = os.path.join(images, name + ".img")
    if not os.path.exists(path):
        return "missing"
    h = open(path, "rb").read(0x94)
    height, width = struct.unpack_from("<II", h, 12)
    fourcc = h[0x54:0x58]
    return "%dx%d %s" % (width, height, "DXGI %d" % struct.unpack_from("<I", h, 0x80)[0] if fourcc == b"DX10" else fourcc.decode())


def rest_world(bones):
    """Each bone's rest matrix in model space. A parent may come after its child in the list."""
    out = [None] * len(bones)

    def world(i):
        if out[i] is None:
            b = bones[i]
            x, y, z, w = b["rotation"]
            r = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
                          [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
                          [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
            m = np.eye(4)
            m[:3, :3] = r * np.array(b["scale"])
            m[:3, 3] = b["position"]
            out[i] = m if b["parent"] < 0 else world(b["parent"]) @ m
        return out[i]

    return [world(i) for i in range(len(bones))]


def info(g, images):
    print("%d meshes, %d materials, %d bones, %d and %d records in the tables at +0x58 and +0x60" % (
        len(g["meshes"]), len(g["materials"]), len(g["bones"]), g["counts"]["records80"], g["counts"]["records38"]))
    worst = max(float(np.abs(b["inverse_bind"] @ w - np.eye(4)).max()) for b, w in zip(g["bones"], rest_world(g["bones"])))
    print("inverse bind matrix times rest matrix: largest difference from the unit matrix %.6f" % worst)
    for i, b in enumerate(g["bones"]):
        print("  bone %2d %-16s parent %-16s position %7.3f %7.3f %7.3f" % (
            i, b["name"], g["bones"][b["parent"]]["name"] if b["parent"] >= 0 else "-", *b["position"]))
    for i, m in enumerate(g["meshes"]):
        pos = m["attributes"]["POSITION"]
        print("  mesh %d %-12s material %d (%s): %d vertices, %d strip indices, %d triangles, palette %d, weights %d" % (
            i, m["name"], m["material"], g["materials"][m["material"]]["name"], m["vertices"], len(m["strip"]),
            len(m["triangles"]), len(m["palette"]), m["weights"]))
        print("      " + ", ".join("%s %s x%d" % (k, v.dtype, v.shape[1]) for k, v in m["attributes"].items()))
        print("      x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f" % (
            pos[:, 0].min(), pos[:, 0].max(), pos[:, 1].min(), pos[:, 1].max(), pos[:, 2].min(), pos[:, 2].max()))
    for i, m in enumerate(g["materials"]):
        print("  material %d %s" % (i, m["name"]))
        for p in m["params"]:
            if p["floats"] == 0:
                print("      %-24s %s (%s)" % (p["name"], p["value"], dds_format(images, p["value"])))
            elif p["floats"] <= 4:
                print("      %-24s %s" % (p["name"], " ".join("%.4g" % v for v in p["value"])))
            else:
                print("      %-24s %s" % (p["name"], " ".join("%x" % v for v in p["value"])))


def drawn(g, everything):
    """The meshes to show: unless asked for, not those without a colour texture or drawn blended."""
    def plain(m):
        mat = g["materials"][m["material"]]
        return param(mat, "ColorSampler") and not (param(mat, "blend_enable") or (0,))[0]
    return [m for m in g["meshes"] if everything or plain(m)]


def write_glb(g, images, out, outline):
    from PIL import Image
    binary = bytearray()
    views, accessors = [], []

    def add(arr, target=None, minmax=False):
        arr = np.ascontiguousarray(arr)
        while len(binary) % 4:
            binary.append(0)
        view = {"buffer": 0, "byteOffset": len(binary), "byteLength": arr.nbytes}
        if target:
            view["target"] = target
        binary.extend(arr.tobytes())
        views.append(view)
        comp = {"float32": 5126, "uint16": 5123, "uint32": 5125, "uint8": 5121}[arr.dtype.name]
        kind = {1: "SCALAR", 2: "VEC2", 3: "VEC3", 4: "VEC4", 16: "MAT4"}[1 if arr.ndim == 1 else arr.shape[1]]
        acc = {"bufferView": len(views) - 1, "componentType": comp, "count": len(arr), "type": kind}
        if minmax:
            acc["min"], acc["max"] = arr.min(0).tolist(), arr.max(0).tolist()
        accessors.append(acc)
        return len(accessors) - 1

    bones = g["bones"]
    nodes = []
    for b in bones:
        nodes.append({"name": b["name"], "rotation": list(b["rotation"]), "translation": list(b["position"]),
                      "scale": list(b["scale"])})
    for i, b in enumerate(bones):
        if b["parent"] >= 0:
            nodes[b["parent"]].setdefault("children", []).append(i)
    ibm = np.stack([b["inverse_bind"].T.reshape(16) for b in bones]).astype(np.float32)
    skin = {"joints": list(range(len(bones))), "inverseBindMatrices": add(ibm)}

    images_json, textures, tex_of = [], [], {}

    def texture(name):
        if name not in tex_of:
            img = load_image(images, name)
            if img is None:
                tex_of[name] = None
            else:
                buf = io.BytesIO()
                img.save(buf, "PNG")
                while len(binary) % 4:
                    binary.append(0)
                views.append({"buffer": 0, "byteOffset": len(binary), "byteLength": buf.tell()})
                binary.extend(buf.getvalue())
                images_json.append({"bufferView": len(views) - 1, "mimeType": "image/png", "name": name})
                textures.append({"source": len(images_json) - 1, "sampler": 0})
                tex_of[name] = len(textures) - 1
        return tex_of[name]

    materials = []
    for m in g["materials"]:
        pbr = {"metallicFactor": 0.0, "roughnessFactor": 1.0}
        colour = param(m, "ColorSampler")
        if colour and texture(colour) is not None:
            pbr["baseColorTexture"] = {"index": texture(colour)}
        elif param(m, "DiffuseColor"):
            pbr["baseColorFactor"] = list(param(m, "DiffuseColor"))
        mat = {"name": m["name"], "pbrMetallicRoughness": pbr, "doubleSided": True}
        blend = param(m, "blend_enable")
        if blend and blend[0]:
            mat["alphaMode"] = "BLEND"
        materials.append(mat)

    mesh_json, mesh_nodes = [], []
    for m in drawn(g, outline):
        a = m["attributes"]
        nv = m["vertices"]
        prim = {"attributes": {"POSITION": add(a["POSITION"][:, :3].astype(np.float32), 34962, True)},
                "indices": add(m["triangles"].astype(np.uint32).reshape(-1), 34963), "material": m["material"]}
        if "NORMAL" in a:
            n = a["NORMAL"].astype(np.float32)
            n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-8)
            prim["attributes"]["NORMAL"] = add(n, 34962)
        for k in range(4):
            if "TEXCOORD%d" % k in a:
                prim["attributes"]["TEXCOORD_%d" % k] = add(a["TEXCOORD%d" % k].astype(np.float32), 34962)
        palette = np.array(m["palette"], np.uint16)
        if "BLENDINDICES" in a:
            w = np.zeros((nv, 4), np.float32)
            j = np.zeros((nv, 4), np.uint16)
            w[:, :a["BLENDWEIGHT"].shape[1]] = a["BLENDWEIGHT"]
            j[:, :a["BLENDINDICES"].shape[1]] = palette[a["BLENDINDICES"].astype(np.int64)]
            j[w == 0] = 0
            w /= np.maximum(w.sum(1, keepdims=True), 1e-8)
        else:  # one bone and no weights: the whole mesh goes with that bone
            j = np.zeros((nv, 4), np.uint16)
            j[:, 0] = palette[0]
            w = np.zeros((nv, 4), np.float32)
            w[:, 0] = 1
        prim["attributes"]["JOINTS_0"] = add(j.astype(np.uint16), 34962)
        prim["attributes"]["WEIGHTS_0"] = add(w, 34962)
        mesh_json.append({"name": m["name"], "primitives": [prim]})
        nodes.append({"name": "mesh_%s_%s" % (m["name"], g["materials"][m["material"]]["name"]),
                      "mesh": len(mesh_json) - 1, "skin": 0})
        mesh_nodes.append(len(nodes) - 1)

    roots = [i for i, b in enumerate(bones) if b["parent"] < 0] + mesh_nodes
    gltf = {"asset": {"version": "2.0", "generator": "tools/ts_model_read.py"}, "scene": 0,
            "scenes": [{"nodes": roots}], "nodes": nodes, "meshes": mesh_json, "skins": [skin],
            "materials": materials, "accessors": accessors, "bufferViews": views,
            "samplers": [{"wrapS": 10497, "wrapT": 10497, "magFilter": 9729, "minFilter": 9987}]}
    if textures:
        gltf["textures"], gltf["images"] = textures, images_json
    while len(binary) % 4:
        binary.append(0)
    gltf["buffers"] = [{"byteLength": len(binary)}]
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    with open(out, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(js) + 8 + len(binary)))
        f.write(struct.pack("<I4s", len(js), b"JSON") + js)
        f.write(struct.pack("<I4s", len(binary), b"BIN\0") + bytes(binary))
    return len(mesh_json), len(textures)


def draw(g, images, out, outline, overlays=False, size=640):
    """Front and side views without perspective: colour texture, a little shading, no blending."""
    from PIL import Image
    meshes = drawn(g, outline)
    allpos = np.concatenate([m["attributes"]["POSITION"][:, :3] for m in meshes]).astype(np.float64)
    lo, hi = allpos.min(0), allpos.max(0)
    centre, span = (lo + hi) / 2, (hi - lo).max() * 1.08
    views = [(np.array([1.0, 0, 0]), np.array([0, 0, 1.0])), (np.array([0, 0, -1.0]), np.array([1.0, 0, 0]))]
    canvas = np.full((size, size * len(views), 3), 255, np.uint8)
    for vi, (right, toward) in enumerate(views):
        colour = np.full((size, size, 3), 235.0)
        depth = np.full((size, size), -1e9)
        for m in meshes:
            a = m["attributes"]
            p = a["POSITION"][:, :3].astype(np.float64) - centre
            sx = (p @ right / span + 0.5) * size
            sy = (0.5 - p[:, 1] / span) * size
            sz = p @ toward
            mat = g["materials"][m["material"]]
            tex = load_image(images, param(mat, "ColorSampler")) if param(mat, "ColorSampler") else None
            tex = np.asarray(tex)[:, :, :3].astype(np.float64) if tex is not None else None
            over = []
            if overlays and "TEXCOORD2" in a:
                for key, uvk in (("OverlayColorSampler2", "TEXCOORD2"), ("OverlayColorSampler", "TEXCOORD1")):
                    im = load_image(images, param(mat, key)) if param(mat, key) else None
                    over.append((np.asarray(im).astype(np.float64), a[uvk].astype(np.float64)) if im is not None else None)
            base = np.array((param(mat, "DiffuseColor") or (1, 1, 1, 1))[:3]) * 255
            uv = a["TEXCOORD0"].astype(np.float64) if "TEXCOORD0" in a else None
            nrm = a["NORMAL"].astype(np.float64) if "NORMAL" in a else None
            for t in m["triangles"]:
                x, y, z = sx[t], sy[t], sz[t]
                x0, x1 = max(int(np.floor(x.min())), 0), min(int(np.ceil(x.max())), size - 1)
                y0, y1 = max(int(np.floor(y.min())), 0), min(int(np.ceil(y.max())), size - 1)
                if x0 > x1 or y0 > y1:
                    continue
                den = (y[1] - y[2]) * (x[0] - x[2]) + (x[2] - x[1]) * (y[0] - y[2])
                if abs(den) < 1e-12:
                    continue
                gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
                w0 = ((y[1] - y[2]) * (gx - x[2]) + (x[2] - x[1]) * (gy - y[2])) / den
                w1 = ((y[2] - y[0]) * (gx - x[2]) + (x[0] - x[2]) * (gy - y[2])) / den
                w2 = 1 - w0 - w1
                zz = w0 * z[0] + w1 * z[1] + w2 * z[2]
                sub = depth[y0:y1 + 1, x0:x1 + 1]
                inside = (w0 >= 0) & (w1 >= 0) & (w2 >= 0) & (zz > sub)
                if not inside.any():
                    continue
                if tex is not None and uv is not None:
                    u = (w0 * uv[t[0], 0] + w1 * uv[t[1], 0] + w2 * uv[t[2], 0]) % 1.0
                    v = (w0 * uv[t[0], 1] + w1 * uv[t[1], 1] + w2 * uv[t[2], 1]) % 1.0
                    c = tex[(v * tex.shape[0]).astype(int) % tex.shape[0], (u * tex.shape[1]).astype(int) % tex.shape[1]]
                else:
                    c = np.broadcast_to(base, gx.shape + (3,))
                if len(over) == 2 and over[0] and over[1]:
                    s2, s1 = [o[0][((w0 * o[1][t[0], 1] + w1 * o[1][t[1], 1] + w2 * o[1][t[2], 1]) % 1.0 * o[0].shape[0]).astype(int) % o[0].shape[0],
                                   ((w0 * o[1][t[0], 0] + w1 * o[1][t[1], 0] + w2 * o[1][t[2], 0]) % 1.0 * o[0].shape[1]).astype(int) % o[0].shape[1]]
                              for o in over]
                    k = (s1[..., 3:] / 255.0) * (1 - s2[..., 3:] / 255.0)
                    c = s2[..., :3] * (1 - k) + s1[..., :3] * k
                if nrm is not None:
                    n = nrm[t].mean(0)
                    n /= max(np.linalg.norm(n), 1e-8)
                    c = c * (0.7 + 0.3 * abs(float(n @ toward)))
                sub[inside] = zz[inside]
                colour[y0:y1 + 1, x0:x1 + 1][inside] = c[inside]
        canvas[:, vi * size:(vi + 1) * size] = np.clip(colour, 0, 255).astype(np.uint8)
    Image.fromarray(canvas).save(out)
    return [m["name"] + "/" + g["materials"][m["material"]]["name"] for m in meshes]


def main():
    args = sys.argv[1:]
    opts, pos = {}, []
    i = 0
    while i < len(args):
        if args[i] in ("--glb", "--png", "--images"):
            opts[args[i][2:]] = args[i + 1]
            i += 1
        elif args[i] in ("--all", "--overlays"):
            opts[args[i][2:]] = True
        else:
            pos.append(args[i])
        i += 1
    if len(pos) != 1:
        sys.exit(__doc__)
    images = opts.get("images") or os.path.join(os.path.dirname(os.path.abspath(pos[0])), "images")
    g = read_geom(pos[0])
    if "glb" in opts:
        print("%s: %d meshes, %d textures" % ((opts["glb"],) + write_glb(g, images, opts["glb"], opts.get("all"))))
    if "png" in opts:
        print("%s: drew %s" % (opts["png"], ", ".join(draw(g, images, opts["png"], opts.get("all"), opts.get("overlays")))))
    if "glb" not in opts and "png" not in opts:
        info(g, images)


if __name__ == "__main__":
    main()
