"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Globe } from "lucide-react";
import { getSiteSettingsEndpoint, updateSiteSettingsEndpoint } from "../../../api/site-settings.endpoints";
import { SiteSettingsForm } from "src/common/forms/site-settings-form";
import { EntityName } from "src/common/authorization/entity-name.enum";

export default function SiteSettingsPage() {
  const siteSettingsQuery = useRequesterQuery({ endpoint: getSiteSettingsEndpoint });

  return (
    <QueryState query={siteSettingsQuery} entityName={EntityName.SITE_SETTINGS}>
      {(siteSettings) => (
        <PageShell
          icon={Globe}
          title="Site Settings"
          description="Site-wide contact info, branding, and default SEO — always-live, no draft/publish workflow"
        >
          <SiteSettingsForm defaultValues={siteSettings} endpoint={updateSiteSettingsEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
