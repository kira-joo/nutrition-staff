import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { BookStatus, BookVisibility } from "src/common/enums";

export class ListBooksQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(BookStatus)
  status?: BookStatus;

  @IsOptional()
  @IsEnum(BookVisibility)
  visibility?: BookVisibility;

  @IsOptional()
  @IsString()
  category?: string;
}
