"use client";

import { downloadRequester, useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  RouteButton,
  showApiErrorToast,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { ChefHat, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteRecipeEndpoint, exportRecipesPdfEndpoint, getRecipesEndpoint } from "../../../api/recipe.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { Recipe } from "src/common/interfaces/recipe.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[/\\:*?"<>|]/g, "").trim();
}

function buildExportFileName(selectedItems: Recipe[], selectedCount: number): string {
  if (selectedItems.length === 1 && selectedItems.length === selectedCount) {
    const title = selectedItems[0].title?.en || selectedItems[0].title?.ar || "recipe";
    return `${sanitizeFileNamePart(title)}.pdf`;
  }
  return `recipes-export-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export default function RecipesPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteRecipeEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Recipe>[] = [
    {
      key: "title",
      header: "Title",
      render: (recipe) => (
        <AppLink path={AppRoute.recipeDetails} params={{ id: recipe._id }}>
          {recipe.title?.en || recipe.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (recipe) =>
        typeof recipe.category === "string" ? "—" : recipe.category?.title?.en || recipe.category?.title?.ar || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (recipe) => (
        <Badge variant={recipe.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{recipe.status}</Badge>
      ),
    },
  ];

  return (
    <PageShell
      icon={ChefHat}
      title="Recipes"
      description="Recipes shown on the public site, organized by category and food group"
      actions={
        <RouteButton path={AppRoute.recipeCreate} permission={AppPermission.RECIPE.CREATE} leftIcon={Plus}>
          Add Recipe
        </RouteButton>
      }
    >
      <FeatureTable<Recipe, typeof getRecipesEndpoint>
        ref={tableRef}
        endpoint={getRecipesEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.RECIPE]}
        filters={[
          {
            key: "status",
            header: "Status",
            options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (recipe) => navigate(AppRoute.recipeUpdate, { id: recipe._id }),
            hidden: !can(AppPermission.RECIPE.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (recipe) => deleteMutation.mutate({ params: { id: recipe._id } }),
            hidden: !can(AppPermission.RECIPE.DELETE),
          },
        ]}
        selectable
        bulkActions={[
          {
            label: "Download PDF",
            icon: Download,
            onClick: async ({ selectedIds, selectedItems, clearSelection }) => {
              try {
                await downloadRequester({
                  endpoint: exportRecipesPdfEndpoint,
                  options: { body: { ids: selectedIds } },
                  fileName: buildExportFileName(selectedItems, selectedIds.length),
                });
                clearSelection();
              } catch (error) {
                showApiErrorToast(error);
              }
            },
          },
        ]}
      />
    </PageShell>
  );
}
