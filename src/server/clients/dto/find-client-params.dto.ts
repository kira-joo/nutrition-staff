import { IsMongoId } from "class-validator";

export class FindClientParamsDto {
  @IsMongoId()
  id!: string;
}
