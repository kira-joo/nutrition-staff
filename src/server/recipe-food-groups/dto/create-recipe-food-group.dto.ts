import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class CreateRecipeFoodGroupDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
