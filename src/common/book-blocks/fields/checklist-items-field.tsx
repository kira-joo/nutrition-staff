"use client";

import { CustomInput, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";
import { ArrayFieldEditor } from "src/common/forms/array-field-editor";
import type { ChecklistItem } from "src/common/interfaces/book-block.interface";

export function checklistItemsField<T extends FieldValues>(name: Path<T>, label: string): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    render: ({ field }) => (
      <ArrayFieldEditor<ChecklistItem>
        items={(field.value as ChecklistItem[]) ?? []}
        onChange={field.onChange}
        createItem={() => ({ id: crypto.randomUUID(), text: "", checked: false })}
        addLabel="Add checklist item"
        emptyLabel="No items yet."
        renderItem={(item, _index, update) => (
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={item.checked} onChange={(event) => update({ checked: event.target.checked })} />
            <CustomInput
              name={`${name}-text`}
              value={item.text}
              onChange={(event) => update({ text: event.target.value })}
              dir="rtl"
              placeholder="Item text"
              wrapperClassName="flex-1"
            />
          </div>
        )}
      />
    ),
  };
}
