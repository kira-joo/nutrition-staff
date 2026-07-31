import type { MediaBlock } from "../interfaces/campaign-block.interface";

export interface MediaBlockPreviewProps {
  block: MediaBlock;
}

/**
 * Read-only "what this will look like" rendering. `<video controls>` /
 * `<img>` with `w-full h-auto` (natural aspect ratio, never cropped) —
 * same viewer/aspect-ratio conventions already used by the Video module's
 * own detail page.
 */
export function MediaBlockPreview({ block }: MediaBlockPreviewProps) {
  const caption = block.caption?.en || block.caption?.ar;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-4">
      {block.video ? (
        <video controls poster={block.image?.secureUrl} className="h-auto w-full rounded-md">
          <source src={block.video.secureUrl} />
        </video>
      ) : block.image ? (
        <img src={block.image.secureUrl} alt="" className="h-auto w-full rounded-md object-contain" />
      ) : (
        <p className="text-sm text-slate-500">No media yet.</p>
      )}
      {caption ? <p className="text-center text-sm text-slate-600">{caption}</p> : null}
    </div>
  );
}
