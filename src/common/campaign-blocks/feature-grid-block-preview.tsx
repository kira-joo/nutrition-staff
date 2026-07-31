import type { FeatureGridBlock } from "../interfaces/campaign-block.interface";

export interface FeatureGridBlockPreviewProps {
  block: FeatureGridBlock;
}

/** Read-only "what this will look like" rendering — used both inline in the block list and in the full-campaign preview. */
export function FeatureGridBlockPreview({ block }: FeatureGridBlockPreviewProps) {
  const heading = block.heading?.en || block.heading?.ar;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-slate-200 p-6">
      {heading ? <h2 className="text-xl font-bold text-slate-900">{heading}</h2> : null}
      {block.items.length === 0 ? (
        <p className="text-sm text-slate-500">No features yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => (
            <div key={item.id} className="rounded-md bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{item.heading.en || item.heading.ar || "(untitled)"}</h3>
              {item.description?.en || item.description?.ar ? (
                <p className="mt-1 text-sm text-slate-600">{item.description.en || item.description.ar}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
