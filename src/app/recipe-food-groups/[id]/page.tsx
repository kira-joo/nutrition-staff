"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Pencil, Salad } from "lucide-react";
import { getRecipeFoodGroupByIdEndpoint } from "../../../../api/recipe-food-group.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeFoodGroupDetailsPage({ params }: { params: { id: string } }) {
  const foodGroupQuery = useRequesterQuery({
    endpoint: getRecipeFoodGroupByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={foodGroupQuery}
      entityName={EntityName.RECIPE_FOOD_GROUP}
      backRoute={{ path: AppRoute.recipeFoodGroups, label: "Back to Recipe Food Groups" }}
    >
      {(foodGroup) => (
        <PageShell
          icon={Salad}
          title={foodGroup.title?.en || foodGroup.title?.ar || "Recipe Food Group"}
          badge={
            <Badge variant={foodGroup.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {foodGroup.status}
            </Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.recipeFoodGroupUpdate}
              params={{ id: foodGroup._id }}
              permission={AppPermission.RECIPE_FOOD_GROUP.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <PageSection icon={Activity} title="Details">
            <div className="flex flex-col gap-3">
              <InfoRow label="English" value={foodGroup.title?.en || "—"} />
              <InfoRow label="Arabic" value={foodGroup.title?.ar || "—"} />
              <InfoRow label="Created" value={<DateText value={foodGroup.createdAt} />} />
              <InfoRow label="Updated" value={<DateText value={foodGroup.updatedAt} />} />
            </div>
          </PageSection>
        </PageShell>
      )}
    </QueryState>
  );
}
