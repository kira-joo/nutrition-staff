import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";
import "reflect-metadata";

/**
 * One headline figure in the public site's stats band.
 *
 * Deliberately the smallest shape that band actually needs. Notably absent:
 *
 * - **No icon.** The design makes the number itself the visual — a large figure
 *   over a short label — so an icon would be decoration competing with the thing
 *   it sits beside. Add one only if the design changes to need it.
 * - **No prefix.** The examples that matter here (`+`, `%`, `k`, `x`) all read as
 *   suffixes in both Arabic and English, and `50+` is the conventional form
 *   rather than `+50`. One optional field covers them instead of two.
 * - **No separate heading field.** The band has no visible heading; the figures
 *   are the statement. Its accessible name comes from the UI locale files, not
 *   from content, because it names the *section* rather than saying anything an
 *   editor would want to change.
 */
export class StatItemDto {
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  label!: LocalizedStringDto;

  /**
   * Not `@IsInt`: a figure like 4.9 (an average rating) is a legitimate stat.
   * Negative values are not — nothing this band shows can be below zero.
   */
  @IsNumber()
  @Min(0)
  value!: number;

  /** `+`, `%`, `k`, `x` … Rendered immediately after the value, unspaced. */
  @IsOptional()
  @IsString()
  @MaxLength(4)
  suffix?: string;

  @IsInt()
  @Min(0)
  order!: number;

  /**
   * Lets an editor retire a figure without deleting it — the public endpoint
   * returns every item and the site filters, so a disabled stat keeps its label
   * and value for whenever it is wanted again.
   */
  @IsBoolean()
  enabled!: boolean;
}
