"""Render a crab costume spec (JSON) to a PNG preview, stdlib only.

Usage: python render_crab.py <spec.json> <out.png>

The PNG holds four views:
  top-left   big, dark background, with a pixel grid and column/row numbers
  top-right  big, light background, no grid (how it looks)
  bottom     HUD size (31 px wide, as in the prompt band) and crew-pane size (47 px wide),
             on dark and light, each blown up with hard pixels so you can judge them.
"""
import json
import pathlib
import struct
import sys
import zlib

W, ROWS = 26, 11
LEFT, TOP = 3, 4
PIXEL_H = 1.25
BODY = [
    "....oooooooooooo....",
    "....ooeooooooeoo....",
    "..oooooooooooooooo..",
    "....oooooooooooo....",
    ".....o.o....o.o.....",
]
ORANGE = "#D77757"
EYE = "#1F1A17"
DARK = (0x1A, 0x1B, 0x26)
LIGHT = (0xFA, 0xF9, 0xF5)
SHEET = (0x11, 0x11, 0x11)

DIGITS = {
    "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"], "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"], "7": ["111", "001", "001", "001", "001"],
    "8": ["111", "101", "111", "101", "111"], "9": ["111", "101", "111", "001", "111"],
}
LETTERS = {
    "O": ["111", "101", "101", "101", "111"], "I": ["111", "010", "010", "010", "111"],
    "L": ["100", "100", "100", "100", "111"], "A": ["111", "101", "111", "101", "101"],
    "G": ["111", "100", "101", "101", "111"], "S": ["111", "100", "111", "001", "111"],
}


def rgb(h):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def compose(spec):
    """Canvas of RGB tuples (None = empty): scene behind, Clawd, then the sprite on top."""
    grid = [[None] * W for _ in range(ROWS)]
    pal = spec.get("palette", {})

    def layer(rows, name):
        rows = rows or []
        if len(rows) > ROWS:
            raise SystemExit(f"{name}: {len(rows)} rows, max {ROWS}")
        for y, row in enumerate(rows):
            if len(row) != W:
                raise SystemExit(f"{name} row {y} has {len(row)} chars, need {W}")
            for x, c in enumerate(row):
                if c == ".":
                    continue
                if c not in pal:
                    raise SystemExit(f"{name} row {y} col {x}: '{c}' is not in the palette")
                grid[y][x] = rgb(pal[c])

    layer(spec.get("scene"), "scene")
    for y, row in enumerate(BODY):
        for x, c in enumerate(row):
            if c == "o":
                grid[TOP + y][LEFT + x] = rgb(ORANGE)
            elif c == "e":
                grid[TOP + y][LEFT + x] = rgb(EYE)
    layer(spec.get("sprite"), "sprite")
    return grid


def blank(w, h, color):
    return [[color] * w for _ in range(h)]


def fill(img, x0, y0, w, h, color):
    for y in range(max(0, y0), min(len(img), y0 + h)):
        row = img[y]
        for x in range(max(0, x0), min(len(row), x0 + w)):
            row[x] = color


def glyphs(img, x, y, text, font, scale, color):
    for ch in text:
        g = font.get(ch.upper())
        if g:
            for gy, line in enumerate(g):
                for gx, bit in enumerate(line):
                    if bit == "1":
                        fill(img, x + gx * scale, y + gy * scale, scale, scale, color)
        x += 4 * scale


