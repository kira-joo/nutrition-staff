import { IsMongoId, IsString } from "class-validator";

export class FindChapterParamsDto {
  @IsMongoId()
  id!: string;

  // Chapter ids are `crypto.randomUUID()` strings, not Mongo ids — same convention as Campaign block ids.
  @IsString()
  chapterId!: string;
}
