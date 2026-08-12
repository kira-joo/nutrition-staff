import type { UploadPolicy } from "@kira-joo/toolkit-common";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

/** Testimonial screenshots / before-after photos — generous bounds, these are just photos staff upload as-is. */
export const reviewImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 8 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
};

/** The doctor's own photos (avatar, gallery) — same real-world constraints as a review photo, named for this domain instead. */
export const doctorPhotoPolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 8 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
};

/** Site brand logo — smaller minimum than a photo (logos are often modestly sized/near-square), moderate size cap. */
export const logoImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 5 * 1024 * 1024,
  minWidth: 64,
  minHeight: 64,
};

/** Browser favicon — tiny by nature; a 200px photo-style minimum would reject almost every real favicon. */
export const faviconImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 1 * 1024 * 1024,
  minWidth: 16,
  minHeight: 16,
};

/** Open Graph social-preview image — wants a decently large source so it still looks sharp when platforms crop/scale it. */
export const ogImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 8 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
};

/** A Campaign Hero block's banner — wide, full-bleed marketing imagery, so it wants a meaningfully larger minimum than a portrait/avatar photo. */
export const campaignHeroPolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 10 * 1024 * 1024,
  minWidth: 600,
  minHeight: 300,
};

/** A recipe's hero photo — same real-world constraints as a review/doctor photo. */
export const recipeImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 8 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
};

const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const VIDEO_FORMATS = ["mp4", "webm", "mov"];

/**
 * An uploaded Video entry — per the plan's own flagged caveat, video files
 * travel through this server on every upload; the 5-minute/100MB bounds
 * here are a reasonable dev-time default, not a verified production
 * limit. Confirm against the actual hosting platform's request body-size
 * limit before this goes live (still an open item — see the checkpoint
 * report).
 */
export const videoContentPolicy: UploadPolicy = {
  allowedMimeTypes: VIDEO_MIME_TYPES,
  allowedFormats: VIDEO_FORMATS,
  maxBytes: 100 * 1024 * 1024,
  maxDurationSeconds: 300,
};

/** A Video entry's optional poster/thumbnail override image. */
export const videoPosterPolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 5 * 1024 * 1024,
  minWidth: 200,
  minHeight: 200,
};

/**
 * Books are printed, not just displayed on a screen — minimums here are
 * deliberately much higher than a website photo policy (roughly ~300dpi
 * at the template's print dimensions), so a low-resolution source is
 * rejected up front rather than silently upscaled onto a printed page.
 */
export const bookPortraitPolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 10 * 1024 * 1024,
  minWidth: 800,
  minHeight: 800,
};

/** The book's own logo mark — wide/small by nature, so a much lower minimum than a portrait photo. */
export const bookLogoPolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 5 * 1024 * 1024,
  minWidth: 300,
  minHeight: 100,
};

/** Any image placed inside a book's content (chapter cover, image block, back cover) — print-grade minimum. */
export const bookContentImagePolicy: UploadPolicy = {
  allowedMimeTypes: IMAGE_MIME_TYPES,
  allowedFormats: IMAGE_FORMATS,
  maxBytes: 12 * 1024 * 1024,
  minWidth: 600,
  minHeight: 600,
};
