import QRCode from "qrcode";

const FIXED_DIMENSION_ATTRS = /\s(width|height)="[^"]*"/g;

/**
 * Real, deterministic QR generation — replaces the Phase D text
 * placeholder. Pure function of `destination` (same input always
 * produces the same SVG markup, no timestamp/random seed), so it is
 * safe to call both for a live block-level `QR_LINK` destination and
 * for the frozen `resolvedSettings.qrDestination` a published Edition
 * carries — whichever the caller passes in is exactly what gets
 * encoded, with no other input read.
 *
 * Returns inline SVG markup (never an `<img src>`) so it inlines
 * directly into the same self-contained HTML document the paginator/PDF
 * renderer requires — no network fetch, no extra Cloudinary asset.
 * `width`/`height` attributes the library would otherwise emit are
 * stripped so the surrounding CSS class controls physical size in mm,
 * the same convention already used for every other sized element in the
 * template (`figure.book-image img`, `.book-qr-link img` previously).
 *
 * Error correction level "M" (~15% of modules can be damaged/obscured
 * and still scan) — a reasonable print-safe default: high enough to
 * tolerate ink bleed/minor paper wear, not so high ("H") that the module
 * grid gets needlessly dense for a typically-short URL destination.
 */
export async function generateQrSvg(destination: string): Promise<string> {
  const svg = await QRCode.toString(destination, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#1c1c1c", light: "#ffffff" },
  });
  return svg.replace(FIXED_DIMENSION_ATTRS, "");
}
