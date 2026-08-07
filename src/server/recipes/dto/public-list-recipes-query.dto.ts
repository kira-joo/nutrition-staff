import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";
import { IsMongoId, IsOptional } from "class-validator";

// Deliberately has no `status` field at all — a public caller can never
// override it, same as Review's public query DTO.
export class PublicListRecipesQueryDto extends BaseFindQueryDto {
  @IsOptional()
  @IsMongoId()
  category?: string;

  // `foodGroups` is already `@Filterable()` on the schema and accepted by
  // the admin query DTO, but was missing here — so the public endpoint
  // rejected it outright ("property foodGroups should not exist") and the
  // only way to filter by food group was to over-fetch and post-filter in
  // the browser. That would silently under-fill paginated pages, since the
  // server counts before the client filters. Same name and validation as
  // the admin DTO so both surfaces take an identical query.
  @IsOptional()
  @IsMongoId()
  foodGroups?: string;
}
