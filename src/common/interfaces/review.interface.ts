import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";

export interface Review {
  _id: string;
  content?: LocalizedString;
  authorName?: LocalizedString;
  authorLabel?: LocalizedString;
  image?: ImageAsset | null;
  beforeImage?: ImageAsset | null;
  afterImage?: ImageAsset | null;
  /** Optional for backward compatibility — reviews created before this field existed have no rating. */
  rating?: number;
  featured: boolean;
  sourceUrl?: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * The form's own value shape for each asset field: the existing
 * `ImageAsset` while unedited, a freshly-picked `File` pending upload, or
 * `null` once explicitly cleared — see `CustomImageAssetUpload`'s docs.
 */
export interface ReviewFormValues {
  content: LocalizedString;
  authorName: LocalizedString;
  authorLabel: LocalizedString;
  image: ImageAsset | File | null;
  beforeImage: ImageAsset | File | null;
  afterImage: ImageAsset | File | null;
  /** Optional in the type since a legacy review may not have one yet — the form itself requires a value before submit. */
  rating?: number;
  featured: boolean;
  sourceUrl?: string;
  status: ContentStatus;
}
