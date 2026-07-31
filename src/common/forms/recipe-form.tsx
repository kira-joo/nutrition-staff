"use client";

import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen, ChefHat, Image as ImageIcon, ListChecks, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRecipeCategoriesEndpoint } from "../../../api/recipe-category.endpoints";
import { getRecipeFoodGroupsEndpoint } from "../../../api/recipe-food-group.endpoints";
import type { createRecipeEndpoint, updateRecipeEndpoint } from "../../../api/recipe.endpoints";
import { ContentStatus } from "../enums";
import { Recipe, RecipeFormValues } from "../interfaces/recipe.interface";
import { RecipeCategory } from "../interfaces/recipe-category.interface";
import { RecipeFoodGroup } from "../interfaces/recipe-food-group.interface";
import { AppRoute } from "../routes/app-route";
import { recipeImagePolicy } from "../upload-policies";
import { ArrayFieldEditor } from "./array-field-editor";
import { LocalizedTextPair } from "./localized-text-pair";

export interface RecipeFormProps {
  defaultValues?: Recipe;
  endpoint: typeof createRecipeEndpoint | typeof updateRecipeEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toId(value: { _id: string } | string | undefined): string | undefined {
  return typeof value === "string" ? value : value?._id;
}

export function RecipeForm({ defaultValues, endpoint }: RecipeFormProps) {
  const router = useRouter();

  const contentFields: FormFieldConfig<RecipeFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "description", label: "Description", rows: 3 },
    { type: FieldType.IMAGE_ASSET, name: "image", label: "Image", policy: recipeImagePolicy },
  ];

  const taxonomyFields: FormFieldConfig<RecipeFormValues>[] = [
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "category",
      label: "Category",
      endpoint: getRecipeCategoriesEndpoint,
      optionLabel: (item: Record<string, unknown>) => {
        const category = item as unknown as RecipeCategory;
        return category.title.en || category.title.ar || "(untitled)";
      },
      optionValue: "_id",
      placeholder: "Select a category",
      rules: { required: true },
    },
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "foodGroups",
      label: "Food groups",
      endpoint: getRecipeFoodGroupsEndpoint,
      optionLabel: (item: Record<string, unknown>) => {
        const foodGroup = item as unknown as RecipeFoodGroup;
        return foodGroup.title.en || foodGroup.title.ar || "(untitled)";
      },
      optionValue: "_id",
      multiple: true,
      placeholder: "Select food groups",
    },
  ];

  const detailFields: FormFieldConfig<RecipeFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "prepTime", label: "Prep time" },
    { type: FieldType.LOCALIZED_INPUT, name: "cookTime", label: "Cook time" },
    { type: FieldType.LOCALIZED_INPUT, name: "servings", label: "Servings" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  const ingredientsFields: FormFieldConfig<RecipeFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "ingredients",
      label: "Ingredients",
      render: ({ field }) => (
        <ArrayFieldEditor<LocalizedString>
          items={(field.value as LocalizedString[]) ?? []}
          onChange={field.onChange}
          createItem={() => ({ ...EMPTY_LOCALIZED })}
          addLabel="Add ingredient"
          emptyLabel="No ingredients yet."
          renderItem={(item, index, update) => (
            <LocalizedTextPair label="Ingredient" value={item} onChange={update} />
          )}
        />
      ),
    },
  ];

  const instructionsFields: FormFieldConfig<RecipeFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "instructions",
      label: "Instructions",
      render: ({ field }) => (
        <ArrayFieldEditor<LocalizedString>
          items={(field.value as LocalizedString[]) ?? []}
          onChange={field.onChange}
          createItem={() => ({ ...EMPTY_LOCALIZED })}
          addLabel="Add step"
          emptyLabel="No instructions yet."
          renderItem={(item, index, update) => (
            <LocalizedTextPair label="Step" multiline value={item} onChange={update} />
          )}
        />
      ),
    },
  ];

  return (
    <CustomForm<RecipeFormValues, typeof endpoint>
      sections={[
        { title: "Content", icon: ImageIcon, fields: contentFields },
        { title: "Taxonomy", icon: ChefHat, fields: taxonomyFields },
        { title: "Ingredients", icon: ListChecks, fields: ingredientsFields },
        { title: "Instructions", icon: BookOpen, fields: instructionsFields },
        { title: "Details", icon: Settings2, fields: detailFields },
      ]}
      defaultValues={{
        title: defaultValues?.title ?? EMPTY_LOCALIZED,
        description: defaultValues?.description ?? EMPTY_LOCALIZED,
        image: defaultValues?.image ?? null,
        category: toId(defaultValues?.category) ?? "",
        foodGroups: defaultValues?.foodGroups?.map((item) => toId(item)!).filter(Boolean) ?? [],
        ingredients: defaultValues?.ingredients ?? [],
        instructions: defaultValues?.instructions ?? [],
        prepTime: defaultValues?.prepTime ?? EMPTY_LOCALIZED,
        cookTime: defaultValues?.cookTime ?? EMPTY_LOCALIZED,
        servings: defaultValues?.servings ?? EMPTY_LOCALIZED,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Recipe saved successfully");
        router.push(AppRoute.recipes);
      }}
      layout="grid"
      columns={2}
    />
  );
}
