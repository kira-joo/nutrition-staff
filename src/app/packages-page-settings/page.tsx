"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { SlidersHorizontal } from "lucide-react";
import { getPackagesPageSettingsEndpoint, updatePackagesPageSettingsEndpoint } from "../../../api/packages-page-settings.endpoints";
import { PackagesPageSettingsForm } from "src/common/forms/packages-page-settings-form";
import { EntityName } from "src/common/authorization/entity-name.enum";

export default function PackagesPageSettingsPage() {
  const packagesPageSettingsQuery = useRequesterQuery({ endpoint: getPackagesPageSettingsEndpoint });

  return (
    <QueryState query={packagesPageSettingsQuery} entityName={EntityName.PACKAGES_PAGE_SETTINGS}>
      {(packagesPageSettings) => (
        <PageShell
          icon={SlidersHorizontal}
          title="Packages Page Settings"
          description="Header copy and duration labels for the public Packages page"
        >
          <PackagesPageSettingsForm defaultValues={packagesPageSettings} endpoint={updatePackagesPageSettingsEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
