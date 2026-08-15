import type { AssetProvider, AssetResourceType } from "@kira-joo/backend-toolkit-core";
import type { ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { AssetFieldConfig } from "./asset-field-config.interface";
import { getAtPath } from "./process-asset-upload-fields";

/**
 * Post-save cleanup for a successful *update*: for every asset field that
 * either received a new file this request or was explicitly cleared
 * (`payload[field.name] === null`), destroys the *previous* document's
 * asset for that field, if it had one. Always called only after the save
 * itself has already succeeded, and always awaited — never
 * fire-and-forget. A destroy failure here is logged and swallowed: the
 * save already succeeded, so the entity update is not rolled back over a
 * Cloudinary cleanup hiccup; the failure just means a harmless orphaned
 * asset until it's addressed.
 *
 * A field with neither a new file nor an explicit `null` this request is
 * untouched — no destroy call happens for it at all.
 */
export async function destroyReplacedAssets({
  provider,
  fields,
  files,
  payload,
  previousDocument,
}: {
  provider: AssetProvider;
  fields: readonly AssetFieldConfig[];
  files: Record<string, ParsedMultipartFile>;
  payload: Record<string, unknown>;
  previousDocument: Record<string, unknown>;
}): Promise<void> {
  for (const field of fields) {
    const hadNewFile = Boolean(files[field.name]);
    const wasExplicitlyCleared = getAtPath(payload, field.name) === null;
    if (!hadNewFile && !wasExplicitlyCleared) continue;

    const previousAsset = getAtPath(previousDocument, field.name) as { publicId: string } | undefined;
    if (!previousAsset) continue;

    try {
      await provider.destroyAsset(previousAsset.publicId, field.kind as unknown as AssetResourceType);
    } catch (error) {
      console.error(`Failed to clean up replaced/cleared asset ${previousAsset.publicId}`, error);
    }
  }
}
