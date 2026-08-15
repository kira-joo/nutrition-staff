import { CAIRO_BOLD_ARABIC, CAIRO_BOLD_LATIN, NASKH_REGULAR_ARABIC, NASKH_REGULAR_LATIN } from "./font-data";

export const BOOK_BODY_FONT_FAMILY = "Naskh Book Body";
export const BOOK_HEADING_FONT_FAMILY = "Cairo Book Heading";

/**
 * `font-display: block`, never `swap` — swap lets a fallback render, and
 * if the paginator measures during that window every line break is
 * computed against wrong metrics, silently corrupting pagination in a
 * page that *looks* fine. This is the load-bearing reason these are
 * embedded data URIs rather than `@font-face` pointing at
 * `fonts.gstatic.com`: a self-contained document can force-block on its
 * own fonts with no network round trip to race against.
 */
export const BOOK_TEMPLATE_FONT_FACES = `
@font-face {
  font-family: "${BOOK_HEADING_FONT_FAMILY}";
  font-weight: 700;
  font-style: normal;
  font-display: block;
  src: url(data:font/woff2;base64,${CAIRO_BOLD_ARABIC}) format("woff2");
  unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: "${BOOK_HEADING_FONT_FAMILY}";
  font-weight: 700;
  font-style: normal;
  font-display: block;
  src: url(data:font/woff2;base64,${CAIRO_BOLD_LATIN}) format("woff2");
  unicode-range: U+0000-00FF, U+2000-206F;
}
@font-face {
  font-family: "${BOOK_BODY_FONT_FAMILY}";
  font-weight: 400;
  font-style: normal;
  font-display: block;
  src: url(data:font/woff2;base64,${NASKH_REGULAR_ARABIC}) format("woff2");
  unicode-range: U+0600-06FF, U+0750-077F, U+FB50-FDFF, U+FE70-FEFC;
}
@font-face {
  font-family: "${BOOK_BODY_FONT_FAMILY}";
  font-weight: 400;
  font-style: normal;
  font-display: block;
  src: url(data:font/woff2;base64,${NASKH_REGULAR_LATIN}) format("woff2");
  unicode-range: U+0000-00FF, U+2000-206F;
}
`;

/**
 * A stable identifier for exactly what's embedded above — persisted into
 * a page model / (eventually) an Edition so a later change to this
 * module is detectable as "font changed" rather than silently reflowing
 * historical content. Length-based, not a real hash: good enough to
 * detect "the embedded bytes changed," which is all this needs to prove,
 * without pulling in a hashing dependency for four constants that only
 * ever change when this file is deliberately edited.
 */
export const BOOK_TEMPLATE_FONT_FINGERPRINT = [
  `cairo-bold-arabic:${CAIRO_BOLD_ARABIC.length}`,
  `cairo-bold-latin:${CAIRO_BOLD_LATIN.length}`,
  `naskh-regular-arabic:${NASKH_REGULAR_ARABIC.length}`,
  `naskh-regular-latin:${NASKH_REGULAR_LATIN.length}`,
].join("|");

/** The exact strings `document.fonts.load()` must be called with, per face, before any measurement — an explicit Arabic sample forces real Arabic glyph rasterization rather than trusting the family name alone to trigger a load. */
export const BOOK_FONT_READINESS_PROBES: { family: string; weight: string; sampleText: string }[] = [
  { family: BOOK_BODY_FONT_FAMILY, weight: "400", sampleText: "اختبار جاهزية الخط العربي ١٢٣" },
  { family: BOOK_HEADING_FONT_FAMILY, weight: "700", sampleText: "اختبار جاهزية الخط العربي ١٢٣" },
];
