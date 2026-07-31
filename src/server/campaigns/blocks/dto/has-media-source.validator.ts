import {
  registerDecorator,
  ValidatorConstraint,
  type ValidationArguments,
  type ValidationOptions,
  type ValidatorConstraintInterface,
} from "class-validator";

interface MediaSourceShape {
  image?: unknown;
  video?: unknown;
}

@ValidatorConstraint({ name: "hasMediaSource", async: false })
class HasMediaSourceConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as MediaSourceShape;
    return Boolean(dto.image) || Boolean(dto.video);
  }

  defaultMessage(): string {
    return "A media block needs either an image or a video.";
  }
}

/**
 * Whole-DTO business rule for the media block: at least one of `image` or
 * `video` must be present — neither is individually mandatory. Same
 * dual-registration pattern as Video's HasVideoSource (see its docs for the
 * full reasoning): registered on `image` for a field-level error in the
 * common case, and on a synthetic ungated property so the rule can't be
 * silently skipped by `@IsOptional()` on `image` gating out every validator
 * registered under that same property name.
 */
export function HasMediaSource(validationOptions?: ValidationOptions): ClassDecorator {
  return function (target: Function) {
    for (const propertyName of ["image", "__hasMediaSource"]) {
      registerDecorator({
        target,
        propertyName,
        options: validationOptions,
        constraints: [],
        validator: HasMediaSourceConstraint,
      });
    }
  };
}
