We are starting a new feature across `nutrition-staff` + `nutrition-client`:

# Books / Arabic Digital Publishing System

This is NOT a simple PDF upload feature and NOT a generic rich-text page.

We are building a small publishing CMS for Dr. Omnia that allows her to author structured Arabic health books once, then produce from the same source:

1. a professional printable PDF;
2. an interactive RTL flipbook/web-book experience;
3. an accurate staff preview while editing.

The initial books will be Arabic health guides such as:

- دليلك الشامل في السوبر ماركت
- أدلة التغذية الصحية
- أدلة اختيار المنتجات
- patient education material
- nutrition guides

The architecture is more important than getting a quick first PDF working.

Do not begin implementation by inventing a large form or storing arbitrary HTML.

---

# 0. BEFORE CODING — AUDIT FIRST

Read the existing architecture in both repositories before making changes.

Inspect specifically:

## nutrition-staff

- existing CMS modules and schema conventions;
- Mongo schema decorators;
- repositories;
- route factories;
- public/private route patterns;
- feature tables;
- PageShell/detail page conventions;
- forms and field primitives;
- Cloudinary/image upload architecture;
- permissions/auth;
- status enums;
- sortable/reorderable content patterns;
- campaign block editor patterns;
- doctor profile gallery/media patterns;
- current PDF-related recipe functionality, if any;
- how generated files/media are represented.

## nutrition-client

- public data architecture;
- cache tags/revalidation;
- dynamic detail routes;
- AppRoute/appHref conventions;
- current theme/design system;
- RTL architecture;
- current image/media viewer patterns;
- public content listing/detail conventions.

## toolkits

Before implementing generic infrastructure, inspect existing:

- backend-toolkit packages;
- frontend-toolkit-core;
- frontend-toolkit-tailwind;
- toolkit-common.

Reuse and extend existing primitives where appropriate.

Do not create a second generic block/editor/media architecture if one already exists and can be safely extended.

---

# 1. WORK IN PARALLEL WHERE SAFE

Use multiple agents/sub-agents for independent audits where this genuinely speeds up the work.

Good parallel candidates:

- Agent A: backend schema/API/data architecture audit.
- Agent B: staff editor/UI/media/reorder architecture audit.
- Agent C: PDF/print rendering and Arabic pagination feasibility research.
- Agent D: client flipbook/public-book architecture audit.

However:

- define strict file ownership;
- do not let agents independently implement overlapping architecture;
- coordinator must review findings before accepting;
- do not merge contradictory implementations;
- architecture decisions remain centralized.

---

# 2. NON-NEGOTIABLE PRODUCT DECISIONS

## Arabic only

Books are ARABIC ONLY.

Do not build bilingual `LocalizedString` fields for book content.

Book content fields are normal Arabic strings:

