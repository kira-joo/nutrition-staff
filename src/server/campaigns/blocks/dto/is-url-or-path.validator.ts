import { isURL, registerDecorator, type ValidationOptions } from "class-validator";

/**
 * Accepts either an absolute URL (`https://...`) or a site-relative path
 * (`/recipes`) — a CTA button plausibly links to either an external page or
 * an internal nutrition-client route, and a plain `@IsUrl()` would reject
 * the relative-path case outright.
 */
export function IsUrlOrPath(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isUrlOrPath",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== "string" || value.length === 0) return false;
          return value.startsWith("/") || isURL(value);
        },
        defaultMessage(): string {
          return "Must be a valid URL or a site-relative path starting with \"/\".";
        },
      },
    });
  };
}
