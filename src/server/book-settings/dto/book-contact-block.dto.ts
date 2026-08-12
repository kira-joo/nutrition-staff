import { IsEmail, IsOptional, IsString } from "class-validator";
import "reflect-metadata";

export class BookContactBlockDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
