import { IsMongoId } from "class-validator";

export class FindRecipeParamsDto {
  @IsMongoId()
  id!: string;
}
