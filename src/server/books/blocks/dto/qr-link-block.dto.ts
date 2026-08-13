import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";
import "reflect-metadata";
import { BookBlockType } from "src/common/enums";
import { BaseBookBlockDto } from "./base-book-block.dto";

export class QrLinkBlockDto extends BaseBookBlockDto {
  @IsEnum(BookBlockType)
  type!: BookBlockType.QR_LINK;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  destination!: string;
}
