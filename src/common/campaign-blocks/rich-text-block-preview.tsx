import type { RichTextBlock } from "../interfaces/campaign-block.interface";

export interface RichTextBlockPreviewProps {
  block: RichTextBlock;
}

/** Read-only "what this will look like" rendering — used both inline in the block list and in the full-campaign preview. */
export function RichTextBlockPreview({ block }: RichTextBlockPreviewProps) {
  const heading = block.heading?.en || block.heading?.ar;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-6">
      {heading ? <h2 className="text-xl font-bold text-slate-900">{heading}</h2> : null}
      <p className="whitespace-pre-wrap text-sm text-slate-700">
        {block.body.en || block.body.ar || "(no body yet)"}
      </p>
    </div>
  );
}
