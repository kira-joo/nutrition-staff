import { IsIn, IsMongoId, IsString } from "class-validator";

export class FindSectionBlocksParamsDto {
  @IsMongoId()
  id!: string;

  @IsIn(["front-matter", "back-matter"])
  section!: "front-matter" | "back-matter";

  @IsString()
  slot!: string;
}

export class FindSectionBlockParamsDto extends FindSectionBlocksParamsDto {
  @IsString()
  blockId!: string;
}
