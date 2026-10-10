"""Write the DESIGNS entries of crabs.ts from the JSON specs in a folder (between the marker lines).

Usage: python build_designs_ts.py <specs folder> <crabs.ts>
"""
import json
import pathlib
import sys

W = 26
START, END = "  // <designs: generated from the design-kit specs>", "  // </designs>"
COMMENTS = {
    "Carlos": "purple headband with flying ends, a black pistol held out sideways",
    "Herby": "green cap, the flag of Bulgaria on a pole",
    "Maurice": "captain's cap and pipe, a grey-brown cat sitting beside him",
    "Diddy": "hard hat, a black oil barrel beside him",
    "Jeffrey": "white hair, standing on a small island with a palm tree",
    "Bibi": "top hat with a red band, a pile of gold coins beside him",
}


def rows_ts(rows, indent):
    rows = list(rows or [])
    while rows and set(rows[-1]) <= {"."}:
        rows.pop()
    for r in rows:
        if len(r) != W:
            raise SystemExit(f"row has {len(r)} chars: {r!r}")
    lines = ["BLANK," if set(r) <= {"."} else f"'{r}'," for r in rows]
    return "[\n" + "".join(f"{indent}  {line}\n" for line in lines) + f"{indent}]"


def entry(spec):
    pad = "    "
    pal = ", ".join(f"{k}: '{v}'" for k, v in spec["palette"].items())
    out = [
        "  {",
        f"{pad}name: '{spec['name']}', // {COMMENTS.get(spec['name'], '')}".rstrip(" /"),
        f"{pad}accent: '{spec['accent']}',",
        f"{pad}sprite: {rows_ts(spec.get('sprite'), pad)},",
    ]
    if any(set(r) - {"."} for r in spec.get("scene") or []):
        out.append(f"{pad}scene: {rows_ts(spec['scene'], pad)},")
    out.append(f"{pad}palette: {{ {pal} }},")
    if spec.get("held"):
        out.append(f"{pad}held: '{spec['held']}',")
    label = spec.get("label")
    if label:
        out.append(
            f"{pad}label: {{ text: '{label['text']}', x: {label['x']}, y: {label['y']}, "
            f"w: {label['w']}, h: {label['h']}, color: '{label['color']}' }},"
        )
    out.append("  },")
    return "\n".join(out)


def main():
    specs = [json.loads(p.read_text(encoding="utf-8")) for p in sorted(pathlib.Path(sys.argv[1]).glob("*.json"))]
    ts_path = pathlib.Path(sys.argv[2])
    ts = ts_path.read_text(encoding="utf-8")
    head, rest = ts.split(START + "\n", 1)
    _, tail = rest.split(END, 1)
    body = "\n".join(entry(s) for s in specs) + "\n"
    ts_path.write_text(head + START + "\n" + body + END + tail, encoding="utf-8", newline="\n")
    print("wrote", len(specs), "designs:", ", ".join(s["name"] for s in specs))


if __name__ == "__main__":
    main()
