import { IsInt, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";

export class CreateBookReferenceDto {
  @IsString()
  @MaxLength(200)
  label!: string;

  @IsString()
  @MaxLength(1000)
  text!: string;

  @OptionalOrCleared()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url?: string;

  @IsInt()
  expectedRevision!: number;
}

export class UpdateBookReferenceDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  text?: string;

  @OptionalOrCleared()
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url?: string;

  @IsInt()
  expectedRevision!: number;
}
