import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsMongoId, IsOptional } from "class-validator";

// Deliberately has no `status` field at all — a public caller can never
// override it, same as Review's public query DTO.
export class PublicListRecipesQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsMongoId()
  category?: string;
}
