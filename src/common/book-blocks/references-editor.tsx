"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomInput, Modal, toast, useConfirmDialog } from "@kira-joo/frontend-toolkit-tailwind";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { addReferenceEndpoint, removeReferenceEndpoint, reorderReferencesEndpoint, updateReferenceEndpoint } from "../../../api/book-content.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import { SortableList } from "src/common/books/sortable-list";

export interface ReferencesEditorProps {
  bookId: string;
  book: Book;
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
}

export function ReferencesEditor({ bookId, book, enqueue }: ReferencesEditorProps) {
  const { confirm, dialog } = useConfirmDialog();
  const [editing, setEditing] = useState<BookReference | "new" | null>(null);

  const reorderMutation = useRequesterMutation({ endpoint: reorderReferencesEndpoint });
  const removeMutation = useRequesterMutation({ endpoint: removeReferenceEndpoint });

  function handleReorder(orderedIds: string[]): void {
    enqueue((expectedRevision) => reorderMutation.mutateAsync({ params: { bookId }, body: { referenceIds: orderedIds, expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to reorder references")
    );
  }

  async function handleRemove(reference: BookReference): Promise<void> {
    const confirmed = await confirm({ title: "Remove reference?", description: "Any block citing this reference must be updated first.", confirmText: "Remove", variant: "destructive" });
    if (!confirmed) return;
    enqueue((expectedRevision) => removeMutation.mutateAsync({ params: { bookId, referenceId: reference.id }, body: { expectedRevision } })).catch(
      (error: { message?: string }) => toast.error(error.message ?? "Failed to remove reference")
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <SortableList
        items={book.references}
        getId={(reference) => reference.id}
        onReorder={handleReorder}
        renderItem={(reference) => (
          <div className="flex items-start justify-between gap-2" dir="rtl">
            <div>
              <p className="font-medium">{reference.label}</p>
              <p className="text-sm text-slate-600">{reference.text}</p>
              {reference.url ? <p className="text-xs text-slate-400" dir="ltr">{reference.url}</p> : null}
            </div>
            <div className="flex gap-1">
              <CustomButton type="button" size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(reference)}>
                <Pencil className="h-4 w-4" />
              </CustomButton>
              <CustomButton type="button" size="icon" variant="ghost" aria-label="Remove" onClick={() => handleRemove(reference)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </CustomButton>
            </div>
          </div>
        )}
      />

      <CustomButton type="button" variant="outline" leftIcon={Plus} onClick={() => setEditing("new")}>
        Add reference
      </CustomButton>

      {editing ? (
        <Modal open onOpenChange={() => setEditing(null)} title={editing === "new" ? "Add reference" : "Edit reference"} size="md">
          <ReferenceForm bookId={bookId} reference={editing === "new" ? undefined : editing} enqueue={enqueue} onSuccess={() => setEditing(null)} />
        </Modal>
      ) : null}

      {dialog}
    </div>
  );
}

function ReferenceForm({
  bookId,
  reference,
  enqueue,
  onSuccess,
}: {
  bookId: string;
  reference?: BookReference;
  enqueue: <T>(run: (expectedRevision: number) => Promise<T & Book>) => Promise<T & Book>;
  onSuccess: () => void;
}) {
  const [label, setLabel] = useState(reference?.label ?? "");
  const [text, setText] = useState(reference?.text ?? "");
  const [url, setUrl] = useState(reference?.url ?? "");

  const addMutation = useRequesterMutation({ endpoint: addReferenceEndpoint });
  const updateMutation = useRequesterMutation({ endpoint: updateReferenceEndpoint });

  async function handleSubmit(): Promise<void> {
    try {
      await enqueue((rev) =>
        reference
          ? updateMutation.mutateAsync({ params: { bookId, referenceId: reference.id }, body: { label, text, url: url || undefined, expectedRevision: rev } })
          : addMutation.mutateAsync({ params: { bookId }, body: { label, text, url: url || undefined, expectedRevision: rev } })
      );
      onSuccess();
    } catch (error) {
      toast.error((error as { message?: string }).message ?? "Failed to save reference");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <CustomInput name="label" label="Label" value={label} onChange={(event) => setLabel(event.target.value)} dir="rtl" />
      <CustomInput name="text" label="Text" value={text} onChange={(event) => setText(event.target.value)} dir="rtl" />
      <CustomInput name="url" label="URL (optional)" value={url} onChange={(event) => setUrl(event.target.value)} />
      <CustomButton type="button" onClick={handleSubmit}>
        {reference ? "Save changes" : "Add reference"}
      </CustomButton>
    </div>
  );
}
