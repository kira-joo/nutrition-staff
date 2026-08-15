"use client";

import { CustomButton, CustomInput, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Plus, Trash2 } from "lucide-react";
import type { FieldValues, Path } from "react-hook-form";

export interface TableGridValue {
  headers: string[];
  rows: string[][];
}

/**
 * One combined field (`{headers, rows}`) rather than two separate array
 * fields — a row's cell count must always match the header count, which
 * is far simpler to keep true with one piece of state than to
 * synchronize across two independent `ArrayFieldEditor` instances.
 */
export function tableGridField<T extends FieldValues>(name: Path<T>, label: string): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    render: ({ field }) => {
      const value = (field.value as TableGridValue) ?? { headers: ["", ""], rows: [] };

      function addColumn(): void {
        field.onChange({ headers: [...value.headers, ""], rows: value.rows.map((row) => [...row, ""]) });
      }
      function removeColumn(index: number): void {
        field.onChange({ headers: value.headers.filter((_, i) => i !== index), rows: value.rows.map((row) => row.filter((_, i) => i !== index)) });
      }
      function setHeader(index: number, text: string): void {
        field.onChange({ ...value, headers: value.headers.map((header, i) => (i === index ? text : header)) });
      }
      function addRow(): void {
        field.onChange({ ...value, rows: [...value.rows, value.headers.map(() => "")] });
      }
      function removeRow(rowIndex: number): void {
        field.onChange({ ...value, rows: value.rows.filter((_, i) => i !== rowIndex) });
      }
      function setCell(rowIndex: number, cellIndex: number, text: string): void {
        field.onChange({
          ...value,
          rows: value.rows.map((row, r) => (r === rowIndex ? row.map((cell, c) => (c === cellIndex ? text : cell)) : row)),
        });
      }

      return (
        <div className="flex flex-col gap-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm" dir="rtl">
            <thead>
              <tr>
                {value.headers.map((header, index) => (
                  <th key={index} className="border border-slate-200 p-1">
                    <div className="flex items-center gap-1">
                      <CustomInput name={`${name}-header-${index}`} value={header} onChange={(event) => setHeader(index, event.target.value)} dir="rtl" />
                      <button type="button" aria-label="Remove column" onClick={() => removeColumn(index)}>
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </button>
                    </div>
                  </th>
                ))}
                <th>
                  <CustomButton type="button" size="icon" variant="ghost" aria-label="Add column" onClick={addColumn}>
                    <Plus className="h-4 w-4" />
                  </CustomButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {value.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-slate-200 p-1">
                      <CustomInput
                        name={`${name}-cell-${rowIndex}-${cellIndex}`}
                        value={cell}
                        onChange={(event) => setCell(rowIndex, cellIndex, event.target.value)}
                        dir="rtl"
                      />
                    </td>
                  ))}
                  <td>
                    <button type="button" aria-label="Remove row" onClick={() => removeRow(rowIndex)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <CustomButton type="button" variant="outline" leftIcon={Plus} onClick={addRow}>
            Add row
          </CustomButton>
        </div>
      );
    },
  };
}
