import { BaseFindQueryDto } from "@kira-joo/backend-toolkit-core";

/**
 * Deliberately has no `status` field at all — unlike ListReviewsQueryDto,
 * a public caller can never request anything other than published
 * reviews; the public route hardcodes that filter itself rather than
 * trusting a query param.
 */
export class PublicListReviewsQueryDto extends BaseFindQueryDto {}
