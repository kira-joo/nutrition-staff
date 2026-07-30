import { IsInt, IsString, IsUrl, Min } from "class-validator";

export class SocialLinkDto {
  @IsString()
  platform!: string;

  @IsUrl()
  url!: string;

  @IsInt()
  @Min(0)
  order!: number;
}
