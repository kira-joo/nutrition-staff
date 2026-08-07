import { SortOrder } from "@kira-joo/toolkit-common";
import { createGetRoute } from "src/server/core/route-factories";
import { packageRepository } from "src/server/packages/packages.repository";
import { ContentStatus } from "src/common/enums";

export const dynamic = "force-dynamic";

// Sorted by the authored `order` field, matching what `getPublicFaq()` does
// for FAQ sections and items. Without it this returned Mongo's natural
// order, which disagreed with `order` — the public site received VIP
// (order 2) before Standard (order 1). `order` is a required field on the
// schema and is the display-ordering contract, so the backend owes every
// consumer the correct sequence rather than leaving each one to re-sort.
export const GET = createGetRoute({
  auth: false,
  handler: async () =>
    packageRepository.findAllNoCountPublic({
      where: { status: ContentStatus.PUBLISHED },
      query: { sortBy: "order", sortOrder: SortOrder.ASC },
    }),
});
