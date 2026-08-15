"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomInput, Modal, toast, useConfirmDialog } from "@kira-joo/frontend-toolkit-tailwind";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  addChapterEndpoint,
  duplicateChapterEndpoint,
  removeChapterEndpoint,
  reorderChaptersEndpoint,
  updateChapterEndpoint,
} from "../../../api/book-content.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import { useDebouncedAutosave } from "src/common/books/use-debounced-autosave";
import { SortableList } from "src/common/books/sortable-list";
import { BookBlockList } from "./book-block-list";
import { ChapterSettingsForm } from "./chapter-settings-form";

export interface ChapterListProps {
  bookId: string;
  book: Book;
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
}

export function ChapterList({ bookId, book, enqueue }: ChapterListProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const addMutation = useRequesterMutation({ endpoint: addChapterEndpoint });
  const removeMutation = useRequesterMutation({ endpoint: removeChapterEndpoint });
  const reorderMutation = useRequesterMutation({ endpoint: reorderChaptersEndpoint });
  const duplicateMutation = useRequesterMutation({ endpoint: duplicateChapterEndpoint });

  function handleReorder(orderedIds: string[]): void {
    enqueue((expectedRevision) => reorderMutation.mutateAsync({ params: { bookId }, body: { chapterIds: orderedIds, expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to reorder chapters")
    );
  }

  async function handleAddChapter(): Promise<void> {
    if (!newTitle.trim()) return;
    try {
      await enqueue((expectedRevision) => {
        const formData = new FormData();
        formData.set("payload", JSON.stringify({ title: newTitle, expectedRevision }));
        return addMutation.mutateAsync({ params: { bookId }, body: formData as unknown as Record<string, unknown> });
      });
      setNewTitle("");
      setAddingChapter(false);
    } catch (error) {
      toast.error((error as { message?: string }).message ?? "Failed to add chapter");
    }
  }

  async function handleRemove(chapterId: string): Promise<void> {
    const confirmed = await confirm({
      title: "Remove chapter?",
      description: "This permanently deletes the chapter, every block inside it, and any assets they own.",
      confirmText: "Remove",
      variant: "destructive",
    });
    if (!confirmed) return;
    enqueue((expectedRevision) => removeMutation.mutateAsync({ params: { bookId, chapterId }, body: { expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to remove chapter")
    );
  }

  function handleDuplicate(chapterId: string): void {
    enqueue((expectedRevision) => duplicateMutation.mutateAsync({ params: { bookId, chapterId }, body: { expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to duplicate chapter")
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SortableList
        items={book.chapters}
        getId={(chapter) => chapter.id}
        onReorder={handleReorder}
        renderItem={(chapter) => (
          <ChapterRow
            bookId={bookId}
            book={book}
            chapterId={chapter.id}
            title={chapter.title}
            blockCount={chapter.blocks.length}
            expanded={expandedId === chapter.id}
            onToggle={() => setExpandedId(expandedId === chapter.id ? null : chapter.id)}
            onRemove={() => handleRemove(chapter.id)}
            onDuplicate={() => handleDuplicate(chapter.id)}
            enqueue={enqueue}
          />
        )}
      />

      {addingChapter ? (
        <Modal open onOpenChange={() => setAddingChapter(false)} title="Add chapter" size="sm">
          <div className="flex flex-col gap-3">
            <CustomInput name="title" label="Chapter title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} dir="rtl" />
            <CustomButton type="button" onClick={handleAddChapter}>
              Add chapter
            </CustomButton>
          </div>
        </Modal>
      ) : null}

      <CustomButton type="button" variant="outline" leftIcon={Plus} onClick={() => setAddingChapter(true)}>
        Add chapter
      </CustomButton>

      {dialog}
    </div>
  );
}

function ChapterRow({
  bookId,
  book,
  chapterId,
  title,
  blockCount,
  expanded,
  onToggle,
  onRemove,
  onDuplicate,
  enqueue,
}: {
  bookId: string;
  book: Book;
  chapterId: string;
  title: string;
  blockCount: number;
  expanded: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
}) {
  const [localTitle, setLocalTitle] = useState(title);
  const updateMutation = useRequesterMutation({ endpoint: updateChapterEndpoint });

  const { flush } = useDebouncedAutosave(localTitle, (value) => {
    if (!value.trim()) return;
    enqueue((expectedRevision) => {
      const formData = new FormData();
      formData.set("payload", JSON.stringify({ title: value, expectedRevision }));
      return updateMutation.mutateAsync({ params: { bookId, chapterId }, body: formData as unknown as Record<string, unknown> });
    }).catch((error: { message?: string }) => toast.error(error.message ?? "Failed to save chapter title"));
  });

  const chapter = book.chapters.find((chapter) => chapter.id === chapterId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <CustomInput name={`chapter-title-${chapterId}`} value={localTitle} onChange={(event) => setLocalTitle(event.target.value)} onBlur={flush} dir="rtl" wrapperClassName="flex-1" />
        <span className="whitespace-nowrap text-xs text-slate-500">{blockCount} blocks</span>
        <CustomButton type="button" size="icon" variant="ghost" aria-label="Duplicate chapter" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </CustomButton>
        <CustomButton type="button" size="icon" variant="ghost" aria-label="Remove chapter" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-red-600" />
        </CustomButton>
        <CustomButton type="button" size="icon" variant="ghost" aria-label={expanded ? "Collapse" : "Expand"} onClick={onToggle}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CustomButton>
      </div>
      {expanded && chapter ? (
        <div className="flex flex-col gap-3">
          <ChapterSettingsForm bookId={bookId} chapter={chapter} enqueue={enqueue} />
          <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
            <BookBlockList bookId={bookId} book={book} container={{ kind: "chapter", chapterId }} blocks={chapter.blocks} enqueue={enqueue} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
