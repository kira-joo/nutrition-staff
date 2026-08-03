import { IsMongoId } from "class-validator";

export class FindClientByUserParamsDto {
  @IsMongoId()
  userId!: string;
}
