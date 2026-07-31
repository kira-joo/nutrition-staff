"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { getFaqSectionByIdEndpoint } from "../../../api/faq-section.endpoints";
import type { FaqRefBlock } from "../interfaces/campaign-block.interface";

export interface FaqRefBlockPreviewProps {
  block: FaqRefBlock;
}

/**
 * Read-only "what this will look like" rendering. Unlike every other block
 * preview, this one fetches — the block itself only stores `faqSectionId`,
 * so showing the section's real title requires its own request. Preview
 * components are ordinary React components, so a self-contained query here
 * doesn't change `CampaignBlockRegistryEntry`'s shape at all.
 */
export function FaqRefBlockPreview({ block }: FaqRefBlockPreviewProps) {
  const heading = block.heading?.en || block.heading?.ar;
  const sectionQuery = useRequesterQuery({
    endpoint: getFaqSectionByIdEndpoint,
    options: { params: { id: block.faqSectionId } },
  });

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-6">
      {heading ? <h2 className="text-xl font-bold text-slate-900">{heading}</h2> : null}
      {sectionQuery.loading ? (
        <p className="text-sm text-slate-500">Loading FAQ section…</p>
      ) : sectionQuery.isError || !sectionQuery.data ? (
        <p className="text-sm text-red-600">This block's referenced FAQ section is no longer available.</p>
      ) : (
        <p className="text-sm text-slate-700">
          Shows FAQs from: <span className="font-medium">{sectionQuery.data.title.en || sectionQuery.data.title.ar}</span>
        </p>
      )}
    </div>
  );
}
