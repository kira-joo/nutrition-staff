import type { UploadPolicy } from "@kira-joo/toolkit-common";
import type { AssetKind } from "./asset-kind.enum";

/** One asset-bearing field on an entity, for the upload orchestration helpers below. */
export interface AssetFieldConfig {
  name: string;
  kind: AssetKind;
  policy: UploadPolicy;
}
