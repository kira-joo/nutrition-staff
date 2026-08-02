import { BaseFindQueryDto, ToBoolean } from "@kira-joo/backend-toolkit-core";
import { IsBoolean, IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { ClientLifecycle, ClientSource } from "src/common/enums";

export class ListClientsQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(ClientLifecycle)
  lifecycle?: ClientLifecycle;

  @IsOptional()
  @IsEnum(ClientSource)
  source?: ClientSource;

  @IsOptional()
  @IsMongoId()
  assignedToUserId?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  /** True: nextFollowUpAt is set and due today or overdue — the cross-client "who do I call today" view. */
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  followUpDue?: boolean;
}
