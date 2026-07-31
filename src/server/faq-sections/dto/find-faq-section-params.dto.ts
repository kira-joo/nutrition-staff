import { IsMongoId } from "class-validator";

export class FindFaqSectionParamsDto {
  @IsMongoId()
  id!: string;
}
