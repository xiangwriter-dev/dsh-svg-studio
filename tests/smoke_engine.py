"""End-to-end smoke test for the SVG Studio engine.

Creates its own synthetic flat-colour illustration, runs the full engine, and checks
the public output contract and the default background/outline behaviour.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "engine" / "svg_engine.py"
SVG_NS = "{http://www.w3.org/2000/svg}"


def make_fixture(path: Path) -> None:
    """A simple flat-colour character on a flat background. No external art."""
    im = Image.new("RGB", (320, 320), (79, 104, 146))
    d = ImageDraw.Draw(im)
    # hair mass
    d.ellipse((72, 38, 248, 270), fill=(206, 93, 55))
    # face
    d.ellipse((112, 76, 208, 170), fill=(255, 225, 213))
    # fringe
    d.polygon([(92, 92), (128, 62), (176, 58), (226, 95), (212, 118), (190, 92), (170, 82), (146, 82), (124, 94)], fill=(206, 93, 55))
    # eyes and cheeks
    d.ellipse((130, 116, 144, 132), fill=(64, 38, 50))
    d.ellipse((176, 116, 190, 132), fill=(64, 38, 50))
    d.ellipse((124, 137, 142, 145), fill=(249, 184, 184))
    d.ellipse((178, 137, 196, 145), fill=(249, 184, 184))
    # white blouse and blue dress
    d.rounded_rectangle((112, 166, 208, 238), radius=20, fill=(255, 249, 244))
    d.polygon([(128, 194), (192, 194), (206, 250), (114, 250)], fill=(0, 61, 155))
    # legs
    d.rounded_rectangle((134, 244, 154, 300), radius=7, fill=(255, 249, 244))
    d.rounded_rectangle((166, 244, 186, 300), radius=7, fill=(255, 249, 244))
    # small gold hair clip
    d.polygon([(208, 66), (232, 56), (228, 80), (212, 86)], fill=(248, 190, 109))
    im.save(path)


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="svg-studio-smoke-") as td:
        src = Path(td) / "fixture.png"
        out = Path(td) / "fixture.svg"
        make_fixture(src)

        proc = subprocess.run(
            [
                sys.executable,
                str(ENGINE),
                "--src",
                str(src),
                "--out",
                str(out),
                "--colors",
                "96",
                "--background",
                "gradient",
                "--face-detail",
                "--desc",
                "synthetic smoke fixture",
            ],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=120,
        )
        if proc.returncode != 0:
            print(proc.stdout)
            print(proc.stderr, file=sys.stderr)
            raise SystemExit("engine exited with a non-zero status")
        if not out.exists():
            raise SystemExit("engine did not create an SVG")

        payload = None
        for line in reversed(proc.stdout.splitlines()):
            line = line.strip()
            if line.startswith("{") and line.endswith("}"):
                payload = json.loads(line)
                break
        if not payload:
            print(proc.stdout)
            raise SystemExit("engine did not return a JSON summary")

        assert payload.get("ok") is True, payload
        assert payload.get("halo") is False, "clean gradient must not invent a halo"
        assert payload.get("outline") is False, "outline must be off by default"
        assert payload.get("paths", 0) >= 10, payload

        raw = out.read_text(encoding="utf-8")
        assert "<image" not in raw and "data:image" not in raw, "SVG must not embed raster data"
        assert "haloGrad" not in raw and "outer-outline" not in raw, "default output must not contain halo/outline"
        assert "bgGrad" in raw, "gradient mode should have a backdrop gradient"

        root = ET.fromstring(raw)
        assert root.tag == f"{SVG_NS}svg"
        assert int(float(root.get("width"))) == 320
        assert int(float(root.get("height"))) == 320
        paths = root.findall(f".//{SVG_NS}path")
        assert len(paths) >= 10
        assert len(root.findall(f".//{SVG_NS}image")) == 0

        print(
            "smoke: ok",
            f"paths={payload['paths']}",
            f"colours={payload['colors_used']}",
            f"bytes={payload['bytes']}",
            f"ms={payload['elapsed_ms']}",
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
