import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";

export interface BioSection {
  heading?: LocalizedString;
  body: LocalizedString;
  order: number;
}

export interface LabeledOrderedItem {
  text: LocalizedString;
  order: number;
}

export interface GalleryItem {
  id: string;
  image: ImageAsset;
  altText: LocalizedString;
  order: number;
}

export interface DoctorProfile {
  _id: string;
  name: LocalizedString;
  tagline: LocalizedString;
  avatar?: ImageAsset | null;
  avatarAlt: LocalizedString;
  bioSections: BioSection[];
  programHeading: LocalizedString;
  programHighlights: LabeledOrderedItem[];
  whyChooseHeading: LocalizedString;
  whyChooseReasons: LabeledOrderedItem[];
  featuredInLabel: LocalizedString;
  gallery: GalleryItem[];
  createdAt: string;
  updatedAt: string;
}

/** The main-form value shape — excludes `gallery`, which is managed by its own sub-resource UI, not this form's submit. */
export interface DoctorProfileFormValues {
  name: LocalizedString;
  tagline: LocalizedString;
  avatar: ImageAsset | File | null;
  avatarAlt: LocalizedString;
  bioSections: BioSection[];
  programHeading: LocalizedString;
  programHighlights: LabeledOrderedItem[];
  whyChooseHeading: LocalizedString;
  whyChooseReasons: LabeledOrderedItem[];
  featuredInLabel: LocalizedString;
}
