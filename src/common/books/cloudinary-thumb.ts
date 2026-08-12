import { AssetProviderType, type ImageAsset } from "@kira-joo/frontend-toolkit-core";

/**
 * Derives a small Cloudinary transform URL from a full-resolution
 * `ImageAsset.secureUrl` — inserts a transformation segment right after
 * `/upload/`. Nothing in either toolkit does this today, and it's the
 * difference between a Books table/content tab loading originals (tens of
 * MB for a 40-image book) and loading this. Falls back to the untouched
 * `secureUrl` for any non-Cloudinary provider or a malformed URL, so a
 * thumbnail never breaks outright over a missed transform.
 */
export function thumbUrl(asset: Pick<ImageAsset, "provider" | "secureUrl"> | null | undefined, width: number): string | undefined {
  if (!asset) return undefined;
  if (asset.provider !== AssetProviderType.CLOUDINARY) return asset.secureUrl;

  const marker = "/upload/";
  const index = asset.secureUrl.indexOf(marker);
  if (index === -1) return asset.secureUrl;

  const insertAt = index + marker.length;
  return `${asset.secureUrl.slice(0, insertAt)}c_limit,w_${width},q_auto,f_auto/${asset.secureUrl.slice(insertAt)}`;
}
