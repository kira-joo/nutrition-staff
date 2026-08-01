import { IsEmail, IsMongoId, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
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
}
