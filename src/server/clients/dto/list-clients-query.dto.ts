import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
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
}
