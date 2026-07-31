import { ArrayMaxSize, ArrayMinSize, IsMongoId } from "class-validator";
import "reflect-metadata";

// Puppeteer renders every recipe (plus its image) into one shared browser
// page/process; 50 recipes is comfortably within a single admin request's
// reasonable latency/memory budget while still covering any realistic
// "export this category's recipes" use case. Not a measured production
// ceiling — a starting bound, adjustable once real usage is observed.
export const MAX_RECIPES_PER_PDF_EXPORT = 50;

export class ExportRecipesPdfDto {
  @IsMongoId({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_RECIPES_PER_PDF_EXPORT)
  ids!: string[];
}
