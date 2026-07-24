import { ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsEmail, IsMongoId, IsNumber, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { Status } from "../../../common/enums";

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsMongoId({ each: true })
  roles?: string[];

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
