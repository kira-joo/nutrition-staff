import { IsString } from "class-validator";

export class FindCampaignBySlugParamsDto {
  @IsString()
  slug!: string;
}
