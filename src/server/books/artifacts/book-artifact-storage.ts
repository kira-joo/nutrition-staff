import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BOOK_ARTIFACT_FOLDER = "nutrition/books/artifacts";

export interface UploadedPdfArtifact {
  publicId: string;
  url: string;
  bytes: number;
}

/**
 * PDF artifacts are stored as a Cloudinary `raw` resource, deliberately
 * outside `AssetProvider` (`AssetResourceType` only covers `"image" |
 * "video"`) — using the `cloudinary` SDK directly, already a direct
 * dependency of this app. Also deliberately outside the published-
 * edition asset-destruction guard (`destroy-asset-unless-published.ts`):
 * that guard protects assets OTHER modules might replace/delete out from
 * under a published Edition's frozen content; a PDF artifact is neither
 * shared with another module nor referenced by `referencedAssetPublicIds`
 * — its own row's lifecycle (`generate-book-artifact.ts`) is the only
 * thing that ever destroys it.
 */
export async function uploadPdfArtifact(pdf: Buffer, publicId: string): Promise<UploadedPdfArtifact> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: "raw", folder: BOOK_ARTIFACT_FOLDER, public_id: publicId, overwrite: true }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary raw upload returned no result."));
        return;
      }
      resolve({ publicId: result.public_id, url: result.secure_url, bytes: result.bytes });
    });
    uploadStream.end(pdf);
  });
}

/** Best-effort — callers treat a failure here as a logged warning, never a reason to fail an otherwise-successful operation (see `destroyPdfArtifactBestEffort`). */
export async function destroyPdfArtifact(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export async function destroyPdfArtifactBestEffort(publicId: string, context: string): Promise<void> {
  try {
    await destroyPdfArtifact(publicId);
  } catch (error) {
    console.error(`destroyPdfArtifactBestEffort: failed to clean up raw artifact "${publicId}" (${context}).`, error);
  }
}

/** Streams the raw PDF bytes back from Cloudinary — the download route proxies through this rather than ever exposing the raw storage URL to a client. */
export async function fetchPdfArtifactBytes(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch stored PDF artifact: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}
