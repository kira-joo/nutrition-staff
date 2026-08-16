import { IsEmail, IsOptional, IsString } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";

export class BookContactBlockDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @OptionalOrCleared()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
