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
