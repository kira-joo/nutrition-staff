import { FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { ComponentType } from "react";
import { EMPTY_RICH_TEXT_DOC } from "src/common/books/rich-text/rich-text-doc.interface";
import { BookBlockType } from "src/common/enums";
import { arabicInput } from "src/common/forms/books/arabic-fields";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookReference } from "src/common/interfaces/book-chapter.interface";
import { bookContentImagePolicy } from "src/common/upload-policies";
import {
  CitationBlockPreview,
  ImageBlockPreview,
  ListBlockPreview,
  PageFooterNoteBlockPreview,
  QrLinkBlockPreview,
  RecipeRefBlockPreview,
  RichTextBlockPreview,
  SimpleBlockPreview,
  TableBlockPreview,
  TextBlockPreview,
} from "./block-previews";
import { checklistItemsField } from "./fields/checklist-items-field";
import { citationPickerField } from "./fields/citation-picker-field";
import { fromListItems, listItemsField, toListItems } from "./fields/list-items-field";
import { recipePickerField } from "./fields/recipe-picker-field";
import { richTextField } from "./fields/rich-text-field";
import { tableGridField, type TableGridValue } from "./fields/table-grid-field";

export interface BookBlockRegistryCtx {
  references: BookReference[];
}

export interface BookBlockRegistryEntry {
  label: string;
  group: "text" | "media" | "structure" | "reference";
  /** Adds instantly with no editor modal — both PAGE_BREAK and DIVIDER are contentless. */
  immediate?: boolean;
  fields: (ctx: BookBlockRegistryCtx) => FormFieldConfig<Record<string, unknown>>[];
  defaultValues: (block: BookBlock | undefined) => Record<string, unknown>;
  /** Converts the form's internal representation back to the wire payload shape for this type (e.g. table grid, list items). Identity for most types. */
  transformSubmit: (values: Record<string, unknown>) => Record<string, unknown>;
  Preview: ComponentType<{ block: BookBlock }>;
}

const emptyDoc = () => structuredClone(EMPTY_RICH_TEXT_DOC);

/**
 * One entry per block type — a new block type adds one entry here (and
 * one to `BOOK_BLOCK_DTO_BY_TYPE`/`getBookBlockAssetFields` on the
 * server). Fields hold config data, not components, so 17 types cost far
 * fewer files than 17 dedicated editors would — a deliberate scaling
 * decision from the architecture plan (Campaigns has 7 types and uses a
 * dedicated editor per type; Books has 2.5x that, so this repo
 * deliberately does not follow that same per-type-editor convention here).
 */
