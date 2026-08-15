"use client";

import { useRequesterMutation, type ImageAsset, type UploadPolicy } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomImageAssetUpload, CustomInput, CustomSwitch, CustomTextarea, toast } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import { updateChapterEndpoint } from "../../../api/book-content.endpoints";
import type { Chapter } from "src/common/interfaces/book-chapter.interface";
import type { Book } from "src/common/interfaces/book.interface";
import { bookContentImagePolicy } from "src/common/upload-policies";

export interface ChapterSettingsFormProps {
  bookId: string;
  chapter: Chapter;
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
}

/**
 * Everything about a chapter except its title (autosaves inline in the
 * collapsed row) and its blocks (their own list below this). An explicit
 * Save panel, not `CustomForm` — submission must go through the shared
 * content queue (`enqueue`) so it can never race a block/reorder
 * mutation using a stale `contentRevision`, same manual multipart
 * pattern the Overrides page already uses for its own image fields.
 *
 * Deliberately no `order` field here — reordering is drag/arrow-buttons
 * only (see ChapterList), never a typed-in number.
 */
export function ChapterSettingsForm({ bookId, chapter, enqueue }: ChapterSettingsFormProps) {
  const [subtitle, setSubtitle] = useState(chapter.subtitle ?? "");
  const [intro, setIntro] = useState(chapter.intro ?? "");
  const [coverImage, setCoverImage] = useState<ImageAsset | File | null>(chapter.coverImage ?? null);
  const [startOnNewPage, setStartOnNewPage] = useState(chapter.startOnNewPage);
  const [includeInToc, setIncludeInToc] = useState(chapter.includeInToc);
  const [tocTitle, setTocTitle] = useState(chapter.tocTitle ?? "");

  const updateMutation = useRequesterMutation({ endpoint: updateChapterEndpoint });

  function handleSave(): void {
    const jsonPayload: Record<string, unknown> = {
      subtitle,
      intro,
      startOnNewPage,
      includeInToc,
      // Never sent while hidden — a title typed before turning "include in
      // TOC" off stays in local state (so it reappears if turned back on)
      // but must not persist server-side as if it were still active.
      tocTitle: includeInToc ? tocTitle : "",
    };
    // A File is sent as its own multipart field; an unchanged ImageAsset or
    // an explicit `null` (cleared) stays in the JSON payload as-is — same
    // convention `destroyReplacedAssets` expects everywhere else.
    if (!(coverImage instanceof File)) jsonPayload.coverImage = coverImage ?? null;

    enqueue((expectedRevision) => {
      const formData = new FormData();
      formData.set("payload", JSON.stringify({ ...jsonPayload, expectedRevision }));
      if (coverImage instanceof File) formData.set("coverImage", coverImage);
      return updateMutation.mutateAsync({ params: { bookId, chapterId: chapter.id }, body: formData as unknown as Record<string, unknown> });
    })
      .then(() => toast.success("Chapter settings saved"))
      .catch((error: { message?: string }) => toast.error(error.message ?? "Failed to save chapter settings"));
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3">
      <CustomInput name={`chapter-subtitle-${chapter.id}`} label="Subtitle (optional)" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} dir="rtl" />
      <CustomTextarea
        name={`chapter-intro-${chapter.id}`}
        label="Intro (optional)"
        rows={3}
        value={intro}
        onChange={(event) => setIntro(event.target.value)}
        dir="rtl"
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Cover image (optional)</label>
        <CustomImageAssetUpload value={coverImage} policy={bookContentImagePolicy as UploadPolicy} onChange={setCoverImage} />
      </div>
      <CustomSwitch checked={startOnNewPage} onChange={setStartOnNewPage} label="Always start this chapter on a fresh page" />
      <CustomSwitch checked={includeInToc} onChange={setIncludeInToc} label="Show this chapter in the table of contents" />
      {includeInToc ? (
        <CustomInput
          name={`chapter-toc-title-${chapter.id}`}
          label="Table of contents title (optional — uses the chapter title if left blank)"
          value={tocTitle}
          onChange={(event) => setTocTitle(event.target.value)}
          dir="rtl"
        />
      ) : null}
      <CustomButton type="button" loading={updateMutation.loading} onClick={handleSave} className="self-start">
        Save chapter settings
      </CustomButton>
    </div>
  );
}
