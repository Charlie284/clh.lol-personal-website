import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps unsupported UI symbols out of downloadable font ranges while retaining Latin accents", () => {
  const faces = ["src/assets/styles/index.css", "src/assets/styles/secondary-fonts.css"]
    .flatMap(file => readFileSync(file, "utf8").match(/@font-face\s*\{[^}]+\}/g) ?? []);
  const covers = (face: string, code: number) =>
    (face.match(/unicode-range:\s*([^;]+);/)?.[1] ?? "").split(",").some(range => {
      const [start, end = start] = range.trim().replace(/^U\+/i, "").split("-");
      return code >= parseInt(start, 16) && code <= parseInt(end, 16);
    });
  for (const family of ["Outfit", "Fraunces", "Syne"]) {
    const familyFaces = faces.filter(face => face.includes(`font-family: "${family}"`));
    // These sources have no arrow glyph. The browser should use its system
    // fallback without downloading the complete Latin face to discover that.
    expect(familyFaces.some(face => covers(face, 0x2192)), family).toBe(false);
    expect(familyFaces.some(face => covers(face, 0xE9)), `${family} retains é`).toBe(true);
  }
});
