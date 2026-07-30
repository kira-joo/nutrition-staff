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
  featured: boolean;
  sourceUrl?: string;
  order: number;
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
  featured: boolean;
  sourceUrl?: string;
  order?: number;
  status: ContentStatus;
}
