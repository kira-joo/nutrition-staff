import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsMongoId } from "class-validator";

export class ListNutritionAssessmentsQueryDto extends BaseFindQueryDto {
  @IsMongoId()
  clientProfileId!: string;
}
