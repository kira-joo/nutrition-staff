import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";

/**
 * Deliberately has no `status`/`visibility`/`showOnWebsite` fields at
 * all — a public caller can never request anything other than the
 * hardcoded public set; the route itself bakes that filter into `where`
 * rather than trusting a query param (same convention as recipes/reviews).
 */
export class PublicListBooksQueryDto extends BaseFindQueryDto {}
