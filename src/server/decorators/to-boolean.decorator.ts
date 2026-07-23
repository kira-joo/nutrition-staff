import { Transform } from "class-transformer";

/**
 * Coerces "true"/"false" string input (e.g. a checkbox/select value, or a
 * query/form param) into a boolean before class-validator's @IsBoolean runs.
 * Leaves other input untouched so @IsBoolean still rejects it.
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  });
}
