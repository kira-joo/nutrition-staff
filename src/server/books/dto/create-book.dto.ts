import { IsOptional, IsString, Matches, MinLength } from "class-validator";
import "reflect-metadata";

export class CreateBookDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: "slug must be lowercase letters, numbers, and hyphens only" })
  slug!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
