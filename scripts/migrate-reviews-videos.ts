/**
 * REVIEWS + VIDEOS CONTENT MIGRATION
 * ==================================
 * Migrates the real hardcoded Reviews and Videos content currently shipped
 * in the `nutrition-client` reference app into `nutrition-staff`'s CMS,
 * through the real authenticated HTTP API (never touches MongoDB directly)
 * — same approach as `scripts/migrate-client-content.ts` (recipes/FAQ/
 * packages/one demo review), kept as a separate script rather than
 * extending that one so this pass can be reviewed/dry-run independently
 * without touching an already-completed, working migration.
 *
 * Source (real, transcribed, never fabricated):
 *   nutrition-client/src/constant/reviews.ts   — 7 reviews, Arabic-only
 *     (no English translation exists in source for any of them)
 *   nutrition-client/src/constant/videos.ts    — 4 videos (local mp4 +
 *     external Facebook reel URL)
 *   nutrition-client/src/i18n/locales/{ar,en}/home.json `videos` object
 *     — the only place video titles exist (videos.ts itself has none)
 *
 * Known source-data bug (not invented, preserved deliberately): videos.ts's
 * 4th entry has `id: 3` (duplicate of the 3rd entry) instead of `4`, and
 * the *same* externalUrl as the 3rd entry — but `video4.mp4` is a real,
 * distinct file, and the i18n dictionaries have a real, otherwise-orphaned
 * "4": "Lunchbox"/"لانش بوكس" title clearly meant for it. This script
 * assigns video4.mp4 the corrected id 4 and its real Lunchbox title, and
 * preserves the shared externalUrl exactly as the source has it (no
 * fabricated distinct URL) — see the videos dedup key below for how this
 * is kept idempotent despite the shared URL.
 *
 * Fields intentionally left unset (real schema fields with no real source
 * data — not fabricated to fill them in): Review.authorName/authorLabel.
 * nutrition-client only ever displays a synthesized `Client ${id}` label at
 * render time, which is not stored/real author data.
 *
 * Idempotency / dedup keys:
 *   Reviews — `sourceUrl` (the review's real Facebook post URL; unique per
 *     entry in the source data). Matches the precedent already set by
 *     migrate-client-content.ts's one existing demo review.
 *   Videos  — `externalUrl` + `title.en` together. `externalUrl` alone
 *     collides for the video3/video4 pair (see the bug note above), but
 *     their English titles ("Healthy Breakfast" vs "Lunchbox") differ and
 *     are stable across runs, so the combination is a genuinely
 *     deterministic, collision-free match key without inventing a new field.
 *
 * Run (dry-run first, per the approved migration plan):
 *   node --env-file=.env --import tsx scripts/migrate-reviews-videos.ts --dry-run
 *   node --env-file=.env --import tsx scripts/migrate-reviews-videos.ts
 *
 * Env overrides (all optional, same convention as migrate-client-content.ts):
 *   NUTRITION_STAFF_BASE_URL   default http://localhost:3000
 *   NUTRITION_CLIENT_PATH      default ../nutrition-client (sibling checkout)
 *   MIGRATION_EMAIL            default ava.thompson@example.com (seeded admin)
 *   MIGRATION_PASSWORD         default Passw0rd! (seeded dev-only password)
 */
import fs from "node:fs";
import path from "node:path";
import { ContentStatus } from "../src/common/enums";

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
  source: number;
  created: number;
  matched: number;
  assetUploads: number;
  invalid: { key: string; reason: string }[];
}

function emptyModuleReport(): ModuleReport {
  return { source: 0, created: 0, matched: 0, assetUploads: 0, invalid: [] };
}

const report = {
  mode: DRY_RUN ? "dry-run" : "live",
  reviews: emptyModuleReport(),
  videos: emptyModuleReport(),
  draftRecords: [] as string[],
};

// ---------------------------------------------------------------------------
// HTTP + auth (same helpers as migrate-client-content.ts)
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

async function listAll<T>(pathName: string): Promise<T[]> {
  const result = (await apiRaw(`${pathName}${pathName.includes("?") ? "&" : "?"}limit=100`)) as { data: T[] };
  return result.data;
}

async function login(): Promise<void> {
  const result = await apiJson<{ accessToken: string }>("/api/auth/login", "POST", {
    email: MIGRATION_EMAIL,
    password: MIGRATION_PASSWORD,
  });
  accessToken = result.accessToken;
  console.log(`Authenticated as ${MIGRATION_EMAIL}`);
}

