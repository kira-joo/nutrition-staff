import { IsMongoId } from "class-validator";

export class FindNutritionCalculationParamsDto {
  @IsMongoId()
  id!: string;
}
