"use client";

import { Star } from "lucide-react";
import { useRef } from "react";

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
  const groupRef = useRef<HTMLDivElement>(null);
  const starRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ARIA radiogroup contract: exactly one tab stop (the checked star, or the
  // first star when nothing is selected yet); arrow keys move both selection
  // and focus across the rest.
  // A roving tabindex means exactly one star carries tabIndex=0, so any `value`
  // that does not land exactly on a star index would put the tab stop on no
  // star at all and make the whole group unreachable by keyboard — a silent
  // failure, and worse than the all-tabbable state this replaced.
  //
  // `Number.isInteger` is the part that is easy to get wrong: a range check
  // alone passes 2.5, which then yields activeIndex 1.5 and matches no star.
  // Review's schema and DTO both pin rating to an integer 1..5 today, so none
  // of this is reachable through the app; it is guarded because the failure
  // mode is invisible and this component is meant to serve any future
  // numeric-rating field.
  const starCount = Number.isInteger(max) && max > 0 ? max : 5;
  const inRange = value !== undefined && Number.isInteger(value) && value >= 1 && value <= starCount;
  const activeIndex = inRange ? value - 1 : 0;

  function selectAndFocus(index: number) {
    const wrapped = ((index % starCount) + starCount) % starCount;
    // The `value` prop is owned by the caller (react-hook-form's `field`), so
    // updating it via onChange doesn't move DOM focus by itself — that has to
    // happen explicitly here, on the same node the roving tabIndex points at.
    starRefs.current[wrapped]?.focus();
    onChange(wrapped + 1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // `direction` is read from the live rendered node rather than assumed,
    // so ArrowRight/ArrowLeft stay correct under both dir="ltr" and
    // dir="rtl" ancestors without guessing from locale.
    const isRtl = groupRef.current !== null && getComputedStyle(groupRef.current).direction === "rtl";

    // Movement starts from the star that actually has focus, not from the
    // controlled `value`. Those are normally the same, but the parent owns
    // `value` — if it defers or rejects an update, focus has already moved
    // while `value` has not, and deriving from `value` would then navigate
    // from the wrong star. Selection stays controlled; navigation tracks focus.
    const focusedIndex = starRefs.current.findIndex((star) => star === document.activeElement);
    const fromIndex = focusedIndex >= 0 ? focusedIndex : activeIndex;

    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        selectAndFocus(fromIndex + (isRtl ? -1 : 1));
        return;
      case "ArrowLeft":
        event.preventDefault();
        selectAndFocus(fromIndex + (isRtl ? 1 : -1));
        return;
      case "ArrowDown":
        event.preventDefault();
        selectAndFocus(fromIndex + 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        selectAndFocus(fromIndex - 1);
        return;
      case "Home":
        event.preventDefault();
        selectAndFocus(0);
        return;
      case "End":
        event.preventDefault();
        selectAndFocus(starCount - 1);
        return;
      case " ":
        event.preventDefault();
        onChange(fromIndex + 1);
        return;
      default:
        return;
    }
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Rating"
      className="flex items-center gap-1"
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: starCount }, (_, index) => {
        const starValue = index + 1;
        const filled = value !== undefined && starValue <= value;
        return (
          <button
            key={starValue}
            ref={(el) => {
              starRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} out of ${starCount}`}
            tabIndex={index === activeIndex ? 0 : -1}
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
