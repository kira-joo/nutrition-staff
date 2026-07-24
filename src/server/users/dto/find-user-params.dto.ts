import { IsMongoId } from "class-validator";

export class FindUserParamsDto {
  @IsMongoId()
  id!: string;
}
