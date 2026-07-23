import "reflect-metadata";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Status, UserRole } from "../../../../common/enums";
import { ToNumber } from "../../decorators/to-number.decorator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

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
