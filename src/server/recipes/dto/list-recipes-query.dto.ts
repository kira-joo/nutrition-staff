import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsMongoId, IsOptional } from "class-validator";
import { ContentStatus } from "src/common/enums";

export class ListRecipesQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsMongoId()
  category?: string;
}
