"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, DollarSign, Package as PackageIcon, Pencil } from "lucide-react";
import { getPackageByIdEndpoint } from "../../../../api/package.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function PackageDetailsPage({ params }: { params: { id: string } }) {
  const packageQuery = useRequesterQuery({
    endpoint: getPackageByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={packageQuery}
      entityName={EntityName.PACKAGE}
      backRoute={{ path: AppRoute.packages, label: "Back to Packages" }}
    >
      {(pkg) => (
        <PageShell
          icon={PackageIcon}
          title={pkg.name?.en || pkg.name?.ar || "Package"}
          badge={<Badge variant={pkg.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{pkg.status}</Badge>}
          actions={
            <RouteButton
              path={AppRoute.packageUpdate}
              params={{ id: pkg._id }}
              permission={AppPermission.PACKAGE.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={PackageIcon} title="Details">
              <div className="flex flex-col gap-3">
                <InfoRow label="Key" value={pkg.key} />
                <InfoRow label="Name (EN)" value={pkg.name?.en || "—"} />
                <InfoRow label="Tag" value={pkg.tag?.en || "—"} />
                <InfoRow label="Popular" value={pkg.popular ? "Yes" : "No"} />
                <InfoRow label="Variant" value={pkg.variant} />
                <InfoRow label="Icon" value={pkg.icon} />
                <InfoRow label="Order" value={pkg.order} />
              </div>
            </PageSection>
            <PageSection icon={DollarSign} title="Pricing">
              <div className="flex flex-col gap-3">
                <InfoRow label="1 Month" value={`${pkg.pricingTiers.month.price} (was ${pkg.pricingTiers.month.originalPrice})`} />
                <InfoRow label="2 Months" value={`${pkg.pricingTiers.quarter.price} (was ${pkg.pricingTiers.quarter.originalPrice})`} />
                <InfoRow label="3 Months" value={`${pkg.pricingTiers.half.price} (was ${pkg.pricingTiers.half.originalPrice})`} />
                <InfoRow label="Created" value={<DateText value={pkg.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={pkg.updatedAt} />} />
              </div>
            </PageSection>
            <PageSection icon={Activity} title="Details list" className="sm:col-span-2">
              {pkg.details.length === 0 ? (
                <p className="text-sm text-slate-500">No details listed.</p>
              ) : (
                <ul className="list-inside list-disc text-sm">
                  {pkg.details.map((item, index) => (
                    <li key={index}>{item.en || item.ar}</li>
                  ))}
                </ul>
              )}
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
