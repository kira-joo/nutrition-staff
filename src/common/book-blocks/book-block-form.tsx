"use client";

import type { ApiError, Endpoint } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, toast } from "@kira-joo/frontend-toolkit-tailwind";
import type { BookBlockType } from "src/common/enums";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import type { Book } from "src/common/interfaces/book.interface";
import { bookBlockRegistry } from "./book-block-registry";

/** Every block add/replace endpoint (chapter or section container) shares this exact shape — see the doc comment on the params types in `book-content.endpoints.ts`. */
export type BookBlockEndpoint = Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }>;

export interface BookBlockFormProps {
  blockType: BookBlockType;
  defaultBlock?: BookBlock;
  references: BookReference[];
  endpoint: BookBlockEndpoint;
  submitParams: Record<string, string>;
  expectedRevision: number;
  onSuccess: () => void;
}

/**
 * One generic form for all 17 block types, driven entirely by
 * `bookBlockRegistry[blockType]`'s field config — see that file's doc
 * comment for why this repo doesn't follow Campaign's one-dedicated-
 * editor-per-type convention here.
 */
export function BookBlockForm({ blockType, defaultBlock, references, endpoint, submitParams, expectedRevision, onSuccess }: BookBlockFormProps) {
  const entry = bookBlockRegistry[blockType];

  return (
    <CustomForm<Record<string, unknown>, BookBlockEndpoint>
      fields={entry.fields({ references })}
      defaultValues={entry.defaultValues(defaultBlock)}
      transformValues={(values) => ({ ...entry.transformSubmit(values), type: blockType, expectedRevision })}
      submitEndpoint={endpoint}
      submitParams={submitParams}
      onSuccess={() => {
        toast.success(defaultBlock ? "Block updated" : "Block added");
        onSuccess();
      }}
      onError={(error: ApiError) => toast.error(error.message)}
      submitButtonText={defaultBlock ? "Save changes" : "Add block"}
      layout="grid"
      columns={1}
    />
  );
}
