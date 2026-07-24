import { ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsEmail, IsMongoId, IsNumber, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { Status } from "../../../common/enums";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  roles?: string[];

  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  joinedAt?: string;
}
