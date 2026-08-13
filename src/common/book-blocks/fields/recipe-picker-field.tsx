"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomSelect, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { FieldValues, Path } from "react-hook-form";
import { getRecipesEndpoint } from "../../../../api/recipe.endpoints";
import { ContentStatus } from "src/common/enums";
import type { Recipe } from "src/common/interfaces/recipe.interface";

/** Options are published recipes only — an unpublished/deleted recipe would fail `assertBookBlockReferencesValid` server-side anyway, so this keeps the picker honest rather than letting the doctor pick something that will 400 on save. */
export function recipePickerField<T extends FieldValues>(name: Path<T>, label: string): FormFieldConfig<T> {
  return {
    type: FieldType.CUSTOM,
    name,
    label,
    render: ({ field, error }) => <RecipePickerControl value={field.value as string} onChange={field.onChange} error={error} />,
  };
}

function RecipePickerControl({ value, onChange, error }: { value: string; onChange: (id: string) => void; error?: string }) {
  const recipesQuery = useRequesterQuery({
    endpoint: getRecipesEndpoint,
    options: { query: { status: ContentStatus.PUBLISHED, page: 1, limit: 200 } },
  });
  const recipes = recipesQuery.data?.data ?? [];

  return (
    <CustomSelect
      name="recipeId"
      value={value ?? ""}
      onChange={(nextValue) => onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue)}
      error={error}
      placeholder={recipesQuery.isLoading ? "Loading recipes…" : "Select a recipe"}
      options={recipes.map((recipe: Recipe) => ({ label: recipe.title?.ar ?? recipe.title?.en ?? recipe._id, value: recipe._id }))}
    />
  );
}
