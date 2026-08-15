"use client";

import { CustomInput, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";
import { ArrayFieldEditor } from "src/common/forms/array-field-editor";

interface ListItem {
  value: string;
}

export function toListItems(items: string[] | undefined): ListItem[] {
  return (items ?? [""]).map((value) => ({ value }));
}

export function fromListItems(items: ListItem[]): string[] {
  return items.map((item) => item.value).filter((value) => value.trim().length > 0);
}

/** `ArrayFieldEditor`'s `update()` spreads `{...item, ...patch}` — that only works on object items, so a plain string list is wrapped as `{value: string}[]` at the field boundary (see `toListItems`/`fromListItems`). */
export function listItemsField<T extends FieldValues>(name: Path<T>, label: string): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    render: ({ field }) => (
      <ArrayFieldEditor<ListItem>
        items={(field.value as ListItem[]) ?? []}
        onChange={field.onChange}
        createItem={() => ({ value: "" })}
        addLabel="Add item"
        emptyLabel="No items yet."
        renderItem={(item, index, update) => (
          <CustomInput
            name={`${name}.${index}.value`}
            value={item.value}
            onChange={(event) => update({ value: event.target.value })}
            dir="rtl"
            placeholder="Item text"
          />
        )}
      />
    ),
  };
}
