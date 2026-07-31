import { ImageAssetDto, LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsMongoId, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { ContentStatus } from "src/common/enums";

export class CreateRecipeDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title!: LocalizedStringDto;

  @ValidateNested()
  @Type(() => LocalizedStringDto)
  description!: LocalizedStringDto;

  // Required — a file must be uploaded on create (processAssetUploadFields
  // injects the real ImageAsset into payload.image before this validates;
  // if no file was given, the key stays absent and this correctly rejects).
  @ValidateNested()
  @Type(() => ImageAssetDto)
  image!: ImageAssetDto;

  @IsMongoId()
  category!: string;

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

  @IsEnum(ContentStatus)
  status!: ContentStatus;
}
