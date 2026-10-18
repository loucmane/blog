"""Offline asset maintenance; requires fonttools==4.63.0 and Brotli==1.1.0.

python3 prepare-fonts.py /path/to/fontsource-variable-fraunces-5.3.0.tgz
Verifies the archive, retains all characters/features, checks outlines/advances,
then writes the two processed faces and their provenance. Never runs in the app.
"""

import argparse
import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile

import brotli
import fontTools
from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def verify_geometry(original, result):
    """Check every encoded glyph at every weight/softness used by the CSS.

    Instancing rounds TrueType coordinates; allow at most three font units (0.0015 em).
    Compare decomposed outlines so harmless glyph renumbering cannot hide a change.
    """
    before, after = original.getBestCmap(), result.getBestCmap()
    assert before.keys() == after.keys(), "Character coverage changed"
    maximum = 0
    for weight in (400, 700, 800, 900):
        for soft in (30, 100):
            location = {"wght": weight, "SOFT": soft}
            left = original.getGlyphSet(location=location)
            right = result.getGlyphSet(location=location)
            for codepoint in before:
                a, b = left[before[codepoint]], right[after[codepoint]]
                maximum = max(maximum, abs(a.width - b.width))
                first, second = DecomposingRecordingPen(left), DecomposingRecordingPen(right)
                a.draw(first)
                b.draw(second)
                assert len(first.value) == len(second.value), "Outline structure changed"
                for (op1, points1), (op2, points2) in zip(first.value, second.value):
                    assert op1 == op2 and len(points1) == len(points2)
                    for p1, p2 in zip(points1, points2):
                        if p1 is None or p2 is None:
                            assert p1 is p2
                        else:
                            maximum = max(maximum, *(abs(x - y) for x, y in zip(p1, p2)))
    assert maximum <= 3, f"Glyph geometry changed by {maximum} font units"
    return round(maximum, 6)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--check", action="store_true", help="Verify reproduction without writing")
    args = parser.parse_args()
    assert fontTools.__version__ == "4.63.0" and brotli.__version__ == "1.1.0"
    folder = Path(__file__).resolve().parents[3] / "public/reader-directions/expressive-colour/fonts"
    manifest = folder / "sources.json"
    sources = json.loads(manifest.read_text())
    archive = args.archive.read_bytes()
    integrity = "sha512-" + base64.b64encode(hashlib.sha512(archive).digest()).decode()
    results = []
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        for source in sources:
            if not source["file"].startswith("fraunces-"):
                continue
            assert integrity == source["npmIntegrity"], "Unexpected upstream archive"
            member = tar.extractfile("package/" + source["packagePath"])
            assert member is not None
            original_bytes = member.read()
            assert hashlib.sha256(original_bytes).hexdigest() == source.get(
                "originalSha256", source["sha256"]
            ), "Unexpected upstream face"
            original = TTFont(io.BytesIO(original_bytes))
            result = instantiateVariableFont(
                original, {"wght": (400, 400, 900), "SOFT": (30, 30, 100)}, inplace=False
            )
            options = subset.Options()
            options.recalc_timestamp = False
            options.layout_features = ["*"]
            options.name_IDs = ["*"]
            options.name_languages = ["*"]
            options.name_legacy = True
            sub = subset.Subsetter(options=options)
            sub.populate(unicodes=result.getBestCmap())
            sub.subset(result)
            result.recalcTimestamp = False
            output = io.BytesIO()
            result.save(output)
            data = output.getvalue()
            error = verify_geometry(original, TTFont(io.BytesIO(data)))
            old_file = source["file"]
            source.update(
                file=old_file.replace("-soft-", "-reader-"),
                bytes=len(data),
                sha256=hashlib.sha256(data).hexdigest(),
                originalBytes=len(original_bytes),
                originalSha256=hashlib.sha256(original_bytes).hexdigest(),
                processing={
                    "fontTools": fontTools.__version__,
                    "brotli": brotli.__version__,
                    "axes": {"wght": [400, 400, 900], "SOFT": [30, 30, 100]},
                    "characters": len(original.getBestCmap()),
                    "maxGeometryErrorFontUnits": error,
                },
            )
            results.append((old_file, source["file"], data))
            print(source["file"], len(data), "bytes; max outline/advance error:", error)
    # Write only after both faces have passed all checks.
    if args.check:
        assert sources == json.loads(manifest.read_text()), "Provenance differs"
        for _, new_file, data in results:
            assert (folder / new_file).read_bytes() == data, "Processed font differs"
        return
    for old_file, new_file, data in results:
        (folder / new_file).write_bytes(data)
        if old_file != new_file:
            (folder / old_file).unlink()
    manifest.write_text(json.dumps(sources, indent=2) + "\n")


if __name__ == "__main__":
    main()
