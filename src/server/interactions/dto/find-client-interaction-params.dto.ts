import { IsMongoId } from "class-validator";

export class FindClientInteractionParamsDto {
  @IsMongoId()
  id!: string;
}
