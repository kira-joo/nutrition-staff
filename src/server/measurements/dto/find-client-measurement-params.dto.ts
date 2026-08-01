import { IsMongoId } from "class-validator";

export class FindClientMeasurementParamsDto {
  @IsMongoId()
  id!: string;
}
