import { IsNumber, Min } from "class-validator";

export class PricingTierDto {
  @IsNumber()
  @Min(0)
  originalPrice!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}
