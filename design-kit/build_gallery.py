"""Build the crew naming gallery from the gallery.test.ts dump."""
import html
import json
import pathlib
import re
import sys

src = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
out = pathlib.Path(sys.argv[2])
line = next(l for l in src.splitlines() if l.strip().startswith("Received:"))
crew = json.loads(json.loads(line.split("Received:", 1)[1].strip()))

OUTFITS = [
    "Lila Stirnband, schwarze Pistole seitlich",
    "Grüne Kappe, Flagge Bulgariens",
    "Kapitänsmütze, Pfeife, graubraune Katze",
    "Bauhelm, Spitzhacke, Ölfass „OIL“",
    "Weiße Haare, Insel mit Palme",
    "Pirat mit Haufen Goldmünzen",
]

cards = []
for i, c in enumerate(crew):
    cards.append(
        f'<div class="card" style="--accent:{c["accent"]}">'
        f'<div class="num">{i + 1}</div>'
        f'<div class="art">{c["working"]}</div>'
        f'<div class="name">{html.escape(c["name"])}</div>'
        f'<div class="outfit">{html.escape(OUTFITS[i] if i < len(OUTFITS) else "")}</div>'
        f'<div class="mini">{re.sub(r"width=.\d+. height=.\d+.", "width=\"31\" height=\"16\"", c["idle"], count=1)}</div>'
        f"</div>"
    )

page = f"""<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Clawd-Crew</title>
<style>
body{{background:#1a1b26;color:#c0caf5;font:15px 'Segoe UI',system-ui,sans-serif;margin:28px}}
h1{{font-size:20px;font-weight:600;margin:0 0 4px}} p{{color:#737aa2;margin:0 0 22px}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}}
.card{{background:#1f2335;border:1px solid #3b4261;border-radius:14px;padding:16px;position:relative}}
.card:hover{{border-color:var(--accent);box-shadow:0 0 18px -6px var(--accent)}}
.num{{position:absolute;top:10px;left:12px;font-weight:700;color:var(--accent);font-size:18px}}
.art{{display:flex;justify-content:center;padding:18px 0 8px}}
.name{{text-align:center;font-weight:600;font-size:17px;color:var(--accent)}}
.outfit{{text-align:center;color:#737aa2;font-size:13px;margin-top:2px}}
.mini{{display:flex;justify-content:center;margin-top:10px}}
</style></head><body>
<h1>Clawd-Crew</h1><p>So zeichnet der Mod sie (arbeitend animiert). Unten: Größe in der Chatleiste.</p>
<div class="grid">{''.join(cards)}</div></body></html>"""
out.write_text(page, encoding="utf-8")
print("written", out)
