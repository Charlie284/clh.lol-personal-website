"""Regenerate bundled font subsets with fonttools[woff] (build-time only)."""
from pathlib import Path
import re

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTS = Path(__file__).resolve().parents[1] / "src/assets/fonts"
# Basic Latin and the punctuation used by English prose. Other Latin glyphs
# keep the complete source font as a unicode-range fallback.
BASIC = set(range(0x20, 0x7F)) | set(range(0x2000, 0x2070)) | {0xA0, 0xA9, 0xB7}


def write_font(source, output, axes, characters=None):
    font = instantiateVariableFont(TTFont(FONTS / source, recalcTimestamp=False), axes, inplace=False)
    if characters is not None:
        subset = Subsetter(options=Options())
        subset.populate(unicodes=characters)
        subset.subset(font)
    font.recalcTimestamp = False
    font.save(FONTS / output)
    print(f"{output}: {(FONTS / output).stat().st_size:,} bytes")


write_font("fraunces-latin.woff2", "fraunces-text.woff2", {"SOFT": 0, "wght": (500, 900)}, BASIC)
write_font("fraunces-latin.woff2", "fraunces-name.woff2", {"opsz": 144, "SOFT": 100, "wght": 600}, set(map(ord, "Charlie")))
write_font("fraunces-latin.woff2", "fraunces-kicker.woff2", {"opsz": 40, "SOFT": 50, "wght": 500}, set(map(ord, "Hi, I’m")))
write_font("outfit-latin.woff2", "outfit-text.woff2", {"wght": (300, 700)}, BASIC)
write_font("syne-latin.woff2", "syne-headings.woff2", {"wght": (700, 800)}, BASIC)


def write_fallback_coverage(source, stylesheet):
    codes = sorted(set(TTFont(FONTS / source).getBestCmap()) - BASIC)
    ranges = []
    for code in codes:
        if ranges and code == ranges[-1][1] + 1:
            ranges[-1][1] = code
        else:
            ranges.append([code, code])
    coverage = ", ".join(
        f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}"
        for start, end in ranges
    )
    path = FONTS.parent / "styles" / stylesheet
    css = path.read_text()
    # Declaring unsupported symbols makes the browser fetch the full face just
    # to learn that it needs a system fallback. Use only the source's cmap.
    pattern = r'(@font-face\s*\{[^}]*url\("\.\./fonts/' + re.escape(source) + r'"\)[^}]*unicode-range:\s*)[^;]+;'
    css, count = re.subn(pattern, lambda match: match[1] + coverage + ";", css)
    if count != 1:
        raise ValueError(f"Expected one fallback face for {source}")
    path.write_text(css)


write_fallback_coverage("outfit-latin.woff2", "index.css")
write_fallback_coverage("fraunces-latin.woff2", "secondary-fonts.css")
write_fallback_coverage("syne-latin.woff2", "secondary-fonts.css")
