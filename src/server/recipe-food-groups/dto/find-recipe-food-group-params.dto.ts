import { IsMongoId } from "class-validator";

export class FindRecipeFoodGroupParamsDto {
  @IsMongoId()
  id!: string;
}
