import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsOptional } from "class-validator";
import { Status, UserRole } from "../../../common/enums";

export class ListUsersQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
