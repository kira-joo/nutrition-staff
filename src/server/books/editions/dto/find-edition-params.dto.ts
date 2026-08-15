import { IsMongoId } from "class-validator";

export class FindEditionParamsDto {
  @IsMongoId()
  id!: string;

  @IsMongoId()
  editionId!: string;
}