def big(grid, spec, bg, has_grid, sx=16, sy=20):
    margin_l, margin_t = (34, 18) if has_grid else (8, 8)
    img = blank(margin_l + W * sx + 8, margin_t + ROWS * sy + 8, bg)
    for y in range(ROWS):
        for x in range(W):
            if grid[y][x]:
                fill(img, margin_l + x * sx, margin_t + y * sy, sx, sy, grid[y][x])
    label = spec.get("label")
    if label:
        bx, by = margin_l + int(label["x"] * sx), margin_t + int(label["y"] * sy)
        bw, bh = int(label["w"] * sx), int(label["h"] * sy)
        n = len(label["text"])
        scale = max(1, min(bw // (4 * n), bh // 6))
        tw = (4 * n - 1) * scale
        glyphs(img, bx + (bw - tw) // 2, by + (bh - 5 * scale) // 2, label["text"], LETTERS, scale, rgb(label["color"]))
    if has_grid:
        thin, bold, ink = (0x2A, 0x2E, 0x42), (0x46, 0x4E, 0x70), (0x9A, 0xA2, 0xC8)
        for x in range(W + 1):
            fill(img, margin_l + x * sx, margin_t, 1, ROWS * sy, bold if x % 5 == 0 else thin)
        for y in range(ROWS + 1):
            fill(img, margin_l, margin_t + y * sy, W * sx, 1, bold if y % 5 == 0 else thin)
        # body outline hint: rows 4-8 hold Clawd
        for x in range(W):
            glyphs(img, margin_l + x * sx + (2 if x >= 10 else 6), 4, str(x), DIGITS, 1, ink)
        for y in range(ROWS):
            glyphs(img, 6, margin_t + y * sy + 6, str(y), DIGITS, 2, ink)
    return img


def small(grid, bg, tw, zoom):
    """Box-filter the canvas down to tw px wide (as the app draws it), then enlarge with hard pixels."""
    th = round(tw * ROWS * PIXEL_H / W)
    out = blank(tw * zoom, th * zoom, bg)
    n = 4
    for j in range(th):
        for i in range(tw):
            acc = [0, 0, 0]
            for a in range(n):
                for b in range(n):
                    u = (i + (a + 0.5) / n) * W / tw
                    v = (j + (b + 0.5) / n) * ROWS * PIXEL_H / th
                    cx, cy = min(W - 1, int(u)), min(ROWS - 1, int(v / PIXEL_H))
                    c = grid[cy][cx] or bg
                    acc = [acc[k] + c[k] for k in range(3)]
            fill(out, i * zoom, j * zoom, zoom, zoom, tuple(round(v / (n * n)) for v in acc))
    return out


def paste(dst, src, x0, y0):
    for y, row in enumerate(src):
        dst[y0 + y][x0:x0 + len(row)] = row


def write_png(path, img):
    h, w = len(img), len(img[0])
    raw = b"".join(b"\x00" + bytes(v for px in row for v in px) for row in img)

    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    pathlib.Path(path).write_bytes(png)


def lineup(folder, out):
    """All specs in a folder side by side: big on dark, big on light, then HUD size on dark and light."""
    specs = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(pathlib.Path(folder).glob("*.json"))]
    grids = [compose(s) for s in specs]
    rows = [
        [big(g, s, DARK, False, 8, 10) for g, s in zip(grids, specs)],
        [big(g, s, LIGHT, False, 8, 10) for g, s in zip(grids, specs)],
        [small(g, DARK, 31, 4) for g in grids],
        [small(g, LIGHT, 31, 4) for g in grids],
    ]
    gap = 10
    col_w = max(len(img[0]) for row in rows for img in row)
    width = gap + len(specs) * (col_w + gap)
    height = gap + sum(max(len(img) for img in row) + gap for row in rows)
    sheet = blank(width, height, SHEET)
    y = gap
    for row in rows:
        for i, img in enumerate(row):
            paste(sheet, img, gap + i * (col_w + gap), y)
        y += max(len(img) for img in row) + gap
    write_png(out, sheet)
    print(f"ok lineup {out} ({width}x{height}): " + ", ".join(s["name"] for s in specs))


def main():
    if sys.argv[1] == "--lineup":
        lineup(sys.argv[2], sys.argv[3])
        return
    spec = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    grid = compose(spec)
    a = big(grid, spec, DARK, True)
    b = big(grid, spec, LIGHT, False)
    smalls = [small(grid, DARK, 31, 6), small(grid, LIGHT, 31, 6), small(grid, DARK, 47, 4), small(grid, LIGHT, 47, 4)]
    gap = 12
    width = len(a[0]) + len(b[0]) + 3 * gap
    height = gap + max(len(a), len(b)) + gap + max(len(s) for s in smalls) + gap
    sheet = blank(width, height, SHEET)
    paste(sheet, a, gap, gap)
    paste(sheet, b, 2 * gap + len(a[0]), gap)
    x, y = gap, 2 * gap + max(len(a), len(b))
    for s in smalls:
        paste(sheet, s, x, y)
        x += len(s[0]) + gap
    write_png(sys.argv[2], sheet)
    print(f"ok {sys.argv[2]} ({width}x{height})")


if __name__ == "__main__":
    main()
