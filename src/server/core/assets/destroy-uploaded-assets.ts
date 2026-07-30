import type { AssetProvider } from "@kira-joo/backend-toolkit-core";
import type { UploadedAssetRef } from "./process-asset-upload-fields";

/**
 * Rollback path: destroys every asset uploaded in a request whose
 * subsequent `validateDto`/save failed. Always awaited by the caller —
 * never fire-and-forget (a serverless runtime can be torn down the
 * instant the response is sent). A destroy failure here is logged, not
 * thrown — the original save-failure error is what the caller actually
 * needs to see.
 */
export async function destroyUploadedAssets(provider: AssetProvider, uploaded: readonly UploadedAssetRef[]): Promise<void> {
  for (const asset of uploaded) {
    try {
      await provider.destroyAsset(asset.publicId, asset.resourceType);
    } catch (error) {
      console.error(`Failed to roll back uploaded asset ${asset.publicId} after a save failure`, error);
    }
  }
}
