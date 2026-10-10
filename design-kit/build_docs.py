"""Build the README screenshots from the docs-dump test, stdlib + Pillow + Edge (headless).

Usage (from the mod folder, see design-kit/README.md):
  python design-kit/build_docs.py dump.txt docs/

Writes docs/band.png, docs/band.gif (the crabs walking), docs/crew.png and docs/tasks.png.
The dump holds what the mod draws on the desktop surface for demo data: the same SVGs and
texts the app shows, laid out here with plain HTML flexbox in the app's dark colours.
"""
import html
import json
import os
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image

EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
CELL = 8  # px per layout cell (gap, margin) on the desktop surface
SCALE = 2

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
out = pathlib.Path(sys.argv[2]).resolve()
out.mkdir(parents=True, exist_ok=True)
line = next(l for l in src.splitlines() if l.strip().startswith("Received:"))
dump = json.loads(json.loads(line.split("Received:", 1)[1].strip()))


def node(n):
    """One drawn element as HTML."""
    if n is None or n is False:
        return ""
    if isinstance(n, str):
        return html.escape(n)
    if isinstance(n, list):
        return "".join(node(c) for c in n)
    t, p, kids = n.get("type"), n.get("props") or {}, n.get("children") or []
    inner = "".join(node(c) for c in kids)
    if t == "Svg":
        return f'<span class="svg" style="width:{p["width"]}px;height:{p["height"]}px">{p["source"]}</span>'
    if t == "Box":
        style = ["display:flex", f"flex-direction:{p.get('flexDirection', 'column')}"]
        for key, css in (("justifyContent", "justify-content"), ("alignItems", "align-items")):
            if key in p:
                style.append(f"{css}:{p[key]}")
        for key, css in (("gap", "gap"), ("marginLeft", "margin-left"), ("marginTop", "margin-top")):
            if key in p:
                style.append(f"{css}:{p[key] * CELL}px")
        if "flexShrink" in p:
            style.append(f"flex-shrink:{p['flexShrink']}")
        return f'<div style="{";".join(style)}">{inner}</div>'
    if t == "Text":
        style = []
        if "color" in p:
            style.append(f"color:{p['color']}")
        if p.get("bold"):
            style.append("font-weight:600")
        if p.get("strikethrough"):
            style.append("text-decoration:line-through")
        if kids and all(isinstance(c, str) and c and set(c) <= set("█░") for c in kids):
            # bar cells: one character per cell, as in a monospace grid
            style.append("font-family:Consolas,monospace;font-size:12px;letter-spacing:-0.5px")
        return f'<span style="{";".join(style)}">{inner}</span>'
    if t == "Button":
        cls = "btn plain" if p.get("plain") else "btn"
        if p.get("dimColor"):
            cls += " dim"
        return f'<span class="{cls}">{inner or html.escape(p.get("label", ""))}</span>'
    return inner


CSS = """
:root{color-scheme:dark}
body{margin:0;background:#1f1e1d;color:#e8e6e3;font:14px 'Segoe UI Variable','Segoe UI',system-ui,sans-serif}
.svg{display:inline-flex;line-height:0}
.btn{display:inline-flex;align-items:center;white-space:pre;background:#3a3937;border-radius:7px;padding:3px 10px;color:#e8e6e3}
.btn.plain{background:none;padding:2px 0}
.btn.dim{color:#9a968f}
.band{background:#262624;border-radius:14px;padding:12px 16px}
.prompt{margin-top:10px;border:1px solid #3d3c3a;border-radius:12px;padding:13px 16px;color:#8a8780}
.pane{background:#262624;border-radius:14px;padding:14px 16px}
.pane h2{font-size:14px;font-weight:600;margin:0 0 10px;color:#e8e6e3}
.pane .btn.plain{display:flex}
"""


def page(body, width):
    return f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body><div id="shot" style="width:{width}px;padding:20px">{body}</div></body></html>'


def crop(img, pad=20):
    """Cuts the page background away around the content, keeping `pad` (scaled) pixels."""
    rgb = img.convert("RGB")
    bg = rgb.getpixel((1, 1))
    diff = Image.new("RGB", rgb.size, bg)
    from PIL import ImageChops
    box = ImageChops.difference(rgb, diff).getbbox()
    if not box:
        return rgb
    p = pad * SCALE
    return rgb.crop((max(0, box[0] - p), max(0, box[1] - p), min(rgb.width, box[2] + p), min(rgb.height, box[3] + p)))


def shoot(markup, width, height, png):
    """Renders the page in headless Edge (dark scheme) at SCALE and crops it to the content."""
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(markup)
        path = f.name
    try:
        subprocess.run(
            [EDGE, "--headless", "--disable-gpu", "--hide-scrollbars", f"--force-device-scale-factor={SCALE}",
             "--blink-settings=preferredColorScheme=0", f"--window-size={width + 40},{height + 40}",
             f"--screenshot={png}", pathlib.Path(path).as_uri()],
            check=True, capture_output=True, timeout=60,
        )
    finally:
        os.unlink(path)
    img = crop(Image.open(png))
    img.save(png, optimize=True)
    return img


BAND_W = 112 * CELL
band_html = lambda frame: page(f'<div class="band">{node(frame)}</div><div class="prompt">Nachricht eingeben …</div>', BAND_W)
BAND_H = 150

frames = []
for i, frame in enumerate(dump["frames"]):
    img = shoot(band_html(frame), BAND_W, BAND_H, str(out / f"_frame{i}.png")).convert("RGB")
    frames.append(img)
    os.unlink(out / f"_frame{i}.png")
# every frame cropped alike: the first frame's size
size = frames[0].size
frames = [f.crop((0, 0, *size)) if f.size != size else f for f in frames]
frames[3].save(out / "band.png", optimize=True)
gif = [f.resize((f.width // 2, f.height // 2), Image.LANCZOS).quantize(colors=128, method=Image.Quantize.MEDIANCUT) for f in frames]
gif[0].save(out / "band.gif", save_all=True, append_images=gif[1:], duration=250, loop=0, optimize=True)

PANE_W = 460
shoot(page(f'<div class="pane"><h2>Crew</h2>{node(dump["crew"])}</div>', PANE_W), PANE_W, 640, str(out / "crew.png"))
TASKS_W = 52 * CELL + 32
shoot(page(f'<div class="pane"><h2>Aufgaben</h2>{node(dump["tasks"])}</div>', TASKS_W), TASKS_W, 560, str(out / "tasks.png"))
cards = "".join(
    f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:150px">{c["svg"]}'
    f'<span style="color:{c["accent"]};font-weight:600;font-size:15px">{html.escape(c["name"])}</span></div>'
    for c in dump["lineup"]
)
LINE_W = 6 * 150 + 5 * 16
shoot(page(f'<div class="pane" style="display:flex;gap:16px;padding:20px 24px">{cards}</div>', LINE_W + 48), LINE_W + 48, 200, str(out / "lineup.png"))
print("written", *sorted(p.name for p in out.iterdir()))
