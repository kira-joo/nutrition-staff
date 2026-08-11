"use client";

import { Star } from "lucide-react";

export interface StarRatingInputProps {
  value?: number;
  onChange: (value: number) => void;
  max?: number;
}

/**
 * A 1-`max` star picker for a `FieldType.CUSTOM` field bound to a plain
 * numeric value (e.g. `Review.rating`) — no existing rating/star primitive
 * exists yet in this app or in `@kira-joo/frontend-toolkit-tailwind`, so
 * this is the one reusable version for any future numeric-rating field
 * rather than a one-off inline in `review-form.tsx`.
 */
export function StarRatingInput({ value, onChange, max = 5 }: StarRatingInputProps) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = value !== undefined && starValue <= value;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} out of ${max}`}
            onClick={() => onChange(starValue)}
            className="rounded-sm p-0.5 text-slate-300 transition-colors hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            <Star className={filled ? "h-6 w-6 fill-amber-500 text-amber-500" : "h-6 w-6"} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
