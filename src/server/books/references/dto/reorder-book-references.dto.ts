import { ArrayNotEmpty, IsInt, IsString } from "class-validator";
import "reflect-metadata";

export class ReorderBookReferencesDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  referenceIds!: string[];

  @IsInt()
  expectedRevision!: number;
}
