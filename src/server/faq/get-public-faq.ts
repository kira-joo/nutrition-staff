import { SortOrder } from "@kira-joo/toolkit-common";
import { ContentStatus } from "src/common/enums";
import type { PublicFaqSection } from "src/common/interfaces/public-faq.interface";
import { faqItemRepository } from "src/server/faq-items/faq-items.repository";
import { faqSectionRepository } from "src/server/faq-sections/faq-sections.repository";

/**
 * Joins FAQ sections with their items, ordered and published-filtered,
 * for the public website — this is backend business logic (which section
 * an item belongs to, what order staff authored, what's actually
 * published), not frontend presentation logic, so it belongs here rather
 * than being repeated by every frontend consumer.
 *
 * No `relations: ["section"]` population needed on the items query — this
 * only needs each item's `section` id to bucket it, and the full section
 * object is already being built from the sections query.
 */
export async function getPublicFaq(): Promise<PublicFaqSection[]> {
  const [sections, items] = await Promise.all([
    faqSectionRepository.findAllNoCountPublic({
      where: { status: ContentStatus.PUBLISHED },
      query: { sortBy: "order", sortOrder: SortOrder.ASC },
    }),
    faqItemRepository.findAllNoCountPublic({
      where: { status: ContentStatus.PUBLISHED },
      query: { sortBy: "order", sortOrder: SortOrder.ASC },
    }),
  ]);

  return sections.map((section) => ({
    _id: String(section._id),
    title: section.title,
    items: items
      .filter((item) => String(item.section) === String(section._id))
      .map((item) => ({ _id: String(item._id), question: item.question, answer: item.answer })),
  }));
}
