"""Build the standalone game with Python's standard library only."""

from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SLOT = "__ECHO_COURIER_FRAGMENT__"


def build():
    fragment = (ROOT / "src" / "echo-courier.html").read_text(encoding="utf-8")
    template = (ROOT / "scripts" / "standalone-template.html").read_text(encoding="utf-8")
    if template.count(SLOT) != 1:
        raise ValueError("The standalone template must contain exactly one fragment slot")
    document = template.replace(SLOT, escape(fragment))
    output = ROOT / "index.html"
    output.write_text(document, encoding="utf-8", newline="\n")
    print(f"Built {output.name} ({len(document.encode('utf-8')):,} bytes)")


if __name__ == "__main__":
    build()