/** POSTs multipart form data — a real network write, skipped entirely in dry-run mode (no Cloudinary upload, no DB write). */
async function postMultipart(pathName: string, form: FormData): Promise<{ _id: string }> {
  if (DRY_RUN) return { _id: "(dry-run — not created)" };

  const res = await fetch(`${BASE_URL}${pathName}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`POST ${pathName} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// ---------------------------------------------------------------------------
// Reviews — real content transcribed from nutrition-client/src/constant/reviews.ts
// ---------------------------------------------------------------------------

interface SourceReview {
  id: number;
  image: string;
  contentAr: string;
  sourceUrl: string;
}

const SOURCE_REVIEWS: SourceReview[] = [
  {
    id: 1,
    image: "image1.jpg",
    contentAr: "حرفيا احنا عملنا إنجاز من 43 كيلو وجرثومة معدة ل 53 زياده صحية بدون دهون ولا شكل جسم مش صحي بفضل الله ♥️",
    sourceUrl: "https://www.facebook.com/share/p/5wQbix2K6zmaPXp8/",
  },
  {
    id: 2,
    image: "image2.jpg",
    contentAr: "أهل ليبيا الكرام شرفتوني وسعيدة بمتابعتكم ♥️",
    sourceUrl: "https://www.facebook.com/share/p/Aqx21b2xyW3XGfGT/",
  },
  {
    id: 3,
    image: "image3.jpg",
    contentAr: "نصايحنا بس بتنزل ٣ كيلو تخيلوا البرنامج بقي 😍😂♥️  وكان فضل الله عليك عظيما ♥️",
    sourceUrl: "https://www.facebook.com/share/p/QhzqD2sF9F943Cs8/",
  },
  {
    id: 4,
    image: "image4.jpg",
    contentAr:
      "جماعة انتوا تعرفوا أننا بنتابع تغذية رياضيين ولا ولا 😀   كمان عندنا خدمة تقديم الاستشارات التليفونية لو بالفعل عندك برنامج بس محتاج استشارات طارئة",
    sourceUrl: "https://www.facebook.com/share/p/NvCSR42cKSkbLgQT/",
  },
  {
    id: 5,
    image: "image5.jpg",
    contentAr: "بدأنا من اسبوع وبفضل الله في تحسن ملحوظ 😍♥️\nمبسوطة بأنجازها ومحاولات التزامها 🥰",
    sourceUrl: "https://www.facebook.com/share/p/1Eieic1rRu/",
  },
  {
    id: 6,
    image: "image6.jpg",
    contentAr: "وكان فضل الله عليك عظيما ♥️\nمبسوطة بتواصل اخواتنا ف كل البلاد العربية الشقيقة ويارب دايما عند حسن ظنكم ♥️",
    sourceUrl: "https://www.facebook.com/share/p/17ZCHEdraj/",
  },
  {
    id: 7,
    image: "image7.jpg",
    contentAr:
      "دا ريفيو سريع ف نص المتابعة بعد ما حققنا ١٠ كيلو تقريبا ف شهر ونص ولسة مكملين واكيد هيكون في ريفيو تفصيلي بعد ما نوصل للتارجت بإذن الله 💪",
    sourceUrl: "https://www.facebook.com/share/p/17VSkmNCWw/",
  },
];

async function migrateReviews(): Promise<void> {
  report.reviews.source = SOURCE_REVIEWS.length;

  const existing = await listAll<{ _id: string; sourceUrl?: string }>("/api/reviews");
  const existingBySourceUrl = new Set(existing.map((r) => r.sourceUrl).filter(Boolean));

  for (const review of SOURCE_REVIEWS) {
    if (existingBySourceUrl.has(review.sourceUrl)) {
      report.reviews.matched++;
      continue;
    }

    const imagePath = path.join(NUTRITION_CLIENT_PATH, "public/images", review.image);
    if (!fs.existsSync(imagePath)) {
      report.reviews.invalid.push({ key: `review ${review.id}`, reason: `Referenced image missing on disk: ${imagePath}` });
      continue;
    }

    // No English translation exists in the source for any review — Draft,
    // not Published, and `en: ""` rather than a fabricated/copied value
    // (same rule migrate-client-content.ts's demo review already follows).
    const payload = {
      content: { ar: review.contentAr, en: "" },
      sourceUrl: review.sourceUrl,
      featured: false,
      status: ContentStatus.DRAFT,
    };

    report.reviews.assetUploads++;

    if (DRY_RUN) {
      console.log(`  [dry-run] would create review ${review.id} (Draft, sourceUrl: ${review.sourceUrl}, image: ${review.image})`);
      report.reviews.created++;
      continue;
    }

    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    const buffer = fs.readFileSync(imagePath);
    form.set("image", new Blob([buffer], { type: "image/jpeg" }), review.image);

    const created = await postMultipart("/api/reviews", form);
    report.reviews.created++;
    report.draftRecords.push(`Review ${created._id} (sourceUrl: ${review.sourceUrl}) — no English translation exists in source`);
    console.log(`  created review ${review.id}: ${created._id}`);
  }
}

// ---------------------------------------------------------------------------
// Videos — real content transcribed from nutrition-client/src/constant/videos.ts
// + nutrition-client/src/i18n/locales/{ar,en}/home.json `videos` object
// ---------------------------------------------------------------------------

interface SourceVideo {
  id: number;
  file: string;
  externalUrl: string;
  title: Localized;
}

const SOURCE_VIDEOS: SourceVideo[] = [
  { id: 1, file: "video1.mp4", externalUrl: "https://www.facebook.com/reel/1597595514516227", title: { en: "Light Dinner", ar: "عشاء خفيف" } },
  { id: 2, file: "video2.mp4", externalUrl: "https://www.facebook.com/reel/1886147435145097/", title: { en: "Recipes Without Bread", ar: "وصفات بدون عيش" } },
  { id: 3, file: "video3.mp4", externalUrl: "https://www.facebook.com/reel/514983797787103/", title: { en: "Healthy Breakfast", ar: "فطار صحي" } },
  // Source id is a duplicate "3" (copy-paste bug — see the header comment);
  // corrected to 4 here, matching the otherwise-orphaned i18n "Lunchbox"
  // title and the genuinely distinct video4.mp4 file. externalUrl is left
  // exactly as the source has it (identical to video 3) — not invented.
  { id: 4, file: "video4.mp4", externalUrl: "https://www.facebook.com/reel/514983797787103/", title: { en: "Lunchbox", ar: "لانش بوكس" } },
];

async function migrateVideos(): Promise<void> {
  report.videos.source = SOURCE_VIDEOS.length;

  const existing = await listAll<{ _id: string; externalUrl?: string; title: Localized }>("/api/videos");
  // externalUrl alone collides for the video3/video4 pair — title.en disambiguates.
  const existingKeys = new Set(existing.map((v) => `${v.externalUrl ?? ""}::${v.title?.en ?? ""}`));

  for (const video of SOURCE_VIDEOS) {
    const key = `${video.externalUrl}::${video.title.en}`;
    if (existingKeys.has(key)) {
      report.videos.matched++;
      continue;
    }

    const videoPath = path.join(NUTRITION_CLIENT_PATH, "public/videos", video.file);
    if (!fs.existsSync(videoPath)) {
      report.videos.invalid.push({ key: `video ${video.id}`, reason: `Referenced video file missing on disk: ${videoPath}` });
      continue;
    }

    // Both locales are real (from home.json) — Published, not Draft.
    const payload = {
      title: video.title,
      externalUrl: video.externalUrl,
      status: ContentStatus.PUBLISHED,
    };

    report.videos.assetUploads++;

    if (DRY_RUN) {
      console.log(`  [dry-run] would create video ${video.id} (Published, "${video.title.en}", file: ${video.file})`);
      report.videos.created++;
      continue;
    }

    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    const buffer = fs.readFileSync(videoPath);
    form.set("video", new Blob([buffer], { type: "video/mp4" }), video.file);

    const created = await postMultipart("/api/videos", form);
    report.videos.created++;
    console.log(`  created video ${video.id} ("${video.title.en}"): ${created._id}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Migration source: ${NUTRITION_CLIENT_PATH}`);
  console.log(`Migration target: ${BASE_URL}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN — no writes will be performed" : "LIVE — will create real records and upload real assets"}`);

  await login();

  console.log("\n--- Reviews ---");
  await migrateReviews();

  console.log("\n--- Videos ---");
  await migrateVideos();

  console.log("\n=== Migration report ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
