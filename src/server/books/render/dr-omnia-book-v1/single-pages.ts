import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import { escapeHtml } from "src/common/books/rich-text/render-rich-text";
import { chapterLabel } from "src/common/books/chapter-label";
import type { Chapter, BookReference } from "src/common/interfaces/book-chapter.interface";
import type { Book } from "src/common/interfaces/book.interface";
import { generateQrSvg } from "../qr/generate-qr-svg";
import type { StreamFragment } from "../page-model.interface";

/**
 * Cover — no folio/running head. Two independent, EXPLICIT modes (see
 * `BookCoverMode`'s doc comment on the `Book` interface):
 *
 * - `"generated"` (default): the reusable template renders the dynamic
 *   title/subtitle/doctor identity over the template's own artwork.
 *   `coverImage` is ignored entirely in this mode, even if one is stored.
 * - `"uploaded"`: `coverImage` becomes the ENTIRE page, full-bleed — no
 *   title, subtitle, logo, or doctor name rendered over it at all. The
 *   doctor's own finished design already contains whatever text it needs.
 *
 * `coverImage` itself is never cleared by a mode switch either direction,
 * so toggling back to "uploaded" later needs no re-upload.
 */
export function renderCoverPage(book: Pick<Book, "title" | "subtitle" | "coverMode" | "coverImage">, identity: ResolvedBookIdentity): StreamFragment {
  if (book.coverMode === "uploaded" && book.coverImage) {
    const html = `<div class="book-cover book-cover--uploaded" style="--book-cover-image-url: url('${escapeHtml(book.coverImage.secureUrl)}')"></div>`;
    return { id: "cover", kind: "singlePage", pageKind: "cover", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
  }
  const html = `
    <div class="book-cover">
      <div class="book-cover-title">${escapeHtml(book.title)}</div>
      ${book.subtitle ? `<div class="book-cover-subtitle">${escapeHtml(book.subtitle)}</div>` : ""}
      ${identity.bookLogo ? `<img class="book-cover-logo" src="${escapeHtml(identity.bookLogo.secureUrl)}" alt="" />` : ""}
      ${identity.doctorName ? `<div class="book-cover-doctor">${escapeHtml(identity.doctorName)}</div>` : ""}
    </div>`;
  return { id: "cover", kind: "singlePage", pageKind: "cover", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
}

/**
 * The copyright/disclaimer legal block, pinned into the page immediately
 * after the front cover (the title page) rather than given its own page
 * or left to flow before the TOC — both tried and both rejected on
 * review. Baked directly into `renderTitlePage`'s own HTML rather than
 * pushed as a separate stream fragment: the title page is a `singlePage`
 * fragment, which always closes its own page immediately (see the
 * paginator's `layoutPass`), so nothing pushed after it in the stream
 * could ever land on that same physical page anyway — the only way to
 * guarantee "same page as the title" is to render it as part of that one
 * page's markup. Hand-synced with nutrition-client's identical function.
 */
function buildLegalFooterHtml(identity: ResolvedBookIdentity): string {
  if (!identity.copyrightText && !identity.disclaimer) return "";
  return `
    <div class="book-legal-footer">
      ${identity.copyrightText ? `<p>${escapeHtml(identity.copyrightText)}</p>` : ""}
      ${identity.disclaimer ? `<p>${escapeHtml(identity.disclaimer)}</p>` : ""}
    </div>`;
}

export function renderTitlePage(book: Pick<Book, "title" | "subtitle">, identity: ResolvedBookIdentity): StreamFragment {
  const html = `
    <div class="book-title-page">
      <div class="book-title-page-main">
        <div class="book-title-page-title">${escapeHtml(book.title)}</div>
        ${book.subtitle ? `<div>${escapeHtml(book.subtitle)}</div>` : ""}
        ${identity.doctorName ? `<div>${escapeHtml(identity.doctorName)}</div>` : ""}
      </div>
      ${buildLegalFooterHtml(identity)}
    </div>`;
  return { id: "title-page", kind: "singlePage", pageKind: "titlePage", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
}

export function renderAboutDoctorPage(identity: ResolvedBookIdentity): StreamFragment | null {
  if (!identity.doctorName && !identity.doctorBio) return null;
  const html = `
    <div class="book-about-doctor-page">
      ${identity.doctorImage ? `<img class="book-doctor-image" src="${escapeHtml(identity.doctorImage.secureUrl)}" alt="" />` : ""}
      ${identity.doctorName ? `<div class="book-doctor-name">${escapeHtml(identity.doctorName)}</div>` : ""}
      ${identity.doctorTitle ? `<div class="book-doctor-title">${escapeHtml(identity.doctorTitle)}</div>` : ""}
      ${identity.doctorBio ? `<p>${escapeHtml(identity.doctorBio)}</p>` : ""}
    </div>`;
  return { id: "about-doctor-page", kind: "singlePage", pageKind: "aboutDoctorPage", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: true, numbered: true };
}

export function renderTocReservationFragment(): StreamFragment {
  return { id: "toc-reservation", kind: "tocReservation", html: "", chapterId: null, atomic: true, splittable: false, keepWithNext: false, forceNewPage: true };
}

/**
 * Full-bleed, generic, and entirely data-driven — no book/chapter name is
 * ever hardcoded here. `chapterNumber` is the chapter's 1-based position
 * in the FULL (unfiltered) chapter list, matching how `paginate-book`
 * builds `tocChapters`'s labels — a chapter with `includeInToc: false`
 * still occupies its place, so both must agree on the same numbering or
 * the printed label and the TOC label would disagree for any chapter
 * after it.
 *
 * A chapter's own `coverImage`, when set, replaces the template's
 * botanical artwork entirely (`book-chapter-opener--custom-cover`, wired
 * via the `--book-chapter-cover-url` custom property so escaping/quoting
 * stays in one place rather than string-building a second background-image
 * declaration inline) — template-with-content-override, matching §3's
 * "template owns the visual language, content fills it in".
 *
 * Now emitted as `kind: "singlePage"` (a dedicated full page) rather than
 * a content fragment sharing a page with what follows — the direct
 * consequence, disclosed rather than silently absorbed: `startOnNewPage`
 * no longer has an observable effect on a chapter opener specifically,
 * since a `singlePage` fragment already always gets its own page in
 * `paginate-book.browser.ts`'s layout loop.
 */
export function renderChapterOpenerFragment(chapter: Chapter, chapterNumber: number, identity: ResolvedBookIdentity): StreamFragment {
  const hasCustomCover = Boolean(chapter.coverImage);
  const style = hasCustomCover ? ` style="--book-chapter-cover-url: url('${escapeHtml(chapter.coverImage!.secureUrl)}')"` : "";
  const html = `
    <div class="book-chapter-opener${hasCustomCover ? " book-chapter-opener--custom-cover" : ""}"${style}>
      <div class="book-chapter-band">
        <div class="book-chapter-label">${escapeHtml(chapterLabel(chapterNumber))}</div>
        <div class="book-chapter-title">${escapeHtml(chapter.title)}</div>
        ${chapter.subtitle ? `<div class="book-chapter-subtitle">${escapeHtml(chapter.subtitle)}</div>` : ""}
        ${chapter.intro ? `<p class="book-chapter-intro">${escapeHtml(chapter.intro)}</p>` : ""}
      </div>
      ${identity.doctorName ? `<div class="book-chapter-doctor">${escapeHtml(identity.doctorName)}</div>` : ""}
    </div>`;
  return {
    id: `chapter-opener-${chapter.id}`,
    kind: "singlePage",
    pageKind: "chapterOpener",
    chapterId: chapter.id,
    html,
    atomic: true,
    splittable: false,
    keepWithNext: false,
    forceNewPage: chapter.startOnNewPage,
    numbered: true,
  };
}

export function renderReferencesPage(references: BookReference[]): StreamFragment[] {
  if (references.length === 0) return [];
  const entries = references
    .map((reference) => `<div class="book-reference-entry"><span class="book-reference-label">${escapeHtml(reference.label)}:</span> ${escapeHtml(reference.text)}</div>`)
    .join("");
  return [
    {
      id: "references-heading",
      kind: "content",
      html: `<h2 class="book-heading">المراجع</h2>`,
      chapterId: null,
      atomic: true,
      splittable: false,
      keepWithNext: true,
      forceNewPage: true,
    },
    { id: "references-list", kind: "content", html: `<div class="book-references-page">${entries}</div>`, chapterId: null, atomic: false, splittable: false, keepWithNext: false, forceNewPage: false },
  ];
}

/**
 * Same independent, explicit "generated"/"uploaded" contract as
 * `renderCoverPage` — see `BookCoverMode`'s doc comment. `"uploaded"`
 * (`backCoverImage` full-bleed, nothing else rendered) short-circuits
 * before any of the generated-mode identity/contact resolution below.
 */
export async function renderBackCoverPage(book: Pick<Book, "backCoverMode" | "backCoverImage">, identity: ResolvedBookIdentity): Promise<StreamFragment> {
  if (book.backCoverMode === "uploaded" && book.backCoverImage) {
    const html = `<div class="book-back-cover book-back-cover--uploaded" style="--book-back-cover-image-url: url('${escapeHtml(book.backCoverImage.secureUrl)}')"></div>`;
    return { id: "back-cover", kind: "singlePage", pageKind: "backCover", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: true, numbered: false };
  }

  // `dir="ltr"` on phone/whatsapp/email/website only — never on `address`,
  // which is free-text and plausibly itself Arabic. Without this, a
  // leading "+" (a bidi-neutral character) on a phone number gets
  // visually reordered to the end by the surrounding RTL paragraph's
  // bidi algorithm — a real rendering defect caught in Phase D
  // verification, not a hypothetical one.
  const ltrContactLines = [identity.contact.phone, identity.contact.whatsapp, identity.contact.email].filter(Boolean);
  // The book/template-level QR — encodes `identity.qrDestination`, which
  // is always the RESOLVED value the caller passed in (live for staff
  // preview, frozen `resolvedSettings.qrDestination` for a published
  // Edition's PDF) — this function never re-resolves BookSettings
  // itself, so a published Edition's QR can never silently change
  // because BookSettings changed afterward.
  const qrSvg = identity.qrDestination ? await generateQrSvg(identity.qrDestination) : null;
  const html = `
    <div class="book-back-cover">
      ${identity.backCoverAudienceText ? `<div class="book-back-cover-audience">${escapeHtml(identity.backCoverAudienceText)}</div>` : ""}
      ${identity.backCoverClosingText ? `<div class="book-back-cover-summary">${escapeHtml(identity.backCoverClosingText)}</div>` : ""}
      <div class="book-back-cover-contact">
        ${identity.websiteUrl ? `<div dir="ltr">${escapeHtml(identity.websiteUrl)}</div>` : ""}
        ${ltrContactLines.map((line) => `<div dir="ltr">${escapeHtml(line as string)}</div>`).join("")}
        ${identity.contact.address ? `<div>${escapeHtml(identity.contact.address)}</div>` : ""}
      </div>
      ${qrSvg ? `<div class="book-back-cover-qr">${qrSvg}</div>` : ""}
      ${identity.bookLogo ? `<img class="book-back-cover-logo" src="${escapeHtml(identity.bookLogo.secureUrl)}" alt="" />` : ""}
    </div>`;
  return { id: "back-cover", kind: "singlePage", pageKind: "backCover", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: true, numbered: false };
}
