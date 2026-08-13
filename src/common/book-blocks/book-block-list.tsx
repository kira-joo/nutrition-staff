"use client";

import { requester, useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  CustomButton,
  CustomSelect,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
  toast,
  useConfirmDialog,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Copy, MoveRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  addChapterBlockEndpoint,
  addSectionBlockEndpoint,
  duplicateChapterBlockEndpoint,
  duplicateSectionBlockEndpoint,
  moveBlockEndpoint,
  reorderChapterBlocksEndpoint,
  reorderSectionBlocksEndpoint,
  removeChapterBlockEndpoint,
  removeSectionBlockEndpoint,
  replaceChapterBlockEndpoint,
  replaceSectionBlockEndpoint,
} from "../../../api/book-content.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { Chapter } from "src/common/interfaces/book-chapter.interface";
import { BookBlockType } from "src/common/enums";
import { SortableList } from "src/common/books/sortable-list";
import { BookBlockForm } from "./book-block-form";
import { bookBlockRegistry } from "./book-block-registry";

export type ContainerDescriptor = { kind: "chapter"; chapterId: string } | { kind: "frontMatter"; slot: string } | { kind: "backMatter"; slot: string };

export interface BookBlockListProps {
  bookId: string;
  book: Book;
  container: ContainerDescriptor;
  blocks: BookBlock[];
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
}

const GROUP_LABELS: Record<string, string> = { text: "Text", media: "Media", structure: "Structure", reference: "Reference" };

function toRouteParams(container: ContainerDescriptor, bookId: string): Record<string, string> {
  if (container.kind === "chapter") return { bookId, chapterId: container.chapterId };
  return { bookId, section: container.kind === "frontMatter" ? "front-matter" : "back-matter", slot: container.slot };
}

function toMoveDescriptor(container: ContainerDescriptor): { chapterId?: string; section?: string; slot?: string } {
  if (container.kind === "chapter") return { chapterId: container.chapterId };
  return { section: container.kind === "frontMatter" ? "front-matter" : "back-matter", slot: container.slot };
}

