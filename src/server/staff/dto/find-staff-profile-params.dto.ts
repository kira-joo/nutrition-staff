import { IsMongoId } from "class-validator";

export class FindStaffProfileParamsDto {
  @IsMongoId()
  userId!: string;
}
