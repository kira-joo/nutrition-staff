import { Transform } from "class-transformer";

/**
 * Coerces string/number input (e.g. a native number input's value, or a
 * query/form param) into a number before class-validator's @IsNumber runs.
 * Leaves non-numeric or empty input untouched so @IsNumber still rejects it.
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (value === null || value === undefined || value === "") return value;

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? value : numericValue;
  });
}
