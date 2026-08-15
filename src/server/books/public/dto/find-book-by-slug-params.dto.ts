import { IsString } from "class-validator";

export class FindBookBySlugParamsDto {
  @IsString()
  slug!: string;
}
