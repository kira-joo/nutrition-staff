import type { CountdownBlock } from "../interfaces/campaign-block.interface";

export interface CountdownBlockPreviewProps {
  block: CountdownBlock;
}

/**
 * Read-only "what this will look like" rendering — a static formatted
 * target date, not a live-ticking timer (that's a nutrition-client
 * rendering concern, not something the admin preview needs to simulate).
 */
export function CountdownBlockPreview({ block }: CountdownBlockPreviewProps) {
  const isExpired = !Number.isNaN(new Date(block.targetDate).getTime()) && new Date(block.targetDate) <= new Date();
  const expiredLabel = block.expiredLabel?.en || block.expiredLabel?.ar;

  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-slate-200 p-8 text-center">
      <h2 className="text-xl font-bold text-slate-900">{block.heading.en || block.heading.ar || "(no heading yet)"}</h2>
      {isExpired && expiredLabel ? (
        <p className="text-sm text-slate-600">{expiredLabel}</p>
      ) : (
        <p className="text-sm text-slate-600">
          Ends: {Number.isNaN(new Date(block.targetDate).getTime()) ? "(no date set)" : new Date(block.targetDate).toLocaleString()}
        </p>
      )}
    </div>
  );
}
