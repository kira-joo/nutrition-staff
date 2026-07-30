import { IsMongoId } from "class-validator";

export class FindReviewParamsDto {
  @IsMongoId()
  id!: string;
}
