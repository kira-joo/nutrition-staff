import { AssetLightbox } from "@kira-joo/frontend-toolkit-tailwind";
import { Maximize2 } from "lucide-react";
import { useState } from "react";
import type { HeroBlock } from "../interfaces/campaign-block.interface";

export interface HeroBlockPreviewProps {
  block: HeroBlock;
}

/**
 * Read-only "what this will look like" rendering — used both inline in the
 * block list and in the full-campaign preview. The background image gets a
 * small corner "view full size" button rather than being wrapped in
 * `AssetThumbnail` — that component's fixed small-frame chrome would break
 * the full-bleed WYSIWYG preview this component exists to provide. It opens
 * the same shared `AssetLightbox`, so there's no duplicate viewer.
 */
export function HeroBlockPreview({ block }: HeroBlockPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heading = block.heading.en || block.heading.ar || "Hero image";

  return (
    <div className="relative flex min-h-[200px] flex-col items-center justify-center gap-3 overflow-hidden rounded-md bg-slate-900 p-8 text-center text-white">
      {block.image ? (
        <img src={block.image.secureUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      ) : null}
      {block.image ? (
        <button
          type="button"
          aria-label="View full-size image"
          onClick={() => setLightboxOpen(true)}
          className="absolute right-3 top-3 z-10 cursor-pointer rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      ) : null}
      {block.image && lightboxOpen ? (
        <AssetLightbox
          images={[{ src: block.image.secureUrl, alt: heading, width: block.image.width, height: block.image.height }]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
      <div className="relative flex flex-col items-center gap-3">
        <h2 className="text-2xl font-bold">{block.heading.en || block.heading.ar || "(no heading yet)"}</h2>
        {block.subheading?.en || block.subheading?.ar ? (
          <p className="text-slate-200">{block.subheading.en || block.subheading.ar}</p>
        ) : null}
        {block.ctaLabel?.en || block.ctaLabel?.ar ? (
          <span className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900">
            {block.ctaLabel.en || block.ctaLabel.ar}
          </span>
        ) : null}
      </div>
    </div>
  );
}
