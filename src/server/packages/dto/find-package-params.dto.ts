import { IsMongoId } from "class-validator";

export class FindPackageParamsDto {
  @IsMongoId()
  id!: string;
}
