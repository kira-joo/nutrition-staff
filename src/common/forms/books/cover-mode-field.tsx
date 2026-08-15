"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { BookCoverMode } from "../../interfaces/book.interface";

export interface CoverModeToggleProps {
  sectionLabel: string;
  modeValue: BookCoverMode;
  onModeChange: (mode: BookCoverMode) => void;
  hasImage: boolean;
  generatedDescription: string;
  uploadedDescription: string;
}

/**
 * App-local (not a new toolkit primitive) two-card mode switch. The
 * actual `coverImage`/`backCoverImage` `FormImageAssetUpload` field stays
 * a normal, separately-declared `FieldType.IMAGE_ASSET` config in
 * `book-form.tsx` — toggled only via that field's own `hidden` flag
 * (`client-profile-form.tsx`'s established watched-value pattern), NOT
 * rendered a second time in here. `hidden` keeps a field mounted (CSS
 * only), so its RHF-tracked value is untouched by switching modes; the
 * only thing that can clear it is that field's own "Remove" action.
 * Nesting a second upload widget in here instead would have silently
 * broken submission: `CustomForm`'s whitelist/asset-detection
 * (`getFieldNames`/`getAssetFieldNames`) key off the DECLARED `fields`
 * config, not off what's actually rendered, so an image field that only
 * ever existed inside a CUSTOM field's own render tree would never be
 * whitelisted into the submit payload or recognized as multipart-worthy.
 */
export function CoverModeField({ sectionLabel, modeValue, onModeChange, hasImage, generatedDescription, uploadedDescription }: CoverModeToggleProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <span className="text-sm font-semibold">{sectionLabel}</span>

      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={sectionLabel}>
        <ModeCard selected={modeValue === "generated"} title="Generated" description={generatedDescription} onClick={() => onModeChange("generated")} />
        <ModeCard selected={modeValue === "uploaded"} title="Uploaded" description={uploadedDescription} onClick={() => onModeChange("uploaded")} />
      </div>

      {modeValue === "uploaded" && !hasImage ? (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
          No image uploaded yet — this cover will render blank (no generated content underneath it) until you upload one below.
        </p>
      ) : null}

      {modeValue === "generated" ? (
        <p className="text-xs text-slate-500">
          Any previously uploaded image stays stored and is not deleted — switching back to &quot;Uploaded&quot; restores it without a
          re-upload.
        </p>
      ) : null}
    </div>
  );
}

function ModeCard({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors ${
        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        {selected ? <CheckCircle2 className="h-4 w-4 text-slate-900" /> : <Circle className="h-4 w-4 text-slate-300" />}
        {title}
      </span>
      <span className="text-xs text-slate-500">{description}</span>
    </button>
  );
}