```ts
title: string
subtitle?: string
body?: string

The publishing system is RTL-first from the architecture upward.

This affects:

editor;
PDF;
page ordering;
spread ordering;
TOC;
page numbers;
running headers;
next/previous navigation;
flip animation;
keyboard arrows;
mobile swipe.

Do not implement an LTR book and merely add dir="rtl" afterward.

3. ONE BOOK TEMPLATE — CONTENT IS SEPARATE

There is ONE primary Dr. Omnia book template in V1.

The template defines the visual system:

page size;
margins;
gutter;
logo placement;
brand colors;
fonts;
cover composition;
chapter opening style;
heading hierarchy;
paragraph typography;
image treatment;
callout style;
page frame;
running headers;
footer;
page-number placement;
TOC appearance;
back-cover layout.

Individual books provide CONTENT.

Do not store arbitrary visual styling repeatedly on each Book.

A Book should not need to say:

logo goes here;
font size is X;
footer is Y;
heading color is Z.

Those belong to the template/settings layer.

4. BOOK SETTINGS — SEPARATE FROM DOCTOR PROFILE

Do NOT bind book identity directly to DoctorProfile.

Website doctor content and publishing identity are separate domains.

Create a Books-level settings entity/module, conceptually:

BookSettings

It provides defaults for books:

doctor display name for books;
professional title for books;
short “About Dr. Omnia” bio specifically written for books;
default doctor image for books;
default book logo;
website/domain;
social links;
contact details;
default disclaimer;
copyright text;
default back-cover contact block;
default QR destination;
print defaults;
publishing/template defaults.

These values are edited from the Books module itself.

They do NOT automatically mirror DoctorProfile.

5. PER-BOOK OVERRIDES

A Book may override selected BookSettings.

Resolution rule:

Book override
    ↓ if absent
BookSettings default

Example:

Default short doctor bio
       ↓
Book-specific bio override (optional)

The staff UI must make inheritance obvious.

For overridable fields show concepts such as:

“Using books default”
“Override for this book”
“Reset to books default”

Do not copy defaults invisibly into every Book record because then inheritance becomes impossible to reason about.

6. CORE DOMAIN MODEL

Audit the existing architecture before choosing exact Mongo embedding/reference strategy, but the conceptual model must cover:

BookSettings
Book
BookChapter
BookBlock
BookEdition
GeneratedBookArtifact

Whether Chapter/Block are embedded documents or separate collections should be chosen based on actual repository/reordering/document-size patterns.

Do not mechanically create six collections if embedding is cleaner.

But preserve these domain concepts.

7. BOOK

Book should cover concepts like:

Book {
  _id

  title
  subtitle?
  slug
  shortDescription?

  category?
  coverImage?
  backCoverImage?

  editionLabel?
  version?

  status

  overrides

  frontMatter
  chapters
  backMatter

  visibility
  allowPdfDownload
  allowFlipbook
  showOnWebsite

  createdAt
  updatedAt
}

Do not treat this exact pseudo-interface as mandatory field naming.

Fit it into existing project conventions.

8. BOOK WORKFLOW

At minimum support:

Draft
Published
Archived

If the existing status architecture cleanly supports ReadyForReview, it may be useful:

Draft → Ready for Review → Published → Archived

Do not invent a huge approval workflow.

The important distinction is:

editing a Draft must never mutate an already-published edition.

9. FRONT MATTER

Books support configurable front matter.

Default conceptual ordering:

Cover
Inside Title Page
Copyright / Disclaimer
About Dr. Omnia
About This Book
Table of Contents
Introduction

Each relevant section should be:

enable/disable;
configurable;
reorderable where appropriate.

Important:

Table of Contents is SYSTEM GENERATED.

Do not make the doctor manually type page numbers.

10. CHAPTERS

Main content is organized as:

Book
 ├─ Chapter 1
 │   └─ Blocks[]
 ├─ Chapter 2
 │   └─ Blocks[]
 └─ Chapter N

Chapter should support concepts such as:

title
subtitle?
intro?
coverImage?
startOnNewPage
includeInToc
tocTitle?
blocks[]
order

tocTitle allows a shorter TOC label than the visible chapter heading.

Chapters must be reorderable.

Support duplicate chapter.

11. BLOCK EDITOR — NOT RAW HTML

Do NOT store one giant HTML string for a chapter.

Use structured ordered blocks.

V1 should support at least:

Heading
Subheading
Rich Text / Paragraph
Image
Image + Caption
Bullet List
Numbered List
Checklist
Quote
Tip
Note
Warning / Important Callout
Table
Divider
QR Code / Link
Recipe Reference
References / Citation block where appropriate
PAGE BREAK

Possible later blocks can be recorded, but do not overbuild V1.

Blocks must be reorderable with drag/drop.

Support:

Add
Edit
Delete
Duplicate
Move
12. PAGE BREAK — REQUIRED IN V1

This is essential.

Automatic pagination is the default:

content fills page
→ renderer automatically moves overflow to next page

But the doctor must also be able to explicitly say:

stop this page here and begin the remaining content on a new page.

Add a real block:

{
  type: "pageBreak"
}

In the editor it appears visually as something like:

────────────
📄 بداية صفحة جديدة
────────────

It does NOT render as visible content in the final book.

The renderer interprets it as:

break-before: page;

or equivalent supported print-layout behavior.

Also support:

Start chapter on new page

A chapter-level option.

Keep with next

Useful especially for headings.

A heading should not be left as the last line of a page while its first paragraph starts on the next page.

Avoid break inside where reasonable

For:

images + captions;
callouts;
small tables;
short grouped content.

Do not force impossible layouts; renderer must degrade gracefully.

13. RICH TEXT RULES

Paragraph/Rich Text is not a plain textarea.

Provide controlled formatting:

bold;
emphasis;
underline only if genuinely useful;
links;
lists where needed;
limited highlight;
superscript for references if implemented.

But DO NOT allow arbitrary per-paragraph:

font family;
font size;
random colors;
margins;
page positioning.

Visual hierarchy belongs to the Book Template.

We are preventing every book from turning into a differently-styled Word document.

14. IMAGES

Use the existing media/Cloudinary architecture.

An Image Block should conceptually support:

asset
alt text
caption
display mode
size
crop/focal point if existing architecture supports it

Display choices may include:

small
medium
large
full width
full page

Ordering naturally controls whether the image is:

before title
after title
between paragraphs
etc.

Do not add an artificial position: beforeTitle architecture when drag/drop block ordering already solves that.

For print, detect obviously low-resolution imagery where possible and warn the editor before publishing.

Do not silently upscale a 400px image to a full printed A5 page.

15. RECIPE BLOCK

The system already has real Recipes.

Books should eventually be able to insert an existing Recipe using a dedicated block instead of forcing the doctor to duplicate the recipe manually.

Concept:

Recipe Block
→ select an existing Recipe
→ render it using the Book Template

IMPORTANT:

At publish time, Edition must snapshot the recipe content used.

Changing the website Recipe afterward must NOT retroactively change an already-published book edition.

16. REFERENCES / SOURCES

These are health books, so support references cleanly from V1 if feasible.

Do not build a giant academic citation engine.

A simple architecture is enough:

Book References[]

with content blocks optionally referencing them.

Back matter can automatically render References.

If the current scope makes numbered inline citation linking disproportionately expensive, support clean structured References first and record inline citation linking as an extension.

Do not reduce references to arbitrary unstructured HTML.

17. BACK MATTER

Conceptually support:

Conclusion
References
About / Contact
Back Cover

The Back Cover uses a fixed template with configurable slots.

Example:

Short book summary
Who this guide is for
Doctor name/title
Website
QR
Social links
Logo
Closing message

BookSettings supplies defaults.

Book-level override may replace selected content.

18. COVER

Cover composition is template-driven.

Variable data:

Book title
Subtitle
Cover image/artwork
Optional small label/category
Edition
Date if enabled

Fixed identity:

Dr. Omnia logo
Publishing styling
Doctor name/title positioning
Brand system

Do not make each book design its own cover from scratch.

19. PRINT PAGE DESIGN

The pages must feel like a real book, not a browser webpage printed to PDF.

Conceptually:

┌──────────────────────────────┐
│ Dr. Omnia          Chapter   │
│ ──────────────────────────── │
│                              │
│       Section Heading        │
│                              │
│ Arabic content...            │
│                              │
│           image              │
│                              │
│ Arabic content...            │
│                              │
│ ──────────────────────────── │
│ dr-omnia.com          17     │
└──────────────────────────────┘

Use subtle brand framing, not a heavy border.

Left/right printed pages may intentionally differ:

Right page:
Book / chapter name               page

Left page:
page                  chapter/book

Respect Arabic physical book ordering.

20. PAGE SIZE / PRINT SETTINGS

V1 should support a clear print format.

Start with a well-designed A5 default unless actual requirements dictate otherwise.

Architecture should understand:

pageSize
margins
gutter
safe area
bleed if needed
page-number start
chapter start behavior

Do not expose every low-level setting to the doctor unless useful.

Good defaults > complicated print configuration.

21. ARABIC TYPOGRAPHY

Choose and verify an Arabic typeface suitable for:

screen;
PDF;
Arabic shaping;
long reading;
print.

The system should account for:

generous Arabic line-height;
heading hierarchy;
proper RTL punctuation;
widow/orphan control where feasible;
heading + first paragraph cohesion;
image + caption cohesion;
readable body size in physical print.

PDF Arabic correctness is a hard requirement.

Do not accept broken joining/shaping because an easier PDF library was chosen.

22. TABLE OF CONTENTS

TOC is generated from the final pagination.

Example:

المقدمة ........................ 5

1. التخطيط قبل التسوق ........ 8

2. قراءة الملصق الغذائي ...... 18

3. اختيار منتجات الألبان ..... 31

It must understand final page numbers.

PDF TOC entries should be clickable if the chosen engine supports internal PDF links reliably.

Flipbook TOC is interactive and navigates directly to the chapter/page.

23. BOOK SETTINGS PREVIEW

Book Settings should have preview modes showing how defaults affect:

Cover
Content page
Chapter page
Back cover

The doctor should understand the global effect of changing Book Settings.

24. EDITOR UX

Staff Books listing:

Books

Table should include useful columns such as:

Cover
Title
Status
Current Edition
Pages if generated
Last Updated
Published At
Actions

Actions:

Edit
Preview
Duplicate
Publish
Export / Download PDF
Open Flipbook
Archive

Respect existing staff table/page conventions.

25. BOOK EDITOR STRUCTURE

Do NOT build one enormous form.

Use clear editing surfaces/tabs/sections, conceptually:

Overview
Content
Front Matter
Chapters
Back Matter
Book Overrides
Publishing
Preview
Editions

Exact UX should follow the current staff architecture.

Content editor should make it clear:

Chapter
   ├─ Block
   ├─ Block
   ├─ Page Break
   └─ Block
26. AUTOSAVE / DATA LOSS PROTECTION

Books are long-form content.

Do not rely on one final Save button after 30 minutes of editing.

Implement a sensible draft-save strategy consistent with the existing architecture.

At minimum:

dirty-state awareness;
navigation warning if unsaved changes exist.

Prefer autosave if it can be implemented reliably without causing reorder/race-condition problems.

Undo/Redo would be valuable.

If robust Undo/Redo significantly expands V1, structure editor state so it can be added cleanly and report it as a deliberate follow-up.

Do not ship a fragile fake undo history.

27. PUBLISH VALIDATION

Before Publish, run a publishing checklist.

Examples:

book title exists;
cover requirements satisfied;
no empty required chapters;
no broken/missing media;
low-resolution print warnings;
invalid block references;
malformed external links;
no broken Recipe references;
required book settings resolved.

Differentiate:

Errors — block publishing.
Warnings — may publish after acknowledgement.

Do not turn every aesthetic preference into a blocking validation.

28. EDITIONS — CRITICAL

Book is the working document/draft.

BookEdition is a historical published snapshot.

When the doctor presses Publish:

Current Draft
    ↓ snapshot
Edition 1

Edition captures the exact published state:

Book content
Chapters
Blocks
BookSettings values used
Book overrides
Template version
Referenced recipe snapshots
Cover/back-cover content
Publishing settings
Generated artifact references
publishedAt

Example:

دليلك الشامل في السوبر ماركت

الطبعة الأولى
January 2026
84 pages

الطبعة الثانية
August 2026
96 pages

Published Editions must not silently mutate when:

Book draft changes;
BookSettings change;
Doctor Profile changes;
a referenced Recipe changes;
social links change;
template defaults change.

Doctor edits Draft only.

Then:

Draft has unpublished changes

Publish again:

Edition 2

In Staff UI we can call this:

الطبعات / الإصدارات

rather than exposing technical terminology.

29. GENERATED ARTIFACTS

PDF is not the source of truth.

Book content is the source.

PDF is a generated artifact tied to an Edition.

Concept:

GeneratedBookArtifact {
  type: PDF
  editionId
  file
  pageCount
  fileSize
  generatedAt
  contentVersion/hash?
  status
}

Useful generation states:

NOT_GENERATED
GENERATING
READY
FAILED
OUTDATED

Do not regenerate a full PDF on every keystroke.

Preview may use HTML/layout rendering during editing.

Generate the authoritative PDF:

on explicit request;
during Publish;
or through another deliberate action.

Store the generated artifact in the project's established storage/media infrastructure where appropriate.

30. RENDERERS — SAME CONTENT, DIFFERENT OUTPUTS

“Renderer” is an implementation architecture term, not necessarily something exposed as a staff module.

One Book data model feeds multiple outputs.

Concept:

                  Book / Edition data
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
       Staff Preview   PDF/Print   Flipbook
         Renderer       Renderer    Renderer
Staff Preview Renderer

Shows the doctor an accurate book preview while editing.

It should approximate:

page dimensions;
typography;
images;
breaks;
headers/footer;
chapter structure.
Print/PDF Renderer

Responsible for:

physical pagination;
page breaks;
page size;
margins/gutter;
TOC;
page numbers;
running header/footer;
Arabic typography;
images;
internal links;
print-quality output.
Flipbook Renderer

Uses the SAME edition/content but displays it interactively on the web.

Do not create separate hand-authored Flipbook content.

31. PDF ENGINE — AUDIT, DO NOT GUESS

Research the current stack and choose a PDF strategy based on actual requirements.

Hard requirements:

reliable Arabic shaping;
RTL;
high-quality print;
page breaks;
repeated page header/footer;
page numbers;
A5/A4;
images;
TOC;
internal links where practical;
predictable pagination.

Do not choose a PDF library merely because it is already installed.

Compare the viable approaches based on this project.

A browser/HTML-to-PDF renderer may be appropriate because it can share the print CSS/template, but choose after testing Arabic output and pagination.

Prototype the hard cases BEFORE committing the architecture:

Arabic paragraph across pages;
heading near page bottom;
image + caption;
explicit Page Break;
TOC page numbers;
Arabic fonts.
32. FLIPBOOK EXPERIENCE

Public interactive book route conceptually:

/books/[slug]

or the appropriate AppRoute equivalent.

Desktop:

Arabic book progression;
two-page spread where appropriate;
correct physical order.

Mobile:

single page;
swipe/touch friendly.

Features:

real page-flip effect;
previous/next;
page count;
jump to page;
interactive TOC;
fullscreen;
zoom;
optional download PDF;
share;
keyboard support;
touch support.

Optional subtle page-turn sound:

default OFF or configurable;
mute control;
never autoplay obnoxiously.

prefers-reduced-motion:

Do not disable access to the book.

Replace exaggerated page-curl motion with a simpler immediate/subtle page transition.

33. PUBLIC BOOK VISIBILITY

Book visibility should support concepts such as:

PUBLIC
UNLISTED

Draft/Archived already handle non-public lifecycle.

PUBLIC:
may appear in public Books surfaces.

UNLISTED:
available through its direct URL but not listed/discovered normally.

Also separate:

allowFlipbook
allowPdfDownload
showOnWebsite

These are different concerns.

A doctor may want:

interactive reading;
no downloadable PDF.

Or:

downloadable handout;
no public listing.
34. PUBLIC BOOKS LISTING

Plan for:

/books
/books/[slug]

The listing can show:

cover;
title;
short description;
edition;
read/open CTA.

If implementing public listing in the first pass significantly distracts from the publishing engine, prioritize Staff + rendering + detail/flipbook first, but architecture must support it cleanly.

Do not hardwire Books only as hidden staff artifacts.

35. QR CODES

Support QR blocks and/or generated Back Cover QR.

Use case:

printed book
→ scan QR
→ open:

dr-omnia.com/books/supermarket-guide

or a specific website Recipe/link.

Do not bake an external QR API into the architecture without need.

Generate using a reliable local/server library where appropriate.

36. DUPLICATION

Support:

Duplicate Book
Duplicate Chapter
Duplicate Block

Book duplication should create a new Draft, never clone published Edition identity as though it were the same publication.

37. PERMISSIONS

Inspect current staff authorization architecture.

At minimum Book administration should require appropriate staff/admin access.

If the existing permissions system supports granular permissions cleanly, distinguish:

books.read
books.write
books.publish

But do not invent a new RBAC system specifically for Books.

Reuse what exists.

38. CACHE + REVALIDATION

Public Books/Flipbook must fit the existing nutrition-client caching architecture.

Define:

BOOKS tag
book:<slug/id> tag

or the appropriate established taxonomy.

Publishing/updating visibility should invalidate the relevant public cache.

Do not bypass the toolkit route/revalidation conventions.

39. BOOK TEMPLATE VERSIONING

Even though V1 has ONE visual template, preserve a simple templateVersion.

Example:

dr-omnia-book-v1

Edition snapshots which version rendered it.

This does NOT mean building a multi-template editor now.

It simply prevents future visual-template evolution from making historical editions ambiguous.

40. BOOK SETTINGS VS PUBLISHED EDITION

Changing BookSettings affects:

new drafts;
unpublished views using defaults.

It must NOT mutate historical Editions.

When publishing:

resolved BookSettings
+
Book overrides
→ snapshot into Edition

That snapshot is what future regeneration of the old Edition should use.

41. STAFF PREVIEW MODES

Aim for a useful workflow:

Edit
Print Preview
Flipbook Preview

Print Preview must show physical-page proportions, not simply a responsive website article.

Allow:

Preview Chapter
Preview Whole Book

if practical.

42. PAGE NUMBERS / PRINT LOGIC

Never store pageNumber manually on blocks.

Page numbers are renderer output.

Changing one paragraph may move 50 pages.

Automatic renderer pagination determines final pages.

Doctor controls only deliberate layout constraints:

Page Break
Start Chapter on New Page
Keep With Next
Avoid Break Inside

TOC uses the final pagination.

43. PHYSICAL ARABIC BOOK ORDER

Explicitly verify this.

An Arabic printed/interactively flipped book is not only text RTL.

Need correct:

cover opening direction;
right/left page relationship;
first content page placement;
two-page spread ordering;
page-turn direction;
TOC navigation;
keyboard direction.

Test against an actual Arabic book progression before declaring Flipbook complete.

44. BACK COVER / SOCIAL DATA

BookSettings provides defaults:

website
socials
doctor identity
logo
contact

Book provides:

backCoverSummary
closingText?
QR destination override?

Do not copy all website SiteSettings blindly.

This is intentionally a separate publishing profile.

45. ERROR / GENERATION UX

PDF generation may fail.

Staff UI must not hang indefinitely.

Expose meaningful state:

Generating PDF...
Ready
Failed — Retry
Outdated — Regenerate

Record useful internal error information without leaking stack traces in user-facing UI.

46. LARGE BOOK / PERFORMANCE CONSIDERATIONS

Do not assume every book is 10 pages.

Design editor/data/rendering for potentially:

50 pages;
100+ pages;
many high-resolution images;
dozens of chapters/blocks.

Do not load enormous original Cloudinary assets unnecessarily in Staff thumbnails.

Do not rerender/regenerate the entire PDF on every character typed.

Measure performance with a realistically large seeded test book before completion.

47. DELETE BEHAVIOR

Be careful once Editions exist.

Deleting a Draft Book that has published Editions should not casually destroy historical published artifacts.

Choose safe semantics after auditing current project deletion conventions.

Archive may be safer for published books.

Do not hard-delete historical Editions through a normal UI action without deliberate confirmation/architecture.

48. INITIAL SEED / REAL TEST BOOK

Create temporary development/test data that exercises the full architecture:

Arabic title;
cover;
About Doctor;
About Book;
TOC;
Introduction;
at least 3 chapters;
long paragraphs crossing page boundaries;
explicit Page Break;
short chapter ending halfway through page;
image;
image caption;
lists;
callout;
table;
Recipe reference if implemented;
conclusion;
references;
back cover;
QR.

Use it to validate PDF and Flipbook.

Do not commit fake production health claims/content unless explicitly intended.

Test fixtures/scripts may be temporary and removed after verification where appropriate.

49. VERIFICATION — PDF

Do not report PDF success merely because a file exists.

Inspect actual rendered pages.

Verify:

Arabic letters shape correctly;
RTL punctuation/order;
no clipped text;
headings don't orphan badly;
explicit Page Break works;
long text flows across pages;
images don't overflow;
page numbers correct;
running header/footer correct;
TOC page numbers match;
clickable TOC if implemented;
cover has no accidental standard page header/footer;
Back Cover correct;
correct A5/A4 physical dimensions;
printable quality.

Inspect enough pages visually to validate first/middle/end behavior.

50. VERIFICATION — FLIPBOOK

Drive real interactions:

open cover;
turn forward in Arabic reading direction;
turn backward;
keyboard;
touch/swipe;
TOC jump;
direct page jump;
mobile single-page;
desktop spread;
fullscreen;
zoom;
reduced motion;
optional sound/mute if implemented;
PDF download permission.

Do not fake a page flip by using a carousel with the wrong Arabic physical ordering.

51. VERIFICATION — EDITOR

Test:

create book;
use BookSettings defaults;
override Book profile;
reset override;
add chapter;
reorder chapters;
duplicate chapter;
add every V1 block;
reorder blocks;
duplicate block;
Page Break;
media upload/select;
unsaved/draft behavior;
preview;
publish;
edit Draft afterward;
confirm Edition remains unchanged;
publish second Edition.
52. VERIFICATION — HISTORICAL SNAPSHOT

This is mandatory.

Test explicitly:

Publish Edition 1.
Record its About Doctor, cover, Recipe snapshot, template settings and PDF.
Change BookSettings.
Change the Book draft.
Change the source Recipe.
Regenerate/open Edition 1.

Edition 1 must still reflect its original snapshot.

Then publish Edition 2 and confirm the new data appears only there.

53. DOCUMENTATION

Document:

Book domain architecture;
inheritance/override rules;
Edition snapshot semantics;
Block registry;
Print renderer;
Flipbook renderer;
Arabic/RTL decisions;
PDF generation lifecycle;
cache/revalidation;
template versioning;
known limitations;
future extraction/toolkit candidates.

Update the appropriate existing docs rather than creating random documentation files if a canonical architecture document already exists.

54. IMPLEMENTATION ORDER

Do NOT implement the entire system blindly in one giant change.

Recommended order:

Phase A — architecture + PDF feasibility prototype
audit;
test Arabic PDF strategy;
confirm pagination/Page Break;
confirm Flipbook RTL feasibility;
finalize schema.

STOP if the chosen PDF/Flipbook technical approach cannot meet Arabic requirements.

Phase B — BookSettings + Book CRUD
backend;
staff listing;
book overview;
permissions.
Phase C — Chapters + Block Editor
block registry;
reorder;
Page Break;
images;
rich text;
draft persistence.
Phase D — Template + Staff Preview
cover;
pages;
front/back matter;
TOC structure;
print preview.
Phase E — Edition / Publish architecture
immutable snapshots;
validation;
publication workflow;
artifact lifecycle.
Phase F — PDF generation
final pagination;
TOC page numbers;
artifact storage;
print QA.
Phase G — Public Book data architecture
public endpoints;
nutrition-client data/cache;
visibility rules.
Phase H — Flipbook
RTL book interaction;
TOC;
mobile/desktop;
reduced motion.
Phase I — public Books UX
/books;
/books/[slug];
PDF download controls;
QR/public navigation.
Phase J — hardening
large-book performance;
accessibility;
error states;
cleanup;
documentation;
full regression.

Commit coherent phases separately.

Stop for review after Phase A before committing to the full renderer architecture if meaningful technical tradeoffs are discovered.

55. WORKFLOW

Do not push or merge unless explicitly instructed.

Keep changes on appropriate feature branches.

Do not make direct unrelated changes to default branches.

Before touching either repository, inspect current dirty/untracked files and preserve concurrent work.

Do not include unrelated local files.

Do not publish toolkit packages during this feature unless explicitly approved.

If a genuine generic toolkit improvement is identified:

record it;
use existing package functionality where possible;
do not derail Books into a package-refactor project.
FINAL PRODUCT EXPECTATION

The doctor's workflow should eventually feel like:

Books
→ New Book
→ enter cover/title
→ configure optional overrides
→ Chapters
→ add/reorder blocks
→ insert Page Breaks where desired
→ Preview Print
→ Preview Flipbook
→ Publish
→ Edition 1 generated
→ Download professional PDF
→ Open/share interactive Arabic Flipbook

Later:

Edit Draft
→ add/change content
→ Edition 1 stays untouched
→ Publish
→ Edition 2

The final experience should feel like a small professional Arabic publishing CMS, not a PDF form generator.

One template.
One source of content.
Arabic-first.
Structured editor.
Automatic pagination + explicit Page Break.
Historical Editions.
Professional print PDF.
Real RTL Flipbook.
```
