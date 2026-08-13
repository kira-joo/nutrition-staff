import { ArrayNotEmpty, IsInt, IsString } from "class-validator";
import "reflect-metadata";

export class ReorderBookBlocksDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  blockIds!: string[];

  @IsInt()
  expectedRevision!: number;
}
