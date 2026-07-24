import { BaseFindQueryDto, ToBoolean } from "@kira-joo/backend-toolkit-core";
import { IsBoolean, IsOptional } from "class-validator";

export class ListRolesQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  grantsAll?: boolean;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;
}
