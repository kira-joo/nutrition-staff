"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { Megaphone } from "lucide-react";
import { createCampaignEndpoint } from "../../../../api/campaign.endpoints";
import { CampaignForm } from "src/common/forms/campaign-form";
import { AppRoute } from "src/common/routes/app-route";

export default function CampaignCreatePage() {
  return (
    <PageShell
      icon={Megaphone}
      title="Create Campaign"
      description="Set up a campaign's header — blocks are added next"
      backRoute={{ path: AppRoute.campaigns, label: "Back to Campaigns" }}
    >
      <CampaignForm endpoint={createCampaignEndpoint} />
    </PageShell>
  );
}
