import { IsInt, IsString, IsUrl, Min } from "class-validator";
import "reflect-metadata";

export class BookSocialLinkDto {
  @IsString()
  platform!: string;

  @IsUrl()
  url!: string;

  @IsInt()
  @Min(0)
  order!: number;
}
