import { IsEmail, IsString, MinLength } from "class-validator";
import "reflect-metadata";

export class SignupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
