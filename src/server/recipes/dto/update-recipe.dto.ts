import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsMongoId, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class UpdateRecipeDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description?: LocalizedStringDto;

  // Optional here (omitted = keep the existing image) — never nullable,
  // since the schema requires a Recipe always have one.
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image?: ImageAssetDto;

  @IsOptional()
  @IsMongoId()
  category?: string;

  @IsOptional()
  @IsMongoId({ each: true })
  foodGroups?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedStringDto)
  ingredients?: LocalizedStringDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocalizedStringDto)
  instructions?: LocalizedStringDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  prepTime?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  cookTime?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  servings?: LocalizedStringDto;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
