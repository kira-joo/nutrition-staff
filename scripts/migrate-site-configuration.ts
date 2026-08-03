/**
 * SITE CONFIGURATION MIGRATION (Site Settings, Doctor Profile, Packages Page Settings)
 * ======================================================================================
 * Migrates real static content currently hardcoded across several
 * `nutrition-client` files into these three singleton CMS modules in
 * `nutrition-staff`, through the real authenticated HTTP API (never touches
 * MongoDB directly) — same approach as migrate-client-content.ts and
 * migrate-reviews-videos.ts.
 *
 * These three modules are singletons (see getOrCreateSingleton /
 * upsertSingleton — every route only ever queries/writes `where: {}`), so
 * this script is NOT a create-or-skip list import. For every field it:
 *   - fills it in if the current DB value is empty (the getOrCreateSingleton
 *     default state — nothing configured yet),
 *   - reports "matched" and does nothing if the current value already
 *     equals the source value,
 *   - reports a CONFLICT and leaves the field untouched if the current DB
 *     value is non-empty and *different* from the source — never
 *     overwrites a real, already-configured CMS value.
 * List-shaped fields (Site Settings' socialLinks, Doctor Profile's
 * bioSections/programHighlights/whyChooseReasons/gallery) are treated as
 * additive: existing entries are matched by a natural key (platform name,
 * or the item's own text/altText) and left alone; only genuinely missing
 * entries are appended. Re-running this script is always safe.
 *
 * Known gaps, deliberately not fabricated (see the final migration report
 * for the full reasoning on each):
 *   - Site Settings has no physical address / working-hours source data —
 *     nutrition-client has none anywhere.
 *   - Site Settings' default SEO title has no Arabic variant in the source
 *     (only an English metadata.title exists); its base `description` is
 *     Next.js's unfilled scaffold placeholder ("A brief description of your
 *     website.") — treated as not-real-content, not migrated as if it were.
 *   - Site Settings' `ogImage` source is an external, token-signed Facebook
 *     CDN URL (likely already expired) — attempted via a direct fetch with
 *     a short timeout; skipped and reported if it fails, never fabricated.
 *   - Site Settings' `favicon` source is a `.ico` file — `faviconImagePolicy`
 *     only allows jpg/png/webp, so it cannot pass upload validation as-is;
 *     skipped and reported (needs a manual PNG conversion via the admin UI).
 *   - Doctor Profile's magazine gallery photos have English-only alt text in
 *     the source (no Arabic variant) — `altText.ar` is imported empty.
 *
 * Run (dry-run first):
 *   node --env-file=.env --import tsx scripts/migrate-site-configuration.ts --dry-run
 *   node --env-file=.env --import tsx scripts/migrate-site-configuration.ts
 *
 * Env overrides (all optional, same convention as the other migrate-*.ts scripts):
 *   NUTRITION_STAFF_BASE_URL   default http://localhost:3000
 *   NUTRITION_CLIENT_PATH      default ../nutrition-client (sibling checkout)
 *   MIGRATION_EMAIL            default ava.thompson@example.com (seeded admin)
 *   MIGRATION_PASSWORD         default Passw0rd! (seeded dev-only password)
 */
import fs from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";

const BASE_URL = process.env.NUTRITION_STAFF_BASE_URL ?? "http://localhost:3000";
const NUTRITION_CLIENT_PATH = process.env.NUTRITION_CLIENT_PATH ?? path.resolve(__dirname, "../../nutrition-client");
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL ?? "ava.thompson@example.com";
const MIGRATION_PASSWORD = process.env.MIGRATION_PASSWORD ?? "Passw0rd!";

interface Localized {
  en: string;
  ar: string;
}

interface ModuleReport {
  filled: string[];
  matched: string[];
  conflicts: { field: string; current: unknown; wouldBe: unknown }[];
  assetsUploaded: string[];
  assetsSkipped: { field: string; reason: string }[];
  invalid: { key: string; reason: string }[];
}

function emptyModuleReport(): ModuleReport {
  return { filled: [], matched: [], conflicts: [], assetsUploaded: [], assetsSkipped: [], invalid: [] };
}

