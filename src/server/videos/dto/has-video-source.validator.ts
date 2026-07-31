import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from "class-validator";

interface VideoSourceShape {
  video?: unknown;
  externalUrl?: string | null;
}

@ValidatorConstraint({ name: "hasVideoSource", async: false })
class HasVideoSourceConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as VideoSourceShape;
    return Boolean(dto.video) || Boolean(dto.externalUrl?.trim());
  }

  defaultMessage(): string {
    return "A video needs either an uploaded video file or an external URL.";
  }
}

/**
 * Whole-DTO business rule for Video: at least one of `video` or
 * `externalUrl` must be present — neither is individually mandatory. Same
 * dual-registration pattern as Review's HasReviewContent (see its docs for
 * the full reasoning): registered on `video` for a field-level error when
 * a client legitimately omits neither on purpose, and on a synthetic
 * ungated property name so the rule can't be silently skipped just because
 * `video` itself is omitted (@IsOptional() on `video` would otherwise gate
 * every validator registered under that same property, including this one).
 */
export function HasVideoSource(validationOptions?: ValidationOptions): ClassDecorator {
  return function (target: Function) {
    for (const propertyName of ["video", "__hasVideoSource"]) {
      registerDecorator({
        target,
        propertyName,
        options: validationOptions,
        constraints: [],
        validator: HasVideoSourceConstraint,
      });
    }
  };
}
