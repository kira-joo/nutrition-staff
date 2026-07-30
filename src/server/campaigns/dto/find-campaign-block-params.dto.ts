import { IsMongoId, IsString } from "class-validator";

export class FindCampaignBlockParamsDto {
  @IsMongoId()
  campaignId!: string;

  // Not @IsMongoId() — block ids are crypto.randomUUID() strings, same as DoctorProfile's gallery item ids.
  @IsString()
  blockId!: string;
}
