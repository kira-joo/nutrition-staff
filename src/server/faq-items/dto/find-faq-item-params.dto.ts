import { IsMongoId } from "class-validator";

export class FindFaqItemParamsDto {
  @IsMongoId()
  id!: string;
}
