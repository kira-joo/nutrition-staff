import { IsEmail, IsMongoId, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";
import { OptionalOrCleared } from "src/server/core/validation";
import { Status } from "../../../common/enums";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @OptionalOrCleared()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  roles?: string[];

  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
