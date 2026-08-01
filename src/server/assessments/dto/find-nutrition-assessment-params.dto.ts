import { IsMongoId } from "class-validator";

export class FindNutritionAssessmentParamsDto {
  @IsMongoId()
  id!: string;
}
