import type { HeroBlock } from "../interfaces/campaign-block.interface";

export interface HeroBlockPreviewProps {
  block: HeroBlock;
}

/** Read-only "what this will look like" rendering — used both inline in the block list and in the full-campaign preview. */
export function HeroBlockPreview({ block }: HeroBlockPreviewProps) {
  return (
    <div className="relative flex min-h-[200px] flex-col items-center justify-center gap-3 overflow-hidden rounded-md bg-slate-900 p-8 text-center text-white">
      {block.image ? (
        <img src={block.image.secureUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
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
