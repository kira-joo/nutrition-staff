"use client";

import { CustomButton } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

export interface ArrayFieldEditorProps<TItem> {
  items: TItem[];
  onChange: (items: TItem[]) => void;
  createItem: () => TItem;
  renderItem: (item: TItem, index: number, update: (patch: Partial<TItem>) => void) => ReactNode;
  addLabel?: string;
  emptyLabel?: string;
}

/**
 * A generic repeatable-row editor for a `FieldType.CUSTOM` field bound to an
 * array value (e.g. `socialLinks`, `bioSections`) — add/remove/reorder via
 * up/down buttons rather than drag-and-drop. `order` is never a field the
 * user types: it's always just each item's current array index at submit
 * time, so reordering is "move this row," not "renumber it yourself."
 */
export function ArrayFieldEditor<TItem>({
  items,
  onChange,
  createItem,
  renderItem,
  addLabel = "Add item",
  emptyLabel = "No items yet.",
}: ArrayFieldEditorProps<TItem>) {
  function updateAt(index: number, patch: Partial<TItem>): void {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeAt(index: number): void {
    onChange(items.filter((_, i) => i !== index));
  }

  function moveAt(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? <p className="text-sm text-slate-500">{emptyLabel}</p> : null}
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 rounded-md border border-slate-200 p-3">
          <div className="flex flex-1 flex-col gap-2">{renderItem(item, index, (patch) => updateAt(index, patch))}</div>
          <div className="flex flex-col gap-1">
            <CustomButton
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => moveAt(index, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </CustomButton>
            <CustomButton
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={index === items.length - 1}
              onClick={() => moveAt(index, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </CustomButton>
            <CustomButton type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => removeAt(index)}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CustomButton>
          </div>
        </div>
      ))}
      <CustomButton type="button" variant="outline" leftIcon={Plus} onClick={() => onChange([...items, createItem()])}>
        {addLabel}
      </CustomButton>
    </div>
  );
}
