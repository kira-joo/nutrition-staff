import { IsMongoId } from "class-validator";

export class FindVideoParamsDto {
  @IsMongoId()
  id!: string;
}
