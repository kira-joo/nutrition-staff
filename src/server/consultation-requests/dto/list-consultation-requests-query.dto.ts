import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsEnum, IsMongoId, IsOptional } from "class-validator";
import { ConsultationRequestIntent } from "src/common/enums";

export class ListConsultationRequestsQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsEnum(ConsultationRequestIntent)
  intent?: ConsultationRequestIntent;

  @IsOptional()
  @IsMongoId()
  clientProfileId?: string;
}
