import { IsString } from "class-validator";
import "reflect-metadata";

/** `notes` is the only field a saved calculation allows editing — inputs/results/assumptions are immutable clinical history. */
export class UpdateNutritionCalculationDto {
  @IsString()
  notes!: string;
}
