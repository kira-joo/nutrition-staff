import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from "class-validator";

interface ReviewContentShape {
  content?: { ar?: string; en?: string } | null;
  image?: unknown;
  beforeImage?: unknown;
  afterImage?: unknown;
}

@ValidatorConstraint({ name: "hasReviewContent", async: false })
class HasReviewContentConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as ReviewContentShape;
    const hasText = Boolean(dto.content?.ar?.trim() || dto.content?.en?.trim());
    const hasImage = Boolean(dto.image);
    const hasBeforeAndAfter = Boolean(dto.beforeImage) && Boolean(dto.afterImage);
    return hasText || hasImage || hasBeforeAndAfter;
  }

  defaultMessage(): string {
    return "A review needs at least one of: content text, an image, or both a before and an after image.";
  }
}

/**
 * Whole-DTO business rule for Review: at least one of `content`, `image`,
 * or (`beforeImage` and `afterImage`) must be present — none of them
 * individually mandatory. A class decorator, registering the check twice:
 *
 * - Under `content` itself, so the common case (content present but
 *   insufficient, e.g. empty strings and no images) surfaces inline on the
 *   content field via `CustomForm`'s server-error-to-field wiring.
 * - Under a synthetic property name that no field decorator ever gates, as
 *   a correctness backstop. `content`/`image`/etc. are each
 *   `@IsOptional()`, and class-validator skips *every* validator registered
 *   under the same property name once `@IsOptional()`'s conditional check
 *   on that property fails — so the `content`-attached copy alone silently
 *   skips whenever `content` is omitted entirely, exactly the case this
 *   rule most needs to catch (unreachable from the admin UI, which always
 *   submits the full form state, but reachable from any direct API call).
 *
 * Both copies read the whole object via `args.object`.
 */
export function HasReviewContent(validationOptions?: ValidationOptions): ClassDecorator {
  return function (target: Function) {
    for (const propertyName of ["content", "__hasReviewContent"]) {
      registerDecorator({
        target,
        propertyName,
        options: validationOptions,
        constraints: [],
        validator: HasReviewContentConstraint,
      });
    }
  };
}
