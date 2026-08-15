import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

/** `recipeId` existence/published-state is checked separately in `assert-book-block-references-valid.ts` — a sync decorator can't do the DB lookup. */
export class RecipeRefBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.RECIPE_REF;

  @IsMongoId()
  recipeId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayTitle?: string;
}
