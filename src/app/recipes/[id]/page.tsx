"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, BookOpen, ChefHat, Image as ImageIcon, ListChecks, Pencil } from "lucide-react";
import { getRecipeByIdEndpoint } from "../../../../api/recipe.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeDetailsPage({ params }: { params: { id: string } }) {
  const recipeQuery = useRequesterQuery({
    endpoint: getRecipeByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={recipeQuery}
      entityName={EntityName.RECIPE}
      backRoute={{ path: AppRoute.recipes, label: "Back to Recipes" }}
    >
      {(recipe) => (
        <PageShell
          icon={ChefHat}
          title={recipe.title?.en || recipe.title?.ar || "Recipe"}
          badge={
            <Badge variant={recipe.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {recipe.status}
            </Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.recipeUpdate}
              params={{ id: recipe._id }}
              permission={AppPermission.RECIPE.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={ImageIcon} title="Content">
              <div className="flex flex-col gap-3">
                <InfoRow label="Title (EN)" value={recipe.title?.en || "—"} />
                <InfoRow label="Title (AR)" value={recipe.title?.ar || "—"} />
                <InfoRow label="Description (EN)" value={recipe.description?.en || "—"} />
                <InfoRow
                  label="Category"
                  value={typeof recipe.category === "string" ? "—" : recipe.category?.title?.en || "—"}
                />
                <InfoRow
                  label="Food groups"
                  value={
                    recipe.foodGroups
                      ?.map((item) => (typeof item === "string" ? item : item.title?.en))
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                {recipe.image ? (
                  <img src={recipe.image.secureUrl} alt="" className="h-32 w-32 rounded-md object-cover" />
                ) : null}
              </div>
            </PageSection>
            <PageSection icon={Activity} title="Status & activity">
              <div className="flex flex-col gap-3">
                <InfoRow label="Prep time" value={recipe.prepTime?.en || "—"} />
                <InfoRow label="Cook time" value={recipe.cookTime?.en || "—"} />
                <InfoRow label="Servings" value={recipe.servings?.en || "—"} />
                <InfoRow label="Created" value={<DateText value={recipe.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={recipe.updatedAt} />} />
              </div>
            </PageSection>
            <PageSection icon={ListChecks} title="Ingredients" className="sm:col-span-2">
              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-slate-500">No ingredients listed.</p>
              ) : (
                <ul className="list-inside list-disc text-sm">
                  {recipe.ingredients.map((item, index) => (
                    <li key={index}>{item.en || item.ar}</li>
                  ))}
                </ul>
              )}
            </PageSection>
            <PageSection icon={BookOpen} title="Instructions" className="sm:col-span-2">
              {recipe.instructions.length === 0 ? (
                <p className="text-sm text-slate-500">No instructions listed.</p>
              ) : (
                <ol className="list-inside list-decimal text-sm">
                  {recipe.instructions.map((item, index) => (
                    <li key={index}>{item.en || item.ar}</li>
                  ))}
                </ol>
              )}
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
