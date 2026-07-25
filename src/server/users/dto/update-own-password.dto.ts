import { IsString, MinLength } from "class-validator";
import "reflect-metadata";

export class UpdateOwnPasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
