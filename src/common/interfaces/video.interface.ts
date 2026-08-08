import type { ImageAsset, LocalizedString, VideoAsset } from "@kira-joo/frontend-toolkit-core";
import type { ContentStatus } from "../enums";

export interface Video {
  _id: string;
  title: LocalizedString;
  description?: LocalizedString;
  video?: VideoAsset | null;
  externalUrl?: string;
  poster?: ImageAsset | null;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VideoFormValues {
  title: LocalizedString;
  description: LocalizedString;
  video: VideoAsset | File | null;
  externalUrl?: string;
  poster: ImageAsset | File | null;
  status: ContentStatus;
}
