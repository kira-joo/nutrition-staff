import { IsMongoId } from "class-validator";

export class FindBookParamsDto {
  @IsMongoId()
  id!: string;
}
