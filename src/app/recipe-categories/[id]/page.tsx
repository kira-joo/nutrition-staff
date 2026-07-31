"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, ListTree, Pencil } from "lucide-react";
import { getRecipeCategoryByIdEndpoint } from "../../../../api/recipe-category.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeCategoryDetailsPage({ params }: { params: { id: string } }) {
  const categoryQuery = useRequesterQuery({
    endpoint: getRecipeCategoryByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={categoryQuery}
      entityName={EntityName.RECIPE_CATEGORY}
      backRoute={{ path: AppRoute.recipeCategories, label: "Back to Recipe Categories" }}
    >
      {(category) => (
        <PageShell
          icon={ListTree}
          title={category.title?.en || category.title?.ar || "Recipe Category"}
          badge={
            <Badge variant={category.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {category.status}
            </Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.recipeCategoryUpdate}
              params={{ id: category._id }}
              permission={AppPermission.RECIPE_CATEGORY.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <PageSection icon={Activity} title="Details">
            <div className="flex flex-col gap-3">
              <InfoRow label="English" value={category.title?.en || "—"} />
              <InfoRow label="Arabic" value={category.title?.ar || "—"} />
              <InfoRow label="Created" value={<DateText value={category.createdAt} />} />
              <InfoRow label="Updated" value={<DateText value={category.updatedAt} />} />
            </div>
          </PageSection>
        </PageShell>
      )}
    </QueryState>
  );
}
