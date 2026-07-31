import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { CampaignBlockType, ContentStatus } from "src/common/enums";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";

/**
 * Reference-existence/availability checks, dispatched by block type —
 * mirrors `BLOCK_DTO_BY_TYPE`/`BLOCK_ASSET_FIELDS_BY_TYPE`'s one-lookup-
 * table-per-concern shape. Most block types have nothing to check here; a
 * block type only gets an entry once it actually references another
 * collection by id.
 *
 * A validated `faqSectionId` is only checked for id-*shape* by
 * `FaqRefBlockDto` — this is the actual existence/availability check,
 * requiring a database lookup a synchronous class-validator decorator
 * can't do declaratively. "Available" means the same thing the public FAQ
 * routes already mean by it: exists, not soft-deleted (excluded from
 * `findOne` by default), and published — a Campaign block referencing a
 * draft or since-unpublished section would otherwise silently expose it
 * on the public site.
 */
const BLOCK_REFERENCE_CHECK_BY_TYPE: Partial<Record<CampaignBlockType, (dto: Record<string, unknown>) => Promise<void>>> = {
  [CampaignBlockType.FAQ_REF]: async (dto) => {
    const faqSectionId = dto.faqSectionId as string;
    const section = await faqSectionRepository.findOne({
      where: { _id: faqSectionId, status: ContentStatus.PUBLISHED },
      skipThrowError: true,
    });
    if (!section) {
      throw new BadRequestError(
        `FAQ section "${faqSectionId}" does not exist, is deleted, or is not published.`,
        { faqSectionId }
      );
    }
  },
};

export async function assertBlockReferencesValid(dto: Record<string, unknown>): Promise<void> {
  const check = BLOCK_REFERENCE_CHECK_BY_TYPE[dto.type as CampaignBlockType];
  if (check) await check(dto);
}
