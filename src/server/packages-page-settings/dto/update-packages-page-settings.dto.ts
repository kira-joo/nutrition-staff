import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { DurationLabelsDto } from "src/server/packages-page-settings/dto/duration-labels.dto";

export class UpdatePackagesPageSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  title?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  titleAccent?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subtitle?: LocalizedStringDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DurationLabelsDto)
  durationLabels?: DurationLabelsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  subscribeButtonLabel?: LocalizedStringDto;
}
