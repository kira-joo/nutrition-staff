import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import { escapeHtml } from "src/common/books/rich-text/render-rich-text";
import type { Chapter, BookReference } from "src/common/interfaces/book-chapter.interface";
import type { Book } from "src/common/interfaces/book.interface";
import { generateQrSvg } from "../qr/generate-qr-svg";
import type { StreamFragment } from "../page-model.interface";

/** Cover — no folio/running head, fixed identity (logo/brand) + variable data (title/subtitle/cover image). */
export function renderCoverPage(book: Pick<Book, "title" | "subtitle" | "coverImage">, identity: ResolvedBookIdentity): StreamFragment {
  const html = `
    <div class="book-cover">
      ${book.coverImage ? `<img class="book-cover-image" src="${escapeHtml(book.coverImage.secureUrl)}" alt="" />` : ""}
      <div class="book-cover-title">${escapeHtml(book.title)}</div>
      ${book.subtitle ? `<div class="book-cover-subtitle">${escapeHtml(book.subtitle)}</div>` : ""}
      ${identity.bookLogo ? `<img class="book-cover-logo" src="${escapeHtml(identity.bookLogo.secureUrl)}" alt="" />` : ""}
      ${identity.doctorName ? `<div class="book-cover-doctor">${escapeHtml(identity.doctorName)}</div>` : ""}
    </div>`;
  return { id: "cover", kind: "singlePage", pageKind: "cover", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
}

export function renderTitlePage(book: Pick<Book, "title" | "subtitle">, identity: ResolvedBookIdentity): StreamFragment {
  const html = `
    <div class="book-title-page">
      <div class="book-title-page-title">${escapeHtml(book.title)}</div>
      ${book.subtitle ? `<div>${escapeHtml(book.subtitle)}</div>` : ""}
      ${identity.doctorName ? `<div>${escapeHtml(identity.doctorName)}</div>` : ""}
    </div>`;
  return { id: "title-page", kind: "singlePage", pageKind: "titlePage", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
}

export function renderCopyrightPage(identity: ResolvedBookIdentity): StreamFragment {
  const html = `
    <div class="book-copyright-page">
      ${identity.copyrightText ? `<p>${escapeHtml(identity.copyrightText)}</p>` : ""}
      ${identity.disclaimer ? `<p>${escapeHtml(identity.disclaimer)}</p>` : ""}
    </div>`;
  return { id: "copyright-page", kind: "singlePage", pageKind: "copyrightPage", chapterId: null, html, atomic: true, splittable: false, keepWithNext: false, forceNewPage: false, numbered: false };
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

export function renderChapterOpenerFragment(chapter: Chapter): StreamFragment {
  const html = `
    <div class="book-chapter-opener">
      ${chapter.coverImage ? `<img class="book-chapter-cover" src="${escapeHtml(chapter.coverImage.secureUrl)}" alt="" />` : ""}
      <div class="book-chapter-title">${escapeHtml(chapter.title)}</div>
      ${chapter.subtitle ? `<div class="book-chapter-subtitle">${escapeHtml(chapter.subtitle)}</div>` : ""}
      ${chapter.intro ? `<p class="book-chapter-intro">${escapeHtml(chapter.intro)}</p>` : ""}
    </div>`;
  return {
    id: `chapter-opener-${chapter.id}`,
    kind: "chapterOpener",
    html,
    chapterId: chapter.id,
    atomic: true,
    splittable: false,
    keepWithNext: true,
    forceNewPage: chapter.startOnNewPage,
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

export async function renderBackCoverPage(book: Pick<Book, "backCoverImage">, identity: ResolvedBookIdentity): Promise<StreamFragment> {
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
