import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { BookArtifactStatus, BookArtifactType } from "src/common/enums";

export interface BookArtifact {
  _id: string;
  editionId: string;
  bookId: string;
  type: BookArtifactType;
  status: BookArtifactStatus;
  templateVersion: string;
  startedAt: string;
  finishedAt?: string;
  pageCount?: number;
  fileSize?: number;
  errorMessage?: string;
}

export const getBookArtifactEndpoint: Endpoint<{ params: { id: string; editionId: string }; returnType: BookArtifact | null }> = {
  url: "/books/:id/editions/:editionId/artifacts",
  methodType: MethodType.GET,
};

/** Runs synchronously — resolves with the final READY/FAILED row, not a "started" acknowledgement. */
export const generateBookArtifactEndpoint: Endpoint<{ params: { id: string; editionId: string }; returnType: BookArtifact }> = {
  url: "/books/:id/editions/:editionId/artifacts",
  methodType: MethodType.POST,
};

export const downloadBookArtifactPdfEndpoint: Endpoint<{ params: { id: string; editionId: string }; returnType: Blob }> = {
  url: "/books/:id/editions/:editionId/artifacts/pdf",
  methodType: MethodType.GET,
};
