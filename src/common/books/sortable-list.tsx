"use client";

import { CustomButton } from "@kira-joo/frontend-toolkit-tailwind";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { ReactNode } from "react";

export interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (orderedIds: string[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  disabled?: boolean;
}

/**
 * dnd-kit drag handle PLUS move-up/move-down buttons on every row, always
 * both present — never drag-only. This is the one place in the app that
 * introduces drag-and-drop (Campaign blocks and the Doctor Profile gallery
 * both use buttons only, per their own doc comments — "no drag-and-drop
 * dependency exists in the toolkit yet"). Rows are keyed by the item's own
 * stable id, never array index, specifically because `array-field-editor.tsx`
 * keying by index is a known latent bug this component deliberately does
 * not repeat.
 */
export function SortableList<T>({ items, getId, onReorder, renderItem, disabled }: SortableListProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = items.map(getId);

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = ids.indexOf(String(active.id));
    const toIndex = ids.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onReorder(next);
  }

  function moveByButton(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)} disabled={disabled}>
              {({ dragHandleProps }) => (
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <CustomButton type="button" size="icon" variant="ghost" aria-label="Move up" disabled={disabled || index === 0} onClick={() => moveByButton(index, -1)}>
                      <ArrowUp className="h-4 w-4" />
                    </CustomButton>
                    <span className={`cursor-grab p-1 text-slate-400 ${disabled ? "opacity-40" : ""}`} aria-label="Drag to reorder" {...dragHandleProps}>
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <CustomButton
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="Move down"
                      disabled={disabled || index === items.length - 1}
                      onClick={() => moveByButton(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </CustomButton>
                  </div>
                  <div className="flex-1">{renderItem(item, index)}</div>
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * One `useSortable` call per row — `setNodeRef`/`transform`/`transition`
 * go on the outer container, `attributes`/`listeners` are handed to the
 * caller to place on the grip icon only, so dragging can never start from
 * a button or a field inside the row.
 */
function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (args: { dragHandleProps: Record<string, unknown> }) => ReactNode;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-md border border-slate-200 p-2 ${isDragging ? "opacity-60" : ""}`}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}
