import { IsMongoId } from "class-validator";

export class FindRecipeCategoryParamsDto {
  @IsMongoId()
  id!: string;
}
