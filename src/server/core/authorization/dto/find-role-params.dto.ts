import { IsMongoId } from "class-validator";

export class FindRoleParamsDto {
  @IsMongoId()
  id!: string;
}
