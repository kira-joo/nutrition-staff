import { IsBoolean, IsMongoId, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsBoolean()
  grantsAll?: boolean;

  @IsOptional()
  @IsMongoId({ each: true })
  permissions?: string[];
}
