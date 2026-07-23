import "reflect-metadata";
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MinLength } from "class-validator";
import { Status, UserRole } from "../../../../common/enums";
import { ToNumber } from "../../decorators/to-number.decorator";

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
