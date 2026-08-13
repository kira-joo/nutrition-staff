import { ArrayNotEmpty, IsInt, IsString } from "class-validator";
import "reflect-metadata";

export class ReorderChaptersDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  chapterIds!: string[];

  @IsInt()
  expectedRevision!: number;
}
