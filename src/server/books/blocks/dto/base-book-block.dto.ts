import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";
import "reflect-metadata";

/**
 * The three fields every block DTO shares (mirrors `BookBlockBase` in
 * `src/common/interfaces/book-block.interface.ts`). class-validator
 * inherits decorators across `extends`, so every per-type block DTO
 * extends this rather than repeating the three fields 12 times.
 */
export class BaseBookBlockDto {
  @IsOptional()
  @IsBoolean()
  keepWithNext?: boolean;

  @IsOptional()
  @IsBoolean()
  avoidBreakInside?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  citationIds?: string[];
}
