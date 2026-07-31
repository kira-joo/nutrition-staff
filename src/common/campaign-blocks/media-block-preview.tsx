import { AssetLightbox } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import type { MediaBlock } from "../interfaces/campaign-block.interface";

export interface MediaBlockPreviewProps {
  block: MediaBlock;
}

/**
 * Read-only "what this will look like" rendering. `<video controls>` keeps
 * its native player (already inspectable). The image case is wrapped in a
 * plain clickable button (cursor-pointer + focus ring) that opens the same
 * shared `AssetLightbox` — not `AssetThumbnail`, whose fixed small-frame
 * chrome would break this preview's natural `w-full h-auto` sizing.
 */
export function MediaBlockPreview({ block }: MediaBlockPreviewProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const caption = block.caption?.en || block.caption?.ar;

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-4">
      {block.video ? (
        <video controls poster={block.image?.secureUrl} className="h-auto w-full rounded-md">
          <source src={block.video.secureUrl} />
        </video>
      ) : block.image ? (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
        >
          <img src={block.image.secureUrl} alt={caption || "Media block image"} className="h-auto w-full rounded-md object-contain" />
        </button>
      ) : (
        <p className="text-sm text-slate-500">No media yet.</p>
      )}
      {caption ? <p className="text-center text-sm text-slate-600">{caption}</p> : null}
      {block.image && !block.video && lightboxOpen ? (
        <AssetLightbox
          images={[{ src: block.image.secureUrl, alt: caption || "Media block image", width: block.image.width, height: block.image.height }]}
          index={0}
          onIndexChange={() => {}}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}
