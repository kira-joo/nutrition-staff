import { IsArray, IsInt, IsOptional, IsString, MaxLength } from "class-validator";
import "reflect-metadata";

export class PublishBookDto {
  // Checked against `Book.revision` (header) AND `Book.contentRevision`
  // (content) — publishing freezes both, so either changing concurrently
  // (in another tab, or another user) must conflict, not just one.
  @IsInt()
  expectedRevision!: number;

  @IsInt()
  expectedContentRevision!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  acknowledgedWarningCodes?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