const report = {
  mode: DRY_RUN ? "dry-run" : "live",
  siteSettings: emptyModuleReport(),
  doctorProfile: emptyModuleReport(),
  packagesPageSettings: emptyModuleReport(),
};

// ---------------------------------------------------------------------------
// HTTP + auth
// ---------------------------------------------------------------------------

let accessToken = "";

async function apiRaw(pathName: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${pathName}`, {
    ...init,
    headers: { ...(init.headers ?? {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new Error(`${init.method ?? "GET"} ${pathName} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function apiJson<T>(pathName: string, method: string, body?: unknown): Promise<T> {
  return apiRaw(pathName, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }) as Promise<T>;
}

async function login(): Promise<void> {
  const result = await apiJson<{ accessToken: string }>("/api/auth/login", "POST", {
    email: MIGRATION_EMAIL,
    password: MIGRATION_PASSWORD,
  });
  accessToken = result.accessToken;
  console.log(`Authenticated as ${MIGRATION_EMAIL}`);
}

async function putMultipart(pathName: string, payload: Record<string, unknown>, files: Record<string, { buffer: Buffer<ArrayBuffer>; filename: string; mime: string }>): Promise<unknown> {
  if (DRY_RUN) return undefined;

  const form = new FormData();
  form.set("payload", JSON.stringify(payload));
  for (const [field, file] of Object.entries(files)) {
    form.set(field, new Blob([file.buffer], { type: file.mime }), file.filename);
  }

  const res = await fetch(`${BASE_URL}${pathName}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`PUT ${pathName} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

async function postMultipart(pathName: string, payload: Record<string, unknown>, files: Record<string, { buffer: Buffer<ArrayBuffer>; filename: string; mime: string }>): Promise<unknown> {
  if (DRY_RUN) return undefined;

  const form = new FormData();
  form.set("payload", JSON.stringify(payload));
  for (const [field, file] of Object.entries(files)) {
    form.set(field, new Blob([file.buffer], { type: file.mime }), file.filename);
  }

  const res = await fetch(`${BASE_URL}${pathName}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`POST ${pathName} -> ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// ---------------------------------------------------------------------------
// Field-level diff helpers (fill-if-empty / match / conflict — never
// overwrite a real, already-configured value)
// ---------------------------------------------------------------------------

function isEmptyString(value: unknown): boolean {
  return typeof value !== "string" || value.trim() === "";
}

function isEmptyLocalized(value: unknown): boolean {
  const localized = value as Localized | null | undefined;
  return !localized || (isEmptyString(localized.ar) && isEmptyString(localized.en));
}

function localizedEqual(a: Localized | null | undefined, b: Localized): boolean {
  return (a?.ar ?? "") === b.ar && (a?.en ?? "") === b.en;
}

/** Decides whether a scalar/localized field is safe to fill, already matches, or conflicts — and records it on the module report. */
function planScalarField<T>(
  moduleReport: ModuleReport,
  field: string,
  current: T,
  source: T,
  isEmpty: (value: T) => boolean,
  equal: (a: T, b: T) => boolean
): { include: boolean; value?: T } {
  if (isEmpty(current)) {
    moduleReport.filled.push(field);
    return { include: true, value: source };
  }
  if (equal(current, source)) {
    moduleReport.matched.push(field);
    return { include: false };
  }
  moduleReport.conflicts.push({ field, current, wouldBe: source });
  return { include: false };
}

async function tryFetchExternalImage(url: string, timeoutMs = 8000): Promise<Buffer<ArrayBuffer> | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer()) as Buffer<ArrayBuffer>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Site Settings
// ---------------------------------------------------------------------------

interface SiteSettingsSource {
  phone: string;
  whatsappNumber: string;
  email: string;
  socialLinks: { platform: string; url: string; order: number }[];
  logoFile: string;
  faviconFile: string;
  ogImageUrl: string;
  defaultSeoTitle: Localized;
  defaultSeoDescription: Localized;
}

// Transcribed structurally from nutrition-client's numbers.ts, images.ts,
// and socialMediaLinks.tsx. Email/WhatsApp are dedicated schema fields here
// (phone/whatsappNumber/email), so they're intentionally not duplicated
// again inside socialLinks — only the actual platform links are.
const SITE_SETTINGS_SOURCE: SiteSettingsSource = {
  phone: "01155924548",
  whatsappNumber: "+201155924548",
  email: "omniaalnagy@gmail.com",
  socialLinks: [
    { platform: "Instagram", url: "https://www.instagram.com/dr.omnia.ahmed/", order: 0 },
    { platform: "Facebook", url: "https://www.facebook.com/profile.php?id=100078890377662", order: 1 },
    { platform: "LinkedIn", url: "https://www.linkedin.com/in/dr-omnia-ahmed-757a00328?", order: 2 },
  ],
  logoFile: "public/images/leftLogo.png",
  faviconFile: "src/app/favicon.ico",
  // Signed, expiring Facebook CDN URL from images.ts's Images.Image1 — not a
  // local file. Attempted via direct fetch below; skipped if it 404s/expired.
  ogImageUrl:
    "https://scontent.fcai22-4.fna.fbcdn.net/v/t39.30808-6/454674920_495016399804702_4274266052268464660_n.jpg",
  // No Arabic title exists anywhere in the source for the site metadata —
  // left empty rather than fabricated. The base `description` in
  // layout.tsx is Next.js's unfilled scaffold placeholder ("A brief
  // description of your website.") — not real content, so `en` is left
  // empty too; only the real Arabic OG description is migrated.
  defaultSeoTitle: { en: "Dr.Omnia Ahmed", ar: "" },
  defaultSeoDescription: { en: "", ar: "د/ أمنية أحمد أخصائية تغذية علاجية وسمنة ونحافة" },
};

async function migrateSiteSettings(): Promise<void> {
  const moduleReport = report.siteSettings;
  const current = (await apiRaw("/api/site-settings")) as {
    phone?: string;
    whatsappNumber?: string;
    email?: string;
    socialLinks: { platform: string; url: string; order: number }[];
    logo?: unknown;
    favicon?: unknown;
    ogImage?: unknown;
    defaultSeo: { title: Localized; description: Localized };
  };

  const payload: Record<string, unknown> = {};

  const phonePlan = planScalarField(moduleReport, "phone", current.phone, SITE_SETTINGS_SOURCE.phone, isEmptyString, (a, b) => a === b);
  if (phonePlan.include) payload.phone = phonePlan.value;

  const whatsappPlan = planScalarField(
    moduleReport,
    "whatsappNumber",
    current.whatsappNumber,
    SITE_SETTINGS_SOURCE.whatsappNumber,
    isEmptyString,
    (a, b) => a === b
  );
  if (whatsappPlan.include) payload.whatsappNumber = whatsappPlan.value;

  const emailPlan = planScalarField(moduleReport, "email", current.email, SITE_SETTINGS_SOURCE.email, isEmptyString, (a, b) => a === b);
  if (emailPlan.include) payload.email = emailPlan.value;

  const titlePlan = planScalarField(
    moduleReport,
    "defaultSeo.title",
    current.defaultSeo?.title,
    SITE_SETTINGS_SOURCE.defaultSeoTitle,
    isEmptyLocalized,
    localizedEqual
  );
  const descriptionPlan = planScalarField(
    moduleReport,
    "defaultSeo.description",
    current.defaultSeo?.description,
    SITE_SETTINGS_SOURCE.defaultSeoDescription,
    isEmptyLocalized,
    localizedEqual
  );
  if (titlePlan.include || descriptionPlan.include) {
    payload.defaultSeo = {
      title: titlePlan.include ? titlePlan.value : current.defaultSeo?.title,
      description: descriptionPlan.include ? descriptionPlan.value : current.defaultSeo?.description,
    };
  }

  // socialLinks: additive by platform name, never overwrites an existing link.
  const existingPlatforms = new Set((current.socialLinks ?? []).map((link) => link.platform.toLowerCase()));
  const linksToAdd = SITE_SETTINGS_SOURCE.socialLinks.filter((link) => !existingPlatforms.has(link.platform.toLowerCase()));
  for (const link of SITE_SETTINGS_SOURCE.socialLinks) {
    if (existingPlatforms.has(link.platform.toLowerCase())) moduleReport.matched.push(`socialLinks.${link.platform}`);
    else moduleReport.filled.push(`socialLinks.${link.platform}`);
  }
  if (linksToAdd.length > 0) {
    const nextOrder = (current.socialLinks ?? []).length;
    payload.socialLinks = [
      ...(current.socialLinks ?? []),
      ...linksToAdd.map((link, i) => ({ ...link, order: nextOrder + i })),
    ];
  }

  // Assets: only set if currently empty — never replace an existing image.
  const files: Record<string, { buffer: Buffer<ArrayBuffer>; filename: string; mime: string }> = {};

  if (current.logo) {
    moduleReport.assetsSkipped.push({ field: "logo", reason: "Already set — not replaced" });
  } else {
    const logoPath = path.join(NUTRITION_CLIENT_PATH, SITE_SETTINGS_SOURCE.logoFile);
    if (fs.existsSync(logoPath)) {
      files.logo = { buffer: fs.readFileSync(logoPath), filename: path.basename(logoPath), mime: "image/png" };
      moduleReport.assetsUploaded.push("logo");
    } else {
      moduleReport.invalid.push({ key: "logo", reason: `File missing on disk: ${logoPath}` });
    }
  }

  if (current.favicon) {
    moduleReport.assetsSkipped.push({ field: "favicon", reason: "Already set — not replaced" });
  } else {
    moduleReport.assetsSkipped.push({
      field: "favicon",
      reason: "Source is a .ico file; faviconImagePolicy only allows jpg/png/webp — convert to PNG and upload via the admin UI",
    });
  }

  if (current.ogImage) {
    moduleReport.assetsSkipped.push({ field: "ogImage", reason: "Already set — not replaced" });
  } else if (!DRY_RUN) {
    const buffer = await tryFetchExternalImage(SITE_SETTINGS_SOURCE.ogImageUrl);
    if (buffer) {
      files.ogImage = { buffer, filename: "og-image.jpg", mime: "image/jpeg" };
      moduleReport.assetsUploaded.push("ogImage");
    } else {
      moduleReport.invalid.push({ key: "ogImage", reason: "Source is an external, token-signed Facebook CDN URL that failed to fetch (likely expired) — upload a real image via the admin UI" });
    }
  } else {
    moduleReport.assetsSkipped.push({ field: "ogImage", reason: "[dry-run] would attempt to fetch the external Facebook CDN URL — not attempted in dry-run" });
  }

  console.log(`  fields to fill: ${moduleReport.filled.join(", ") || "(none)"}`);
  if (moduleReport.conflicts.length > 0) {
    console.log(`  CONFLICTS (left untouched): ${moduleReport.conflicts.map((c) => c.field).join(", ")}`);
  }

  if (Object.keys(payload).length === 0 && Object.keys(files).length === 0) {
    console.log("  nothing to write");
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] would PUT /api/site-settings with fields: ${Object.keys(payload).join(", ")}, assets: ${Object.keys(files).join(", ") || "(none)"}`);
    return;
  }

  await putMultipart("/api/site-settings", payload, files);
  console.log("  updated site settings");
}

// ---------------------------------------------------------------------------
// Doctor Profile
// ---------------------------------------------------------------------------

interface OrderedLocalized {
  text: Localized;
  order: number;
}

const DOCTOR_PROFILE_SOURCE = {
  name: { en: "Dr. Omnia Ahmed", ar: "د. أمنية أحمد" } as Localized,
  tagline: {
    en: "Dr. Omnia Ahmed - Clinical Nutrition Specialist",
    ar: "د. أمنية أحمد - أخصائية التغذية العلاجية والسمنة والنحافة",
  } as Localized,
  avatarFile: "public/images/personal.jpeg",
  avatarAlt: { en: "Dr. Omnia Ahmed", ar: "د. أمنية أحمد" } as Localized,
  bioParagraphs: [
    {
      en: "Want a diet plan that suits your lifestyle? I'm Dr. Omnia Ahmed, a Clinical Nutrition and Obesity Specialist, holding a Pharmacy Bachelor's degree from Assiut University and a Clinical Nutrition Diploma.",
      ar: "عايزه نظام غذائي مناسب لحياتك؟! أنا د. أمنية أحمد، أخصائية التغذية العلاجية والسمنة والنحافة، حاصلة علي بكالوريوس الصيدلة جامعة أسيوط، ودبلومة التغذية العلاجية والسمنة والنحافة جامعة أسيوط.",
    },
    {
      en: "I offer online therapeutic nutrition consultations, helping those suffering from obesity or underweight issues, and also provide nutrition for pregnant women, nursing mothers, children, and athletes.",
      ar: "بقدم متابعات واستشارات غذائية علاجية عبر الإنترنت، مخصصة لكل اللي بيعاني من مشاكل الوزن سواء السمنة أو النحافة، ولكل اللي عايز يحسن صحته العامة. وكمان بنقدم تغذية للحوامل والمرضعات والأطفال والرياضيين.",
    },
  ] as Localized[],
  programHeading: { en: "In the follow-up program with me, you'll get:", ar: "في برنامج المتابعة معايا هتحصل علي:" } as Localized,
  programHighlights: [
    { en: "✅ A personalized nutrition plan designed specifically for you.", ar: "✅ خطة تغذوية شخصية مصممة خصيصاً لك." },
    { en: "✅ Daily follow-up to ensure your commitment and success.", ar: "✅ متابعة يومية لضمان التزامك ونجاحك." },
    { en: "✅ Practical tips that fit your lifestyle.", ar: "✅ نصائح عملية تناسب نمط حياتك." },
    { en: "✅ Continuous support to achieve your health goals.", ar: "✅ دعم مستمر لتحقيق أهدافك الصحية." },
  ] as Localized[],
  whyChooseHeading: { en: "Why choose me?", ar: "ليه تختارني؟" } as Localized,
  whyChooseReasons: [
    { en: "Over 6 years of experience in pharmacy and medication fields.", ar: "خبرة في مجال الصيدلة والأدوية لأكثر من ٦ سنوات." },
    { en: "Over 5 years of experience and professionalism in providing nutritional consultations.", ar: "خبرة واحترافية في تقديم الاستشارات الغذائية لأكثر من خمس سنوات." },
    { en: "Precise and personalized follow-up for each case.", ar: "متابعة دقيقة وشخصية لكل حالة." },
    { en: "Continuous support and motivation to achieve your health goals.", ar: "دعم مستمر وتحفيز لتحقيق أهدافك الصحية." },
    { en: "Competitive prices and special offers.", ar: "أسعار تنافسية وعروض خاصة." },
  ] as Localized[],
  featuredInLabel: { en: "Featured In", ar: "متميز في" } as Localized,
  // English-only alt text in the source — no Arabic variant exists.
  gallery: [
    { file: "public/magazine/magazine1.jpeg", altTextEn: "Dr. Omnia in magazine 1" },
    { file: "public/magazine/magazine2.jpeg", altTextEn: "Dr. Omnia in magazine 2" },
    { file: "public/magazine/magazine3.jpeg", altTextEn: "Dr. Omnia in magazine 3" },
    { file: "public/magazine/magazine4.jpeg", altTextEn: "Dr. Omnia in magazine 4" },
    { file: "public/magazine/magazine5.jpeg", altTextEn: "Dr. Omnia in magazine 5" },
  ],
};

function planOrderedLocalizedList(
  moduleReport: ModuleReport,
  fieldPrefix: string,
  current: OrderedLocalized[] | undefined,
  source: Localized[]
): OrderedLocalized[] | undefined {
  const existingTexts = new Set((current ?? []).map((item) => item.text.en));
  const missing = source.filter((text) => !existingTexts.has(text.en));
  for (const text of source) {
    if (existingTexts.has(text.en)) moduleReport.matched.push(`${fieldPrefix}[${text.en.slice(0, 30)}]`);
    else moduleReport.filled.push(`${fieldPrefix}[${text.en.slice(0, 30)}]`);
  }
  if (missing.length === 0) return undefined;
  const nextOrder = (current ?? []).length;
  return [...(current ?? []), ...missing.map((text, i) => ({ text, order: nextOrder + i }))];
}

async function migrateDoctorProfile(): Promise<void> {
  const moduleReport = report.doctorProfile;
  const current = (await apiRaw("/api/doctor-profile")) as {
    name: Localized;
    tagline: Localized;
    avatar?: unknown;
    avatarAlt: Localized;
    bioSections: { heading?: Localized; body: Localized; order: number }[];
    programHeading: Localized;
    programHighlights: OrderedLocalized[];
    whyChooseHeading: Localized;
    whyChooseReasons: OrderedLocalized[];
    featuredInLabel: Localized;
    gallery: { id: string; altText: Localized }[];
  };

  const payload: Record<string, unknown> = {};

  const namePlan = planScalarField(moduleReport, "name", current.name, DOCTOR_PROFILE_SOURCE.name, isEmptyLocalized, localizedEqual);
  if (namePlan.include) payload.name = namePlan.value;

  const taglinePlan = planScalarField(moduleReport, "tagline", current.tagline, DOCTOR_PROFILE_SOURCE.tagline, isEmptyLocalized, localizedEqual);
  if (taglinePlan.include) payload.tagline = taglinePlan.value;

  const avatarAltPlan = planScalarField(moduleReport, "avatarAlt", current.avatarAlt, DOCTOR_PROFILE_SOURCE.avatarAlt, isEmptyLocalized, localizedEqual);
  if (avatarAltPlan.include) payload.avatarAlt = avatarAltPlan.value;

  const programHeadingPlan = planScalarField(
    moduleReport,
    "programHeading",
    current.programHeading,
    DOCTOR_PROFILE_SOURCE.programHeading,
    isEmptyLocalized,
    localizedEqual
  );
  if (programHeadingPlan.include) payload.programHeading = programHeadingPlan.value;

  const whyChooseHeadingPlan = planScalarField(
    moduleReport,
    "whyChooseHeading",
    current.whyChooseHeading,
    DOCTOR_PROFILE_SOURCE.whyChooseHeading,
    isEmptyLocalized,
    localizedEqual
  );
  if (whyChooseHeadingPlan.include) payload.whyChooseHeading = whyChooseHeadingPlan.value;

  const featuredInLabelPlan = planScalarField(
    moduleReport,
    "featuredInLabel",
    current.featuredInLabel,
    DOCTOR_PROFILE_SOURCE.featuredInLabel,
    isEmptyLocalized,
    localizedEqual
  );
  if (featuredInLabelPlan.include) payload.featuredInLabel = featuredInLabelPlan.value;

  // bioSections: dedup by body.en (bio paragraphs have no other natural key).
  const existingBodies = new Set((current.bioSections ?? []).map((section) => section.body.en));
  const missingBio = DOCTOR_PROFILE_SOURCE.bioParagraphs.filter((body) => !existingBodies.has(body.en));
  for (const body of DOCTOR_PROFILE_SOURCE.bioParagraphs) {
    if (existingBodies.has(body.en)) moduleReport.matched.push(`bioSections[${body.en.slice(0, 30)}]`);
    else moduleReport.filled.push(`bioSections[${body.en.slice(0, 30)}]`);
  }
  if (missingBio.length > 0) {
    const nextOrder = (current.bioSections ?? []).length;
    payload.bioSections = [
      ...(current.bioSections ?? []),
      ...missingBio.map((body, i) => ({ body, order: nextOrder + i })),
    ];
  }

  const programHighlights = planOrderedLocalizedList(moduleReport, "programHighlights", current.programHighlights, DOCTOR_PROFILE_SOURCE.programHighlights);
  if (programHighlights) payload.programHighlights = programHighlights;

  const whyChooseReasons = planOrderedLocalizedList(moduleReport, "whyChooseReasons", current.whyChooseReasons, DOCTOR_PROFILE_SOURCE.whyChooseReasons);
  if (whyChooseReasons) payload.whyChooseReasons = whyChooseReasons;

  const files: Record<string, { buffer: Buffer<ArrayBuffer>; filename: string; mime: string }> = {};
  if (current.avatar) {
    moduleReport.assetsSkipped.push({ field: "avatar", reason: "Already set — not replaced" });
  } else {
    const avatarPath = path.join(NUTRITION_CLIENT_PATH, DOCTOR_PROFILE_SOURCE.avatarFile);
    if (fs.existsSync(avatarPath)) {
      files.avatar = { buffer: fs.readFileSync(avatarPath), filename: path.basename(avatarPath), mime: "image/jpeg" };
      moduleReport.assetsUploaded.push("avatar");
    } else {
      moduleReport.invalid.push({ key: "avatar", reason: `File missing on disk: ${avatarPath}` });
    }
  }

  if (moduleReport.conflicts.length > 0) {
    console.log(`  CONFLICTS (left untouched): ${moduleReport.conflicts.map((c) => c.field).join(", ")}`);
  }

  if (Object.keys(payload).length > 0 || Object.keys(files).length > 0) {
    if (DRY_RUN) {
      console.log(`  [dry-run] would PUT /api/doctor-profile with fields: ${Object.keys(payload).join(", ")}, assets: ${Object.keys(files).join(", ") || "(none)"}`);
    } else {
      await putMultipart("/api/doctor-profile", payload, files);
      console.log("  updated doctor profile");
    }
  } else {
    console.log("  nothing to write to the main profile document");
  }

  // Gallery — one POST per missing photo (no bulk endpoint exists), dedup by altText.en.
  const existingAltTexts = new Set((current.gallery ?? []).map((item) => item.altText.en));
  for (const photo of DOCTOR_PROFILE_SOURCE.gallery) {
    if (existingAltTexts.has(photo.altTextEn)) {
      moduleReport.matched.push(`gallery[${photo.altTextEn}]`);
      continue;
    }

    const photoPath = path.join(NUTRITION_CLIENT_PATH, photo.file);
    if (!fs.existsSync(photoPath)) {
      moduleReport.invalid.push({ key: `gallery ${photo.file}`, reason: `File missing on disk: ${photoPath}` });
      continue;
    }

    moduleReport.filled.push(`gallery[${photo.altTextEn}]`);
    moduleReport.assetsUploaded.push(`gallery/${path.basename(photo.file)}`);

    if (DRY_RUN) {
      console.log(`  [dry-run] would add gallery photo: ${photo.altTextEn} (${path.basename(photo.file)})`);
      continue;
    }

    const galleryPayload = { altText: { en: photo.altTextEn, ar: "" } };
    const buffer = fs.readFileSync(photoPath);
    await postMultipart("/api/doctor-profile/gallery", galleryPayload, {
      image: { buffer, filename: path.basename(photo.file), mime: "image/jpeg" },
    });
    console.log(`  added gallery photo: ${photo.altTextEn}`);
  }
}

// ---------------------------------------------------------------------------
// Packages Page Settings (no assets on this module at all)
// ---------------------------------------------------------------------------

const PACKAGES_PAGE_SETTINGS_SOURCE = {
  title: { en: "Choose the Package", ar: "اختر الباقة" } as Localized,
  titleAccent: { en: "That's Right for You", ar: "المناسبة لك" } as Localized,
  subtitle: { en: "MEMBERSHIPS & PRICING", ar: "العضويات والأسعار" } as Localized,
  durationLabels: {
    month: { en: "1 MONTH", ar: "1 شهر" } as Localized,
    quarter: { en: "2 MONTHS", ar: "2 أشهر" } as Localized,
    half: { en: "3 MONTHS", ar: "3 أشهر" } as Localized,
  },
  subscribeButtonLabel: { en: "Subscribe Now", ar: "اشترك الآن" } as Localized,
};

async function migratePackagesPageSettings(): Promise<void> {
  const moduleReport = report.packagesPageSettings;
  const current = (await apiRaw("/api/packages-page-settings")) as {
    title: Localized;
    titleAccent: Localized;
    subtitle: Localized;
    durationLabels: { month: Localized; quarter: Localized; half: Localized };
    subscribeButtonLabel: Localized;
  };

  const payload: Record<string, unknown> = {};

  const titlePlan = planScalarField(moduleReport, "title", current.title, PACKAGES_PAGE_SETTINGS_SOURCE.title, isEmptyLocalized, localizedEqual);
  if (titlePlan.include) payload.title = titlePlan.value;

  const titleAccentPlan = planScalarField(
    moduleReport,
    "titleAccent",
    current.titleAccent,
    PACKAGES_PAGE_SETTINGS_SOURCE.titleAccent,
    isEmptyLocalized,
    localizedEqual
  );
  if (titleAccentPlan.include) payload.titleAccent = titleAccentPlan.value;

  const subtitlePlan = planScalarField(moduleReport, "subtitle", current.subtitle, PACKAGES_PAGE_SETTINGS_SOURCE.subtitle, isEmptyLocalized, localizedEqual);
  if (subtitlePlan.include) payload.subtitle = subtitlePlan.value;

  const subscribeButtonLabelPlan = planScalarField(
    moduleReport,
    "subscribeButtonLabel",
    current.subscribeButtonLabel,
    PACKAGES_PAGE_SETTINGS_SOURCE.subscribeButtonLabel,
    isEmptyLocalized,
    localizedEqual
  );
  if (subscribeButtonLabelPlan.include) payload.subscribeButtonLabel = subscribeButtonLabelPlan.value;

  const monthPlan = planScalarField(
    moduleReport,
    "durationLabels.month",
    current.durationLabels?.month,
    PACKAGES_PAGE_SETTINGS_SOURCE.durationLabels.month,
    isEmptyLocalized,
    localizedEqual
  );
  const quarterPlan = planScalarField(
    moduleReport,
    "durationLabels.quarter",
    current.durationLabels?.quarter,
    PACKAGES_PAGE_SETTINGS_SOURCE.durationLabels.quarter,
    isEmptyLocalized,
    localizedEqual
  );
  const halfPlan = planScalarField(
    moduleReport,
    "durationLabels.half",
    current.durationLabels?.half,
    PACKAGES_PAGE_SETTINGS_SOURCE.durationLabels.half,
    isEmptyLocalized,
    localizedEqual
  );
  if (monthPlan.include || quarterPlan.include || halfPlan.include) {
    payload.durationLabels = {
      month: monthPlan.include ? monthPlan.value : current.durationLabels?.month,
      quarter: quarterPlan.include ? quarterPlan.value : current.durationLabels?.quarter,
      half: halfPlan.include ? halfPlan.value : current.durationLabels?.half,
    };
  }

  if (moduleReport.conflicts.length > 0) {
    console.log(`  CONFLICTS (left untouched): ${moduleReport.conflicts.map((c) => c.field).join(", ")}`);
  }

  if (Object.keys(payload).length === 0) {
    console.log("  nothing to write");
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] would PUT /api/packages-page-settings with fields: ${Object.keys(payload).join(", ")}`);
    return;
  }

  await apiJson("/api/packages-page-settings", "PUT", payload);
  console.log("  updated packages page settings");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Migration source: ${NUTRITION_CLIENT_PATH}`);
  console.log(`Migration target: ${BASE_URL}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN — no writes will be performed" : "LIVE — will create real records and upload real assets"}`);

  await login();

  console.log("\n--- Site Settings ---");
  await migrateSiteSettings();

  console.log("\n--- Doctor Profile ---");
  await migrateDoctorProfile();

  console.log("\n--- Packages Page Settings ---");
  await migratePackagesPageSettings();

  console.log("\n=== Migration report ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
