import type { AssetProvider, AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { bookEditionRepository } from "src/server/books/editions/book-editions.repository";

/**
 * The one invariant this feature adds to the app's ENTIRE asset-cleanup
 * behavior: before destroying any asset, check whether a published
 * `BookEdition` still references that exact `publicId`. This is a
 * narrowly-scoped conditional check, not a policy change — with zero
 * published editions (true for every module except Books, and true for
 * Books itself before its first Publish), `referenced` is always 0 and
 * every destroy proceeds exactly as it always has.
 *
 * Centralized in exactly one place: `cloudinary-provider.ts` wraps
 * `destroyAsset` with this before exporting `assetProvider`, so every
 * existing caller (Recipes, Doctor Profile, Videos, Packages, Books —
 * all of them, via `destroyReplacedAssets`/`destroyUploadedAssets`)
 * gets the guard automatically. No other module's file needed to change.
 *
 * Failure behavior is a deliberate decision, not an oversight: if the
 * `count()` check itself fails (a query error, not "zero matches"), this
 * logs loudly and destroys the asset normally — it does NOT fail closed
 * into treating an unknown state as "referenced." A silently-growing
 * pile of undeletable assets across every module in the app, caused by
 * one intermittent Mongo error, is a worse failure mode than the near-
 * impossible case this guards against: this runs inside a request that
 * already holds a live DB connection, so the count query failing while
 * everything else in the same request succeeds is exceptionally
 * unlikely — and when it does happen, a loud error is preferable to an
 * invisible global no-delete policy.
 */
export async function destroyAssetUnlessPublished(provider: AssetProvider, publicId: string, resourceType: AssetResourceType): Promise<void> {
  let referenced = 0;
  try {
    referenced = await bookEditionRepository.count({ where: { referencedAssetPublicIds: publicId } });
  } catch (error) {
    console.error(`destroyAssetUnlessPublished: failed to check published-edition references for "${publicId}" — destroying normally.`, error);
    referenced = 0;
  }

  if (referenced > 0) {
    console.info(`destroyAssetUnlessPublished: preserving "${publicId}" — referenced by ${referenced} published edition(s).`);
    return;
  }

  await provider.destroyAsset(publicId, resourceType);
}
