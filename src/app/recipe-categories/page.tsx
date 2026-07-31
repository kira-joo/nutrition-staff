"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteRecipeCategoryEndpoint, getRecipeCategoriesEndpoint } from "../../../api/recipe-category.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { RecipeCategory } from "src/common/interfaces/recipe-category.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function RecipeCategoriesPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteRecipeCategoryEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<RecipeCategory>[] = [
    {
      key: "title",
      header: "Title",
      render: (category) => (
        <AppLink path={AppRoute.recipeCategoryDetails} params={{ id: category._id }}>
          {category.title?.en || category.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (category) => (
        <Badge variant={category.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{category.status}</Badge>
      ),
    },
  ];

  return (
    <PageShell
      icon={ListTree}
      title="Recipe Categories"
      description="Categories recipes can be filtered by on the public site"
      actions={
        <RouteButton path={AppRoute.recipeCategoryCreate} permission={AppPermission.RECIPE_CATEGORY.CREATE} leftIcon={Plus}>
          Add Category
        </RouteButton>
      }
    >
      <FeatureTable<RecipeCategory, typeof getRecipeCategoriesEndpoint>
        ref={tableRef}
        endpoint={getRecipeCategoriesEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.RECIPE_CATEGORY]}
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
            onClick: (category) => navigate(AppRoute.recipeCategoryUpdate, { id: category._id }),
            hidden: !can(AppPermission.RECIPE_CATEGORY.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (category) => deleteMutation.mutate({ params: { id: category._id } }),
            hidden: !can(AppPermission.RECIPE_CATEGORY.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
