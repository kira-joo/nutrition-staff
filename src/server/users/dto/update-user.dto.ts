import { IsEmail, IsMongoId, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
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
}
