import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import "reflect-metadata";
import { PricingTierDto } from "src/server/packages/dto/pricing-tier.dto";

export class PricingTiersDto {
  @ValidateNested()
  @Type(() => PricingTierDto)
  month!: PricingTierDto;

  @ValidateNested()
  @Type(() => PricingTierDto)
  quarter!: PricingTierDto;

  @ValidateNested()
  @Type(() => PricingTierDto)
  half!: PricingTierDto;
}