/** Shared by chapter blocks and front-matter/back-matter blocks — one implementation, per the approved architecture ("front/back matter reuse the identical block registry, DTO dispatch, and sub-resource routes chapters use"). */
export function BookBlockList({ bookId, book, container, blocks, enqueue }: BookBlockListProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [adding, setAdding] = useState<BookBlockType | null>(null);
  const [editingBlock, setEditingBlock] = useState<BookBlock | null>(null);
  const [movingBlock, setMovingBlock] = useState<BookBlock | null>(null);

  const isChapter = container.kind === "chapter";
  const addEndpoint = isChapter ? addChapterBlockEndpoint : addSectionBlockEndpoint;
  const replaceEndpoint = isChapter ? replaceChapterBlockEndpoint : replaceSectionBlockEndpoint;
  const removeEndpoint = isChapter ? removeChapterBlockEndpoint : removeSectionBlockEndpoint;
  const duplicateEndpoint = isChapter ? duplicateChapterBlockEndpoint : duplicateSectionBlockEndpoint;
  const reorderEndpoint = isChapter ? reorderChapterBlocksEndpoint : reorderSectionBlocksEndpoint;
  const routeParams = toRouteParams(container, bookId);

  const removeMutation = useRequesterMutation({ endpoint: removeEndpoint });
  const duplicateMutation = useRequesterMutation({ endpoint: duplicateEndpoint });
  const reorderMutation = useRequesterMutation({ endpoint: reorderEndpoint });
  const moveMutation = useRequesterMutation({ endpoint: moveBlockEndpoint });

  function handleReorder(orderedIds: string[]): void {
    enqueue((expectedRevision) => reorderMutation.mutateAsync({ params: routeParams, body: { blockIds: orderedIds, expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to reorder blocks")
    );
  }

  async function handleRemove(block: BookBlock): Promise<void> {
    const confirmed = await confirm({ title: "Remove block?", description: "This permanently deletes the block and any assets it owns.", confirmText: "Remove", variant: "destructive" });
    if (!confirmed) return;
    enqueue((expectedRevision) => removeMutation.mutateAsync({ params: { ...routeParams, blockId: block.id }, body: { expectedRevision } })).catch((error: { message?: string }) =>
      toast.error(error.message ?? "Failed to remove block")
    );
  }

  function handleDuplicate(block: BookBlock): void {
    enqueue((expectedRevision) => duplicateMutation.mutateAsync({ params: { ...routeParams, blockId: block.id }, body: { expectedRevision } })).catch((error: { message?: string }) =>
      toast.error(error.message ?? "Failed to duplicate block")
    );
  }

  function handleMove(destination: ContainerDescriptor): void {
    if (!movingBlock) return;
    enqueue((expectedRevision) =>
      moveMutation.mutateAsync({
        params: { bookId },
        body: { blockId: movingBlock.id, from: toMoveDescriptor(container), to: toMoveDescriptor(destination), expectedRevision },
      })
    )
      .then(() => setMovingBlock(null))
      .catch((error: { message?: string }) => toast.error(error.message ?? "Failed to move block"));
  }

  function handleAddImmediate(type: BookBlockType): void {
    // The add-block route is always multipart (any OTHER type may carry an
    // image) — so even a contentless type like PAGE_BREAK/DIVIDER must be
    // sent as `FormData` with a `payload` field, never a plain JSON body.
    enqueue((expectedRevision) => {
      const formData = new FormData();
      formData.set("payload", JSON.stringify({ type, expectedRevision }));
      return requester(addEndpoint, { params: routeParams, body: formData as unknown as Record<string, unknown> }) as Promise<Book>;
    }).catch((error: { message?: string }) => toast.error(error.message ?? "Failed to add block"));
  }

  const groups = Object.entries(GROUP_LABELS) as [string, string][];

  return (
    <div className="flex flex-col gap-3">
      <SortableList
        items={blocks}
        getId={(block) => block.id}
        onReorder={handleReorder}
        renderItem={(block) => {
          const entry = bookBlockRegistry[block.type];
          const Preview = entry.Preview;
          return (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase text-slate-500">{entry.label}</span>
                <div className="flex gap-1">
                  {entry.fields({ references: book.references }).length > 0 ? (
                    <CustomButton type="button" size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditingBlock(block)}>
                      <Pencil className="h-4 w-4" />
                    </CustomButton>
                  ) : null}
                  <CustomButton type="button" size="icon" variant="ghost" aria-label="Duplicate" onClick={() => handleDuplicate(block)}>
                    <Copy className="h-4 w-4" />
                  </CustomButton>
                  <CustomButton type="button" size="icon" variant="ghost" aria-label="Move to another chapter" onClick={() => setMovingBlock(block)}>
                    <MoveRight className="h-4 w-4" />
                  </CustomButton>
                  <CustomButton type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => handleRemove(block)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </CustomButton>
                </div>
              </div>
              <Preview block={block} />
            </div>
          );
        }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <CustomButton type="button" variant="outline" leftIcon={Plus}>
            Add block
          </CustomButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {groups.map(([groupKey, groupLabel]) => (
            <div key={groupKey}>
              <p className="px-2 pt-2 text-xs font-semibold uppercase text-slate-400">{groupLabel}</p>
              {(Object.entries(bookBlockRegistry) as [BookBlockType, (typeof bookBlockRegistry)[BookBlockType]][])
                .filter(([, entry]) => entry.group === groupKey)
                .map(([type, entry]) => (
                  <DropdownMenuItem key={type} onSelect={() => (entry.immediate ? handleAddImmediate(type) : setAdding(type))}>
                    {entry.label}
                  </DropdownMenuItem>
                ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {adding ? (
        <Modal open onOpenChange={() => setAdding(null)} title={`Add ${bookBlockRegistry[adding].label} block`} size="lg">
          <BookBlockForm
            blockType={adding}
            references={book.references}
            endpoint={addEndpoint}
            submitParams={routeParams}
            expectedRevision={book.contentRevision}
            onSuccess={() => setAdding(null)}
          />
        </Modal>
      ) : null}

      {editingBlock ? (
        <Modal open onOpenChange={() => setEditingBlock(null)} title={`Edit ${bookBlockRegistry[editingBlock.type].label} block`} size="lg">
          <BookBlockForm
            blockType={editingBlock.type}
            defaultBlock={editingBlock}
            references={book.references}
            endpoint={replaceEndpoint}
            submitParams={{ ...routeParams, blockId: editingBlock.id }}
            expectedRevision={book.contentRevision}
            onSuccess={() => setEditingBlock(null)}
          />
        </Modal>
      ) : null}

      {movingBlock ? (
        <Modal open onOpenChange={() => setMovingBlock(null)} title="Move block" size="sm">
          <MoveBlockDestinationPicker book={book} currentContainer={container} onSelect={handleMove} />
        </Modal>
      ) : null}

      {dialog}
    </div>
  );
}

function MoveBlockDestinationPicker({
  book,
  currentContainer,
  onSelect,
}: {
  book: Book;
  currentContainer: ContainerDescriptor;
  onSelect: (destination: ContainerDescriptor) => void;
}) {
  const options: { label: string; value: string; descriptor: ContainerDescriptor }[] = [
    { label: "About the book (front matter)", value: "front:aboutBook", descriptor: { kind: "frontMatter" as const, slot: "aboutBook" } },
    { label: "Introduction (front matter)", value: "front:introduction", descriptor: { kind: "frontMatter" as const, slot: "introduction" } },
    ...book.chapters.map((chapter: Chapter) => ({ label: chapter.title, value: `chapter:${chapter.id}`, descriptor: { kind: "chapter" as const, chapterId: chapter.id } })),
    { label: "Conclusion (back matter)", value: "back:conclusion", descriptor: { kind: "backMatter" as const, slot: "conclusion" } },
  ].filter((option) => JSON.stringify(option.descriptor) !== JSON.stringify(currentContainer));

  return (
    <CustomSelect
      name="destination"
      placeholder="Select a destination"
      options={options.map((option) => ({ label: option.label, value: option.value }))}
      onChange={(value) => {
        const selected = options.find((option) => option.value === value);
        if (selected) onSelect(selected.descriptor);
      }}
    />
  );
}
