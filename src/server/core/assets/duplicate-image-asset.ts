import { AssetProviderType, type ImageAsset } from "@kira-joo/toolkit-common";
import { v2 as cloudinary } from "cloudinary";

/**
 * Duplicating a block/chapter must not leave the copy sharing a
 * destructible asset with the original — removing either one would 404
 * the other. `AssetProvider` (backend-toolkit-core) only exposes
 * upload-from-buffer/destroy, with no "copy" operation, and this feature
 * may not add one (no toolkit package changes this phase). Cloudinary
 * itself supports uploading FROM a remote URL server-side — no bytes pass
 * through this process — so this app-local helper calls the `cloudinary`
 * SDK directly (already a direct dependency of this app for exactly this
 * kind of gap; same precedent recorded for raw-PDF storage in the
 * architecture plan) to produce a genuinely new `publicId`.
 *
 * Relies on `cloudinary.v2`'s module-level config already being set by
 * `createCloudinaryProvider()` in `cloudinary-provider.ts` — both files
 * import the same singleton SDK instance, and `assetProvider` is imported
 * everywhere before this helper could ever run.
 *
 * Scope: only ever called once per duplicated image, for a single
 * block or a single chapter's blocks (a handful of images at most) — NOT
 * whole-Book duplication. Whole-Book Duplicate (potentially ~80 images)
 * is explicitly out of Phase C scope and remains gated on the Phase A
 * spike S12 Vercel-budget measurement, per the approved plan.
 */
export async function duplicateImageAsset(source: ImageAsset, folder: string): Promise<ImageAsset> {
  const response = await cloudinary.uploader.upload(source.secureUrl, { folder, resource_type: "image" });
  return {
    provider: AssetProviderType.CLOUDINARY,
    publicId: response.public_id,
    secureUrl: response.secure_url,
    format: response.format,
    width: response.width,
    height: response.height,
    bytes: response.bytes,
    version: response.version,
    placeholderUrl: cloudinary.url(response.public_id, {
      secure: true,
      resource_type: "image",
      version: response.version,
      transformation: [{ width: 20, quality: 1, effect: "blur:2000", fetch_format: "auto" }],
    }),
  };
}
