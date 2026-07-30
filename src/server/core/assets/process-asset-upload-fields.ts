import type { AssetProvider, AssetResourceType } from "@kira-joo/backend-toolkit-core";
import { validateUploadedFile, type ParsedMultipartFile } from "@kira-joo/backend-toolkit-next";
import type { AssetFieldConfig } from "./asset-field-config.interface";
import { AssetKind } from "./asset-kind.enum";

export interface UploadedAssetRef {
  publicId: string;
  resourceType: AssetResourceType;
}

export interface ProcessAssetUploadFieldsResult {
  /** Every asset actually uploaded in this call — pass to destroyUploadedAssets() on failure. */
  uploaded: UploadedAssetRef[];
}

/**
 * The core of the upload-on-submit flow: for each configured asset field
 * that has a matching uploaded file this request, validates it against
 * that field's policy, uploads it via the provider, and merges the
 * resulting `ImageAsset`/`VideoAsset` straight into `payload[field.name]`
 * — overwriting whatever (if anything) the client sent for that key,
 * since the client never legitimately has real asset data to send.
 *
 * A field with no matching file is left completely untouched in
 * `payload` — whatever `JSON.parse(fields.payload)` already produced for
 * it (omitted = unchanged, explicit `null` = clear) passes through as-is.
 *
 * Mutates `payload` in place and returns what was uploaded, so a caller
 * can roll every one of them back (`destroyUploadedAssets`) if the
 * subsequent `validateDto`/save fails.
 */
export async function processAssetUploadFields({
  files,
  payload,
  fields,
  provider,
  folder,
}: {
  files: Record<string, ParsedMultipartFile>;
  payload: Record<string, unknown>;
  fields: readonly AssetFieldConfig[];
  provider: AssetProvider;
  folder: string;
}): Promise<ProcessAssetUploadFieldsResult> {
  const uploaded: UploadedAssetRef[] = [];

  for (const field of fields) {
    const file = files[field.name];
    if (!file) continue;

    validateUploadedFile(file, field.policy);

    const asset =
      field.kind === AssetKind.IMAGE
        ? await provider.uploadImage(file.buffer, { folder })
        : await provider.uploadVideo(file.buffer, { folder });

    // AssetKind's values are exactly "image"/"video" by design — same
    // literal strings as backend-toolkit-core's AssetResourceType, just
    // expressed as a real enum here instead of a bare string-literal type.
    payload[field.name] = asset;
    uploaded.push({ publicId: asset.publicId, resourceType: field.kind as unknown as AssetResourceType });
  }

  return { uploaded };
}
