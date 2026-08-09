import { IsMongoId } from "class-validator";

export class FindConsultationRequestParamsDto {
  @IsMongoId()
  id!: string;
}
