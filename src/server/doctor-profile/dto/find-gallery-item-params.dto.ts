import { IsString } from "class-validator";

/** Not `@IsMongoId()` — gallery item ids are `crypto.randomUUID()` strings, not ObjectIds (see gallery-item schema). */
export class FindGalleryItemParamsDto {
  @IsString()
  itemId!: string;
}
