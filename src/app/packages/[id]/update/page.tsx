"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Package as PackageIcon } from "lucide-react";
import { getPackageByIdEndpoint, updatePackageEndpoint } from "../../../../../api/package.endpoints";
import { PackageForm } from "src/common/forms/package-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function PackageUpdatePage({ params }: { params: { id: string } }) {
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
        <PageShell icon={PackageIcon} title="Update Package" description="Update package details">
          <PackageForm defaultValues={pkg} endpoint={updatePackageEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
