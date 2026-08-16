import { IsNumber, IsOptional, Max, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import "reflect-metadata";
import { ImageAssetDto } from "@kira-joo/backend-toolkit-core";

/**
 * `image` uses the shared `ImageAssetDto` — exactly like `doctorImage` and
 * `bookLogo` — and NOT a loosely-typed object.
 *
 * That distinction is load-bearing: validation runs with `whitelist: true`,
 * which strips every property that carries no validation decorator. Typing
 * this as `Record<string, unknown>` with a bare `@IsObject()` left the
 * ImageAsset's own keys undecorated, so whitelisting deleted all of them
 * and forwarded a bare `{}` to Mongoose, which then rejected
 * `provider`/`publicId`/`secureUrl`/`format`/`width`/`height`/`bytes` as
 * missing. `@ValidateNested()` + `@Type()` is what keeps them.
 *
 * `null` stays valid: it is the documented "clear this asset" signal that
 * `destroyReplacedAssets` keys off, and the upload pipeline writes the
 * resolved asset here before `validateDto` runs.
 */
export class BookPageWatermarkDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  opacity?: number;

  /** Millimetres, not a percentage — the tile has to be the same physical size in the reader and the PDF. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  scaleMm?: number;
}
