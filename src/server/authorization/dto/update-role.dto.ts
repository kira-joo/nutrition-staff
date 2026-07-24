import { IsBoolean, IsMongoId, IsOptional, IsString, MinLength } from "class-validator";
import "reflect-metadata";

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  grantsAll?: boolean;

  @IsOptional()
  @IsMongoId({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
