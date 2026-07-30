/** Which upload method an `AssetFieldConfig` needs — kept distinct from backend-toolkit-core's `AssetResourceType` (a plain string-literal type) so app code has a real enum to reference instead of magic strings. */
export enum AssetKind {
  IMAGE = "image",
  VIDEO = "video",
}
