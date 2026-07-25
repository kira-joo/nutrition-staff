import { IsEmail, IsString } from "class-validator";
import "reflect-metadata";

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