export const bookBlockRegistry: Record<BookBlockType, BookBlockRegistryEntry> = {
  [BookBlockType.HEADING]: {
    label: "Heading",
    group: "text",
    fields: () => [arabicInput("text", "Heading text", { rules: { required: true } })],
    defaultValues: (block) => ({ text: block?.type === BookBlockType.HEADING ? block.text : "" }),
    transformSubmit: (values) => values,
    Preview: TextBlockPreview,
  },
  [BookBlockType.SUBHEADING]: {
    label: "Subheading",
    group: "text",
    fields: () => [arabicInput("text", "Subheading text", { rules: { required: true } })],
    defaultValues: (block) => ({ text: block?.type === BookBlockType.SUBHEADING ? block.text : "" }),
    transformSubmit: (values) => values,
    Preview: TextBlockPreview,
  },
  [BookBlockType.PARAGRAPH]: {
    label: "Paragraph",
    group: "text",
    fields: (ctx) => [
      richTextField(
        "richText",
        "Text",
        ctx.references.map((reference) => ({ id: reference.id, label: reference.label })),
      ),
    ],
    defaultValues: (block) => ({ richText: block?.type === BookBlockType.PARAGRAPH ? block.richText : emptyDoc() }),
    transformSubmit: (values) => values,
    Preview: RichTextBlockPreview,
  },
  [BookBlockType.IMAGE]: {
    label: "Image",
    group: "media",
    fields: () => [
      { type: FieldType.IMAGE_ASSET, name: "image", label: "Image", policy: bookContentImagePolicy },
      arabicInput("caption", "Caption (optional)"),
    ],
    defaultValues: (block) => ({
      image: block?.type === BookBlockType.IMAGE ? block.image : null,
      caption: block?.type === BookBlockType.IMAGE ? (block.caption ?? "") : "",
    }),
    transformSubmit: (values) => values,
    Preview: ImageBlockPreview,
  },
  [BookBlockType.BULLET_LIST]: {
    label: "Bullet list",
    group: "structure",
    fields: () => [listItemsField("items", "Items")],
    defaultValues: (block) => ({
      items: toListItems(block?.type === BookBlockType.BULLET_LIST ? block.items : undefined),
    }),
    transformSubmit: (values) => ({ ...values, items: fromListItems(values.items as { value: string }[]) }),
    Preview: ListBlockPreview,
  },
  [BookBlockType.NUMBERED_LIST]: {
    label: "Numbered list",
    group: "structure",
    fields: () => [listItemsField("items", "Items")],
    defaultValues: (block) => ({
      items: toListItems(block?.type === BookBlockType.NUMBERED_LIST ? block.items : undefined),
    }),
    transformSubmit: (values) => ({ ...values, items: fromListItems(values.items as { value: string }[]) }),
    Preview: ListBlockPreview,
  },
  [BookBlockType.CHECKLIST]: {
    label: "Checklist",
    group: "structure",
    fields: () => [checklistItemsField("items", "Items")],
    defaultValues: (block) => ({
      items:
        block?.type === BookBlockType.CHECKLIST ? block.items : [{ id: crypto.randomUUID(), text: "", checked: false }],
    }),
    transformSubmit: (values) => values,
    Preview: ListBlockPreview,
  },
  [BookBlockType.QUOTE]: {
    label: "Quote",
    group: "text",
    fields: (ctx) => [
      richTextField(
        "richText",
        "Quote",
        ctx.references.map((reference) => ({ id: reference.id, label: reference.label })),
      ),
      arabicInput("attribution", "Attribution (optional)"),
    ],
    defaultValues: (block) => ({
      richText: block?.type === BookBlockType.QUOTE ? block.richText : emptyDoc(),
      attribution: block?.type === BookBlockType.QUOTE ? (block.attribution ?? "") : "",
    }),
    transformSubmit: (values) => values,
    Preview: RichTextBlockPreview,
  },
  [BookBlockType.TIP]: calloutEntry(BookBlockType.TIP, "Tip"),
  [BookBlockType.NOTE]: calloutEntry(BookBlockType.NOTE, "Note"),
  [BookBlockType.WARNING]: calloutEntry(BookBlockType.WARNING, "Warning"),
  [BookBlockType.TABLE]: {
    label: "Table",
    group: "structure",
    fields: () => [tableGridField("table", "Table")],
    defaultValues: (block) => ({
      table:
        block?.type === BookBlockType.TABLE
          ? { headers: block.headers, rows: block.rows }
          : { headers: ["", ""], rows: [] },
    }),
    transformSubmit: (values) => {
      const table = values.table as TableGridValue;
      const { table: _table, ...rest } = values;
      return { ...rest, headers: table.headers, rows: table.rows };
    },
    Preview: TableBlockPreview,
  },
  [BookBlockType.DIVIDER]: {
    label: "Divider",
    group: "structure",
    immediate: true,
    fields: () => [],
    defaultValues: () => ({}),
    transformSubmit: (values) => values,
    Preview: SimpleBlockPreview,
  },
  [BookBlockType.PAGE_BREAK]: {
    label: "Page break",
    group: "structure",
    immediate: true,
    fields: () => [],
    defaultValues: () => ({}),
    transformSubmit: (values) => values,
    Preview: SimpleBlockPreview,
  },
  [BookBlockType.QR_LINK]: {
    label: "QR link",
    group: "reference",
    fields: () => [
      arabicInput("label", "Label (optional)"),
      { type: FieldType.INPUT, name: "destination", label: "Destination URL", inputType: "url" },
    ],
    defaultValues: (block) => ({
      label: block?.type === BookBlockType.QR_LINK ? (block.label ?? "") : "",
      destination: block?.type === BookBlockType.QR_LINK ? block.destination : "",
    }),
    transformSubmit: (values) => values,
    Preview: QrLinkBlockPreview,
  },
  [BookBlockType.RECIPE_REF]: {
    label: "Recipe reference",
    group: "reference",
    fields: () => [recipePickerField("recipeId", "Recipe"), arabicInput("displayTitle", "Display title (optional)")],
    defaultValues: (block) => ({
      recipeId: block?.type === BookBlockType.RECIPE_REF ? block.recipeId : "",
      displayTitle: block?.type === BookBlockType.RECIPE_REF ? (block.displayTitle ?? "") : "",
    }),
    transformSubmit: (values) => values,
    Preview: RecipeRefBlockPreview,
  },
  [BookBlockType.CITATION]: {
    label: "Citation",
    group: "reference",
    fields: (ctx) => [citationPickerField("referenceId", "Reference", ctx.references)],
    defaultValues: (block) => ({ referenceId: block?.type === BookBlockType.CITATION ? block.referenceId : "" }),
    transformSubmit: (values) => values,
    Preview: CitationBlockPreview,
  },
  // Arabic label deliberately, unlike every other type's English label —
  // the doctor needs to understand THIS ONE pins to the page's bottom
  // instead of flowing normally, which "Footer note" ("bottom-of-page
  // text") conveys and an English name like "Footer note" would not.
  [BookBlockType.PAGE_FOOTER_NOTE]: {
    label: "Footer note",
    group: "structure",
    fields: (ctx) => [
      richTextField(
        "richText",
        "Footer note text",
        ctx.references.map((reference) => ({ id: reference.id, label: reference.label })),
      ),
    ],
    defaultValues: (block) => ({
      richText: block?.type === BookBlockType.PAGE_FOOTER_NOTE ? block.richText : emptyDoc(),
    }),
    transformSubmit: (values) => values,
    Preview: PageFooterNoteBlockPreview,
  },
};

function calloutEntry(
  type: BookBlockType.TIP | BookBlockType.NOTE | BookBlockType.WARNING,
  label: string,
): BookBlockRegistryEntry {
  return {
    label,
    group: "text",
    fields: (ctx) => [
      arabicInput("title", "Title (optional)"),
      richTextField(
        "richText",
        "Body",
        ctx.references.map((reference) => ({ id: reference.id, label: reference.label })),
      ),
    ],
    defaultValues: (block) => ({
      title: block?.type === type ? (block.title ?? "") : "",
      richText: block?.type === type ? block.richText : emptyDoc(),
    }),
    transformSubmit: (values) => values,
    Preview: RichTextBlockPreview,
  };
}
