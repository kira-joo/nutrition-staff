import { IsMongoId, IsString } from "class-validator";

export class FindReferenceParamsDto {
  @IsMongoId()
  id!: string;

  @IsString()
  referenceId!: string;
}
