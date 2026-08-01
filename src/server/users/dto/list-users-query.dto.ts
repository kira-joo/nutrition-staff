import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsMongoId, IsOptional } from "class-validator";
import { ProfileType, Status } from "../../../common/enums";

export class ListUsersQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @IsMongoId()
  roles?: string;

  /** Derived filter — resolved against ClientProfile/StaffProfile existence, not a stored User field. */
  @IsOptional()
  @IsEnum(ProfileType)
  profileType?: ProfileType;
}
