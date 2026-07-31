import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsOptional } from "class-validator";
import { ContentStatus } from "src/common/enums";

export class ListFaqSectionsQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
