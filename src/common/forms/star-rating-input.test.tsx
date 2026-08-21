import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StarRatingInput, type StarRatingInputProps } from "./star-rating-input";

/**
 * `StarRatingInput` is a controlled component (the caller, react-hook-form's
 * `field`, owns `value`). Tests with more than one keyboard interaction need
 * `value` to actually advance between them, the way the real form does, or
 * the second keypress computes from a stale `value` prop and the assertion
 * is meaningless — this wraps the spy so it still records calls while also
 * feeding them back into state.
 */
function StatefulHarness({ initialValue, onChange, ...rest }: StarRatingInputProps & { initialValue?: number }) {
  const [value, setValue] = useState(initialValue);
  return (
    <StarRatingInput
      {...rest}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

function getStar(n: number) {
  return screen.getByRole("radio", { name: `${n} out of 5` });
}

/**
 * jsdom does not implement the `direction` property as inherited CSS, and it
 * never maps the `dir` attribute to a computed style at all (verified against
 * jsdom directly: a `dir="rtl"` ancestor, or even a `dir="rtl"` attribute on
 * the element itself, both read back as `direction: ""`). Only a value set
 * directly on the node's own `style` is returned by `getComputedStyle` here.
 * The component reads `getComputedStyle(groupRef.current).direction`, so
 * setting it directly on the rendered radiogroup root reproduces exactly what
 * a real browser resolves from an ancestor's `dir="rtl"` — real-browser
 * inheritance is covered separately by manual/Playwright verification, not by
 * this unit test.
 */
function setDirection(direction: "ltr" | "rtl") {
  const group = screen.getByRole("radiogroup");
  group.style.direction = direction;
}

describe("StarRatingInput", () => {
  it("has exactly one tab stop, on the first star, when nothing is selected", () => {
    render(<StarRatingInput onChange={vi.fn()} />);
    const tabbable = [1, 2, 3, 4, 5].filter((n) => getStar(n).tabIndex === 0);
    expect(tabbable).toEqual([1]);
    [2, 3, 4, 5].forEach((n) => expect(getStar(n).tabIndex).toBe(-1));
  });

  it("has exactly one tab stop, on the checked star, when a value is selected", () => {
    render(<StarRatingInput value={3} onChange={vi.fn()} />);
    const tabbable = [1, 2, 3, 4, 5].filter((n) => getStar(n).tabIndex === 0);
    expect(tabbable).toEqual([3]);
  });

  it("ArrowRight in LTR moves selection and focus to the next star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} />);
    setDirection("ltr");
    getStar(2).focus();

    fireEvent.keyDown(getStar(2), { key: "ArrowRight" });

    expect(onChange).toHaveBeenCalledWith(3);
    expect(getStar(3)).toHaveFocus();
  });

  it("ArrowLeft in LTR moves selection and focus to the previous star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} />);
    setDirection("ltr");
    getStar(2).focus();

    fireEvent.keyDown(getStar(2), { key: "ArrowLeft" });

    expect(onChange).toHaveBeenCalledWith(1);
    expect(getStar(1)).toHaveFocus();
  });

  it("ArrowRight in RTL moves selection toward the visually-previous star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} />);
    setDirection("rtl");
    getStar(2).focus();

    fireEvent.keyDown(getStar(2), { key: "ArrowRight" });

    expect(onChange).toHaveBeenCalledWith(1);
    expect(getStar(1)).toHaveFocus();
  });

  it("ArrowLeft in RTL moves selection toward the visually-next star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} />);
    setDirection("rtl");
    getStar(2).focus();

    fireEvent.keyDown(getStar(2), { key: "ArrowLeft" });

    expect(onChange).toHaveBeenCalledWith(3);
    expect(getStar(3)).toHaveFocus();
  });

  it("ArrowDown/ArrowUp move forward/backward regardless of direction", () => {
    const onChange = vi.fn();
    render(<StatefulHarness initialValue={2} onChange={onChange} />);
    setDirection("rtl");
    getStar(2).focus();

    fireEvent.keyDown(getStar(2), { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith(3);

    fireEvent.keyDown(getStar(3), { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it("wraps from the last star to the first, and from the first to the last", () => {
    const onChangeFromLast = vi.fn();
    const { unmount } = render(<StarRatingInput value={5} onChange={onChangeFromLast} />);
    setDirection("ltr");
    getStar(5).focus();
    fireEvent.keyDown(getStar(5), { key: "ArrowRight" });
    expect(onChangeFromLast).toHaveBeenCalledWith(1);
    unmount();

    const onChangeFromFirst = vi.fn();
    render(<StarRatingInput value={1} onChange={onChangeFromFirst} />);
    setDirection("ltr");
    getStar(1).focus();
    fireEvent.keyDown(getStar(1), { key: "ArrowLeft" });
    expect(onChangeFromFirst).toHaveBeenCalledWith(5);
  });

  it("Home selects the first star and End selects the last star", () => {
    const onChange = vi.fn();
    render(<StatefulHarness initialValue={3} onChange={onChange} />);
    getStar(3).focus();

    fireEvent.keyDown(getStar(3), { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith(5);

    fireEvent.keyDown(getStar(5), { key: "Home" });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("Space selects the currently focused star", () => {
    const onChange = vi.fn();
    render(<StarRatingInput onChange={onChange} />);
    getStar(1).focus();

    fireEvent.keyDown(getStar(1), { key: " " });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  /**
   * A roving tabindex has exactly one tab stop, so an out-of-range `value`
   * would put it on no star at all and make the group unreachable by keyboard —
   * a silent failure, and worse than the all-tabbable state it replaced. The
   * review schema and DTO pin rating to 1..5, so this is defensive rather than
   * a reachable bug today.
   */
  it.each([0, -1, 99, 2.5, Number.NaN])("keeps a tab stop when value is not a valid star index (%s)", (value) => {
    render(<StarRatingInput value={value} onChange={vi.fn()} />);
    const tabbable = [1, 2, 3, 4, 5].filter((n) => getStar(n).tabIndex === 0);
    expect(tabbable).toEqual([1]);
  });

  /** A non-integer or non-positive `max` must not produce an incoherent group. */
  it.each([0, -3, 4.5])("falls back to a coherent group when max is invalid (%s)", (max) => {
    render(<StarRatingInput max={max} onChange={vi.fn()} />);
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    expect(stars.filter((star) => star.tabIndex === 0)).toHaveLength(1);
  });

  /**
   * Space must select exactly once. The native button would synthesise a click
   * from Space as well, so a handler that did not preventDefault would fire
   * both it and onClick.
   */
  it("selects exactly once on Space, not twice", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={2} onChange={onChange} />);
    const star = getStar(2);
    star.focus();
    fireEvent.keyDown(star, { key: " " });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  /**
   * Navigation follows FOCUS, not the controlled value. Simulated by holding
   * `value` fixed — the shape of a parent that defers or rejects the update —
   * and moving focus: the next arrow must step from the focused star, not from
   * the stale selected one.
   */
  it("moves from the focused star even when the controlled value has not caught up", () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={1} onChange={onChange} />);
    getStar(4).focus();
    fireEvent.keyDown(getStar(4), { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
