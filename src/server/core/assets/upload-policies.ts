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
