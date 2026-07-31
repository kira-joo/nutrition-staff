import { LocalizedStringDto } from "@kira-joo/backend-toolkit-core";
import { Type } from "class-transformer";
import { IsEnum, IsMongoId, IsOptional, ValidateNested } from "class-validator";
import "reflect-metadata";
import { CampaignBlockType } from "src/common/enums";

/**
 * `faqSectionId` is only checked for id-shape here — whether it actually
 * exists, isn't deleted, and is published is a database-backed check
 * (see assert-faq-ref-valid.ts), which a class-validator decorator can't
 * do declaratively for a single-block-per-request DTO the same way the
 * rest of this file's synchronous rules can.
 */
export class FaqRefBlockDto {
  @IsEnum(CampaignBlockType)
  type!: CampaignBlockType.FAQ_REF;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedStringDto)
  heading?: LocalizedStringDto;

  @IsMongoId()
  faqSectionId!: string;
}
