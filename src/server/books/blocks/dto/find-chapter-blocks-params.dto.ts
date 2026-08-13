import { IsMongoId, IsString } from "class-validator";

export class FindChapterBlocksParamsDto {
  @IsMongoId()
  id!: string;

  @IsString()
  chapterId!: string;
}

export class FindChapterBlockParamsDto extends FindChapterBlocksParamsDto {
  @IsString()
  blockId!: string;
}
