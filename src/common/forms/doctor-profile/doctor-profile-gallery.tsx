"use client";

import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AssetLightbox,
  AssetThumbnail,
  CustomButton,
  PageSection,
  toast,
  useConfirmDialog,
} from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, ArrowRight, Images, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  addGalleryItemEndpoint,
  removeGalleryItemEndpoint,
  reorderGalleryEndpoint,
  replaceGalleryItemEndpoint,
} from "../../../../api/doctor-profile.endpoints";
import type { GalleryItem } from "../../interfaces/doctor-profile.interface";
import { GalleryItemModal } from "./gallery-item-modal";

export interface DoctorProfileGalleryProps {
  gallery: GalleryItem[];
  onChanged: () => void;
}

// Cast to Record<string, unknown>: the gallery endpoints type their body
// this way for the same reason CustomForm's buildSubmitBody() output does
// (see review.endpoints.ts) — FormData doesn't structurally match a JSON
// body type, but the server always expects multipart here regardless.
function buildGalleryFormData(file: File | null, altText: LocalizedString): Record<string, unknown> {
  const formData = new FormData();
  formData.set("payload", JSON.stringify({ altText }));
  if (file) formData.set("image", file);
  return formData as unknown as Record<string, unknown>;
}

/**
 * Gallery items each own a real embedded asset, so they can't be bundled
 * into the main profile form's single multipart submit (see the
 * plan's Campaign-blocks precedent) — this manages them independently via
 * their own sub-resource routes, refetching the whole profile after every
 * change since the parent page owns the actual data.
 *
 * Deliberately stays on `AssetThumbnail`/`AssetLightbox` directly rather
 * than the higher-level `AssetViewer` — each thumbnail here sits alongside
 * its own move/edit/remove controls and a shared `lightboxIndex` that a
 * modal also needs to read/write, which `AssetViewer`'s self-contained
 * state doesn't expose. This is exactly the "custom editing/reordering"
 * case `AssetViewer` isn't meant to absorb.
 */
export function DoctorProfileGallery({ gallery, onChanged }: DoctorProfileGalleryProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  // A single shared lightbox for the whole gallery (not one per thumbnail)
  // is what makes prev/next navigate across every photo in the group.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const addMutation = useRequesterMutation({
    endpoint: addGalleryItemEndpoint,
    onSuccess: () => {
      setAddOpen(false);
      toast.success("Gallery item added");
      onChanged();
    },
  });
  const replaceMutation = useRequesterMutation({
    endpoint: replaceGalleryItemEndpoint,
    onSuccess: () => {
      setEditingItem(null);
      toast.success("Gallery item updated");
      onChanged();
    },
  });
  const removeMutation = useRequesterMutation({
    endpoint: removeGalleryItemEndpoint,
    onSuccess: () => {
      toast.success("Gallery item removed");
      onChanged();
    },
  });
  const reorderMutation = useRequesterMutation({ endpoint: reorderGalleryEndpoint, onSuccess: onChanged });

  function handleMove(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    const itemIds = gallery.map((item) => item.id);
    [itemIds[index], itemIds[target]] = [itemIds[target], itemIds[index]];
    reorderMutation.mutate({ body: { itemIds } });
  }

  async function handleRemove(item: GalleryItem): Promise<void> {
    const confirmed = await confirm({
      title: "Remove gallery item?",
      description: "This permanently deletes the photo from Cloudinary.",
      confirmText: "Remove",
      variant: "destructive",
    });
    if (confirmed) removeMutation.mutate({ params: { itemId: item.id } });
  }

  return (
    <PageSection icon={Images} title="Gallery">
      <div className="flex flex-wrap gap-6">
        {gallery.map((item, index) => (
          <div key={item.id} className="flex w-32 flex-shrink-0 flex-col items-center gap-2">
            <AssetThumbnail
              src={item.image.secureUrl}
              alt={item.altText.en || item.altText.ar || "Gallery photo"}
              width={item.image.width}
              height={item.image.height}
              className="h-32 w-32"
              onClick={() => setLightboxIndex(index)}
            />
            <p className="w-full truncate text-center text-xs text-slate-500">
              {item.altText.en || item.altText.ar || "—"}
            </p>
            {/* A 2x2 grid, not a 4-across row — four icon buttons in a row
                would be wider than this card and spill into the neighbor's
                controls. */}
            <div className="grid grid-cols-2 gap-1">
              <CustomButton
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move left"
                disabled={index === 0}
                onClick={() => handleMove(index, -1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </CustomButton>
              <CustomButton
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Move right"
                disabled={index === gallery.length - 1}
                onClick={() => handleMove(index, 1)}
              >
                <ArrowRight className="h-4 w-4" />
              </CustomButton>
              <CustomButton type="button" size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditingItem(item)}>
                <Pencil className="h-4 w-4" />
              </CustomButton>
              <CustomButton type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => handleRemove(item)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </CustomButton>
            </div>
          </div>
        ))}
      </div>

      <CustomButton type="button" className="mt-4" variant="outline" leftIcon={Plus} onClick={() => setAddOpen(true)}>
        Add photo
      </CustomButton>

      <GalleryItemModal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add gallery photo"
        requireImage
        loading={addMutation.loading}
        onSubmit={({ file, altText }) => addMutation.mutate({ body: buildGalleryFormData(file, altText) })}
      />

      {editingItem ? (
        <GalleryItemModal
          open
          onOpenChange={() => setEditingItem(null)}
          title="Edit gallery photo"
          initialAltText={editingItem.altText}
          loading={replaceMutation.loading}
          onSubmit={({ file, altText }) =>
            replaceMutation.mutate({ params: { itemId: editingItem.id }, body: buildGalleryFormData(file, altText) })
          }
        />
      ) : null}

      {lightboxIndex !== null ? (
        <AssetLightbox
          images={gallery.map((item) => ({
            src: item.image.secureUrl,
            alt: item.altText.en || item.altText.ar || "Gallery photo",
            width: item.image.width,
            height: item.image.height,
          }))}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      ) : null}

      {dialog}
    </PageSection>
  );
}
