"use client";

import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomImageAssetUpload, Modal } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import { doctorPhotoPolicy } from "src/common/upload-policies";
import { LocalizedTextPair } from "../localized-text-pair";

export interface GalleryItemModalSubmitValues {
  file: File | null;
  altText: LocalizedString;
}

export interface GalleryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Add requires a new image; replace does not (omitted = keep the existing photo). */
  requireImage?: boolean;
  initialAltText?: LocalizedString;
  onSubmit: (values: GalleryItemModalSubmitValues) => void;
  loading?: boolean;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function GalleryItemModal({
  open,
  onOpenChange,
  title,
  requireImage = false,
  initialAltText,
  onSubmit,
  loading,
}: GalleryItemModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState<LocalizedString>(initialAltText ?? EMPTY_LOCALIZED);
  const canSubmit = !requireImage || file !== null;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="lg">
      <div className="flex flex-col gap-4">
        <CustomImageAssetUpload value={file} onChange={(value) => setFile(value instanceof File ? value : null)} policy={doctorPhotoPolicy} />
        <LocalizedTextPair label="Alt text" value={altText} onChange={setAltText} />
        <div className="flex justify-end gap-2">
          <CustomButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </CustomButton>
          <CustomButton type="button" disabled={!canSubmit} loading={loading} onClick={() => onSubmit({ file, altText })}>
            Save
          </CustomButton>
        </div>
      </div>
    </Modal>
  );
}
