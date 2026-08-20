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
import { Pencil, Plus, Salad, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteRecipeFoodGroupEndpoint, getRecipeFoodGroupsEndpoint } from "../../../api/recipe-food-group.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { RecipeFoodGroup } from "src/common/interfaces/recipe-food-group.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function RecipeFoodGroupsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteRecipeFoodGroupEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<RecipeFoodGroup>[] = [
    {
      key: "title",
      header: "Title",
      render: (foodGroup) => (
        <AppLink path={AppRoute.recipeFoodGroupDetails} params={{ id: foodGroup._id }}>
          {foodGroup.title?.en || foodGroup.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (foodGroup) => (
        <Badge variant={foodGroup.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
          {foodGroup.status}
        </Badge>
      ),
    },
  ];

  return (
    <PageShell
      icon={Salad}
      title="Recipe Food Groups"
      description="Food groups recipes can be filtered by on the public site"
      actions={
        <RouteButton
          path={AppRoute.recipeFoodGroupCreate}
          permission={AppPermission.RECIPE_FOOD_GROUP.CREATE}
          leftIcon={Plus}
        >
          Add Food Group
        </RouteButton>
      }
    >
      <FeatureTable<RecipeFoodGroup, typeof getRecipeFoodGroupsEndpoint>
        ref={tableRef}
        endpoint={getRecipeFoodGroupsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.RECIPE_FOOD_GROUP]}
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
            onClick: (foodGroup) => navigate(AppRoute.recipeFoodGroupUpdate, { id: foodGroup._id }),
            hidden: !can(AppPermission.RECIPE_FOOD_GROUP.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            // Names the food group rather than saying "this item": the row that was
            // clicked and the row someone meant to click are not always the same.
            confirm: (foodGroup) => ({
              title: `Delete ${foodGroup.title?.en || foodGroup.title?.ar || "this food group"}?`,
              description: "This permanently deletes the food group and cannot be undone.",
              confirmLabel: "Delete",
            }),
            // `mutateAsync`, so the table can await the real request and show an
            // executing state instead of clearing the moment the click lands.
            onClick: (foodGroup) => deleteMutation.mutateAsync({ params: { id: foodGroup._id } }),
            hidden: !can(AppPermission.RECIPE_FOOD_GROUP.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
