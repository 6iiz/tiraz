"""Writes audition.html: every kind with its sounds in picking order, each with a player, so a person can LISTEN.

    python audition.py            then open sound/audition.html (double-click works: the page only plays local files)

Nobody has heard these sounds: they were chosen by measurement and by name. Listen, then reorder or remove entries in
defaults.json (the first choices per kind), or delete a bad file and run build_index.py.
"""
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import pick  # noqa: E402


def main():
    kinds = json.load(open(os.path.join(HERE, "kinds.json"), encoding="utf-8"))
    rows = []
    for kind, line in kinds.items():
        cands = pick._candidates(kind, None)
        cells = []
        for i, e in enumerate(cands):
            cells.append(
                '<div class="s"><b>%d</b> <code>%s</code> <span>%.2f s · %s%s</span><audio controls preload="none" src="%s"></audio></div>'
                % (i, html.escape(e["id"]), e["seconds"], html.escape(e["licence"]), " · sub" if "sub" in e["tags"] else "", html.escape(e["file"]))
            )
        rows.append('<section><h2>%s <small>%d</small></h2><p>%s</p>%s</section>' % (html.escape(kind), len(cands), html.escape(str(line)), "".join(cells)))
    page = (
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Sound audition</title><style>'
        "body{font:15px/1.5 system-ui,sans-serif;background:#111;color:#eee;margin:24px auto;max-width:980px;padding:0 16px}"
        "h1{font-size:22px}h2{margin:28px 0 2px;font-size:19px}small{color:#888;font-weight:400}p{margin:0 0 8px;color:#aaa}"
        ".s{display:grid;grid-template-columns:28px 1fr auto 300px;gap:10px;align-items:center;padding:3px 0;border-top:1px solid #222}"
        ".s b{color:#888}.s span{color:#888;font-size:13px}audio{height:30px;width:300px}code{font-size:13px}"
        "</style><h1>Sound audition</h1><p>Number 0 is what a reel gets when it asks for the kind with no variant. "
        "Listen on a phone speaker too. Tell Claude which numbers are wrong for their kind.</p>" + "".join(rows) + "</html>"
    )
    out = os.path.join(HERE, "audition.html")
    with open(out, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    print(out)


if __name__ == "__main__":
    main()
