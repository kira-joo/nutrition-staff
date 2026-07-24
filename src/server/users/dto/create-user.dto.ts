import { ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { Status, UserRole } from "../../../common/enums";

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsEnum(Status)
  status!: Status;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  joinedAt?: string;
}
