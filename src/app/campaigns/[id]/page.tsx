"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, CustomButton, PageSection, PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Blocks, Eye, EyeOff, Megaphone } from "lucide-react";
import { useState } from "react";
import { getCampaignByIdEndpoint, updateCampaignEndpoint } from "../../../../api/campaign.endpoints";
import { CampaignBlockManager } from "src/common/campaign-blocks/campaign-block-manager";
import { campaignBlockRegistry } from "src/common/campaign-blocks/campaign-block-registry";
import { CampaignForm } from "src/common/forms/campaign-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function CampaignBuilderPage({ params }: { params: { id: string } }) {
  const [previewing, setPreviewing] = useState(false);
  const campaignQuery = useRequesterQuery({
    endpoint: getCampaignByIdEndpoint,
    options: { params: { campaignId: params.id } },
  });

  return (
    <QueryState
      query={campaignQuery}
      entityName={EntityName.CAMPAIGN}
      backRoute={{ path: AppRoute.campaigns, label: "Back to Campaigns" }}
    >
      {(campaign) => (
        <PageShell
          icon={Megaphone}
          title={campaign.title?.en || campaign.title?.ar || "Campaign"}
          badge={
            <Badge variant={campaign.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {campaign.status}
            </Badge>
          }
          backRoute={{ path: AppRoute.campaigns, label: "Back to Campaigns" }}
          actions={
            <CustomButton
              type="button"
              variant="outline"
              leftIcon={previewing ? EyeOff : Eye}
              onClick={() => setPreviewing((value) => !value)}
            >
              {previewing ? "Exit preview" : "Preview campaign"}
            </CustomButton>
          }
        >
          <div className="flex flex-col gap-6">
            <PageSection title="Header">
              <CampaignForm defaultValues={campaign} endpoint={updateCampaignEndpoint} />
            </PageSection>

            <PageSection icon={Blocks} title="Blocks">
              {previewing ? (
                <div className="flex flex-col gap-4">
                  {campaign.blocks.length === 0 ? (
                    <p className="text-sm text-slate-500">No blocks yet.</p>
                  ) : (
                    campaign.blocks.map((block) => {
                      const { Preview } = campaignBlockRegistry[block.type];
                      return <Preview key={block.id} block={block} />;
                    })
                  )}
                </div>
              ) : (
                <CampaignBlockManager
                  campaignId={campaign._id}
                  blocks={campaign.blocks}
                  onChanged={() => campaignQuery.refetch()}
                />
              )}
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
