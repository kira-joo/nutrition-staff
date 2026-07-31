import type { CtaBlock } from "../interfaces/campaign-block.interface";

export interface CtaBlockPreviewProps {
  block: CtaBlock;
}

/** Read-only "what this will look like" rendering — used both inline in the block list and in the full-campaign preview. */
export function CtaBlockPreview({ block }: CtaBlockPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-slate-200 bg-slate-900 p-8 text-center text-white">
      <h2 className="text-2xl font-bold">{block.heading.en || block.heading.ar || "(no heading yet)"}</h2>
      {block.description?.en || block.description?.ar ? (
        <p className="text-slate-200">{block.description.en || block.description.ar}</p>
      ) : null}
      <span className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900">
        {block.buttonLabel.en || block.buttonLabel.ar || "(no label yet)"}
      </span>
      <span className="text-xs text-slate-400">{block.buttonUrl || "(no target url yet)"}</span>
    </div>
  );
}
