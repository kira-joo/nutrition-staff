import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsMongoId, IsOptional } from "class-validator";
import { Status } from "../../../common/enums";

export class ListUsersQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsMongoId()
  roles?: string;
}
