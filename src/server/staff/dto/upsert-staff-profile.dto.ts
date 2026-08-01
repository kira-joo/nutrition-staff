import { ToNumber } from "@kira-joo/backend-toolkit-core";
import { IsNumber, IsOptional, IsString } from "class-validator";
import "reflect-metadata";

export class UpsertStaffProfileDto {
  @IsOptional()
  @ToNumber()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  joinedAt?: string;
}
