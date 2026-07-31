/**
 * ONE-TIME CLIENT-CONTENT MIGRATION UTILITY
 * ==========================================
 * Migrates the real hardcoded content currently shipped in the
 * `nutrition-client` reference app into `nutrition-staff`'s CMS, through the
 * real authenticated HTTP API (never touches MongoDB directly).
 *
 * Scope (per the approved migration task): FAQ Sections/Items, Recipe
 * Categories, Recipe Food Groups, Recipes (incl. Cloudinary image upload),
 * and Packages. Plus one additional demo Review, added per explicit
 * follow-up request mid-migration — sourced from nutrition-client's real
 * `src/constant/reviews.ts` (not fabricated), the first entry, deterministic
 * and idempotent exactly like every other module here. No other module is
 * touched.
 *
 * Idempotent: every create is preceded by a lookup against the real list
 * endpoint, matched on the same deterministic field the target schema
 * actually offers (Package has a real `key`; every other module here has no
 * slug field, so the match falls back to the natural unique field that
 * already exists — `title.en` / `question.en` scoped to its section). A
 * rerun with nothing changed makes zero write calls.
 *
 * Run:
 *   node --env-file=.env --import tsx scripts/migrate-client-content.ts
 *
 * Env overrides (all optional):
 *   NUTRITION_STAFF_BASE_URL   default http://localhost:3000
 *   NUTRITION_CLIENT_PATH      default ../nutrition-client (sibling checkout)
 *   MIGRATION_EMAIL            default ava.thompson@example.com (seeded admin)
 *   MIGRATION_PASSWORD         default Passw0rd! (seeded dev-only password)
 */
import fs from "node:fs";
import path from "node:path";
import { ContentStatus, IconKey, PackageVariant } from "../src/common/enums";

const BASE_URL = process.env.NUTRITION_STAFF_BASE_URL ?? "http://localhost:3000";
const NUTRITION_CLIENT_PATH = process.env.NUTRITION_CLIENT_PATH ?? path.resolve(__dirname, "../../nutrition-client");
const MIGRATION_EMAIL = process.env.MIGRATION_EMAIL ?? "ava.thompson@example.com";
const MIGRATION_PASSWORD = process.env.MIGRATION_PASSWORD ?? "Passw0rd!";

interface Localized {
  en: string;
  ar: string;
}

const report = {
  faqSections: { source: 0, created: 0, matched: 0 },
  faqItems: { source: 0, created: 0, matched: 0 },
  recipeCategories: { source: 0, created: 0, matched: 0 },
  recipeFoodGroups: { source: 0, created: 0, matched: 0 },
  recipes: { source: 0, created: 0, matched: 0, skipped: [] as { key: string; reason: string }[] },
  packages: { source: 0, created: 0, matched: 0 },
  reviews: { source: 0, created: 0, matched: 0 },
  draftRecords: [] as string[],
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

// ---------------------------------------------------------------------------
// Source loading (real nutrition-client files — never mutated)
// ---------------------------------------------------------------------------

function readClientJson(relPath: string): Record<string, unknown> {
  const fullPath = path.join(NUTRITION_CLIENT_PATH, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Expected nutrition-client source file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, "utf-8"));
}

const faqEn = readClientJson("src/i18n/locales/en/faq.json") as Record<string, string>;
const faqAr = readClientJson("src/i18n/locales/ar/faq.json") as Record<string, string>;
const recipesEn = readClientJson("src/i18n/locales/en/recipes.json") as Record<string, unknown>;
const recipesAr = readClientJson("src/i18n/locales/ar/recipes.json") as Record<string, unknown>;
const packagesEn = readClientJson("src/i18n/locales/en/packages.json") as Record<string, unknown>;
const packagesAr = readClientJson("src/i18n/locales/ar/packages.json") as Record<string, unknown>;

// Structural metadata (id -> image/category/foodGroup) transcribed directly
// from src/constant/recipes.tsx's RecipesList array. Only structural values
// live here (filenames and category/food-group key strings) — every piece
// of actual bilingual text below is read live from recipes.json above, never
// retyped, so there is no transcription risk for the content itself.
const RECIPE_META: { key: string; image: string; category: string; foodGroup: string[] }[] = [
  { key: "healthy_koshary", image: "healthy_koshary.jpg", category: "30 Minutes or Less", foodGroup: ["Grains", "Legumes", "Vegetables"] },
  { key: "molokhia_with_grilled_chicken", image: "molokhia_with_grilled_chicken.jpg", category: "30 Minutes or Less", foodGroup: ["Legumes", "Vegetables"] },
  { key: "stuffed_zucchini_light", image: "stuffed_zucchini_light.jpg", category: "30 Minutes or Less", foodGroup: ["Vegetables", "Grains"] },
  { key: "bamia_with_olive_oil", image: "bamia_with_olive_oil.jpg", category: "30 Minutes or Less", foodGroup: ["Vegetables", "Protein"] },
  { key: "grilled_fish_with_tahini", image: "grilled_fish_with_tahini.jpg", category: "30 Minutes or Less", foodGroup: ["Protein", "Vegetables"] },
  { key: "light_lentil_soup", image: "light_lentil_soup.jpg", category: "30 Minutes or Less", foodGroup: ["Legumes", "Vegetables"] },
  { key: "light_potato_tagine", image: "light_potato_tagine.jpg", category: "30 Minutes or Less, Kid-Friendly", foodGroup: ["Vegetables", "Protein"] },
  { key: "diet_grape_leaves", image: "diet_grape_leaves.jpg", category: "30 Minutes or Less", foodGroup: ["Vegetables", "Grains"] },
  { key: "diet_tuna_salad", image: "diet_tuna_salad.jpg", category: "30 Minutes or Less", foodGroup: ["Protein", "Vegetables"] },
  { key: "diet_vegetable_omelette", image: "diet_vegetable_omelette.jpg", category: "30 Minutes or Less", foodGroup: ["Protein", "Vegetables"] },
  { key: "diet_baked_potatoes", image: "diet_baked_potatoes.jpg", category: "30 Minutes or Less", foodGroup: ["Vegetables", "Carbohydrates"] },
  { key: "diet_banana_oat_smoothie", image: "diet_banana_oat_smoothie.jpg", category: "30 Minutes or Less", foodGroup: ["Fruits", "Dairy", "Grains"] },
  { key: "diet_cottage_cheese_avocado_sandwich", image: "diet_cottage_cheese_avocado_sandwich.jpg", category: "30 Minutes or Less", foodGroup: ["Dairy", "Vegetables", "Grains"] },
  { key: "diet_yogurt_cucumber_salad", image: "diet_yogurt_cucumber_salad.jpg", category: "30 Minutes or Less", foodGroup: ["Dairy", "Vegetables"] },
  { key: "diet_grilled_chicken_lemon", image: "diet_grilled_chicken_lemon.jpg", category: "30 Minutes or Less", foodGroup: ["Protein", "Vegetables", "Grains"] },
];

// ---------------------------------------------------------------------------
// Step 1: Recipe Categories + Recipe Food Groups (relations must exist first)
// ---------------------------------------------------------------------------

async function ensureByTitleEn(
  endpoint: string,
  title: Localized,
  extra: Record<string, unknown>,
  existingCache: Map<string, { _id: string; title: Localized }>,
  counters: { created: number; matched: number }
): Promise<string> {
  const found = existingCache.get(title.en);
  if (found) {
    counters.matched++;
    return found._id;
  }
  const created = await apiJson<{ _id: string; title: Localized }>(endpoint, "POST", { title, status: ContentStatus.PUBLISHED, ...extra });
  existingCache.set(title.en, created);
  counters.created++;
  return created._id;
}

async function migrateRecipeCategoriesAndFoodGroups(): Promise<{
  categoryIdByKey: Map<string, string>;
  foodGroupIdByKey: Map<string, string>;
}> {
  const categoryKeys = [...new Set(RECIPE_META.map((r) => r.category))];
  const foodGroupKeys = [...new Set(RECIPE_META.flatMap((r) => r.foodGroup))];
  report.recipeCategories.source = categoryKeys.length;
  report.recipeFoodGroups.source = foodGroupKeys.length;

  const existingCategories = await listAll<{ _id: string; title: Localized }>("/api/recipe-categories");
  const categoryCache = new Map(existingCategories.map((c) => [c.title.en, c]));
  const categoryIdByKey = new Map<string, string>();
  for (const key of categoryKeys) {
    const localized: Localized = { en: recipesEn[key] as string, ar: recipesAr[key] as string };
    if (!localized.en || !localized.ar) throw new Error(`Missing bilingual label for recipe category "${key}"`);
    const id = await ensureByTitleEn("/api/recipe-categories", localized, {}, categoryCache, report.recipeCategories);
    categoryIdByKey.set(key, id);
  }

  const existingFoodGroups = await listAll<{ _id: string; title: Localized }>("/api/recipe-food-groups");
  const foodGroupCache = new Map(existingFoodGroups.map((f) => [f.title.en, f]));
  const foodGroupIdByKey = new Map<string, string>();
  for (const key of foodGroupKeys) {
    const localized: Localized = { en: recipesEn[key] as string, ar: recipesAr[key] as string };
    if (!localized.en || !localized.ar) throw new Error(`Missing bilingual label for recipe food group "${key}"`);
    const id = await ensureByTitleEn("/api/recipe-food-groups", localized, {}, foodGroupCache, report.recipeFoodGroups);
    foodGroupIdByKey.set(key, id);
  }

  return { categoryIdByKey, foodGroupIdByKey };
}

// ---------------------------------------------------------------------------
// Step 2: Recipes (multipart, real Cloudinary upload via the real endpoint)
// ---------------------------------------------------------------------------

function toLocalizedLines(en: string[], ar: string[]): Localized[] {
  return en.map((line, i) => ({ en: line, ar: ar[i] }));
}

async function migrateRecipes(categoryIdByKey: Map<string, string>, foodGroupIdByKey: Map<string, string>): Promise<void> {
  const recipesEnMap = recipesEn.recipes as Record<string, any>;
  const recipesArMap = recipesAr.recipes as Record<string, any>;
  report.recipes.source = RECIPE_META.length;

  const existing = await listAll<{ _id: string; title: Localized }>("/api/recipes");
  const existingByTitleEn = new Map(existing.map((r) => [r.title.en, r]));

  for (const meta of RECIPE_META) {
    const en = recipesEnMap[meta.key];
    const ar = recipesArMap[meta.key];
    if (!en || !ar) {
      report.recipes.skipped.push({ key: meta.key, reason: "Missing EN or AR entry in recipes.json" });
      continue;
    }

    const title: Localized = { en: en.title, ar: ar.title };
    if (existingByTitleEn.has(title.en)) {
      report.recipes.matched++;
      continue;
    }

    const imagePath = path.join(NUTRITION_CLIENT_PATH, "public/recipes", meta.image);
    if (!fs.existsSync(imagePath)) {
      report.recipes.skipped.push({ key: meta.key, reason: `Referenced image missing on disk: ${imagePath}` });
      continue;
    }

    const categoryId = categoryIdByKey.get(meta.category);
    const foodGroupIds = meta.foodGroup.map((fg) => foodGroupIdByKey.get(fg));
    if (!categoryId || foodGroupIds.some((id) => !id)) {
      report.recipes.skipped.push({ key: meta.key, reason: "Unresolved category/food-group relation id" });
      continue;
    }

    const payload = {
      title,
      description: { en: en.description, ar: ar.description },
      category: categoryId,
      foodGroups: foodGroupIds,
      ingredients: toLocalizedLines(en.ingredients ?? [], ar.ingredients ?? []),
      instructions: toLocalizedLines(en.instructions ?? [], ar.instructions ?? []),
      prepTime: en.prepTime && ar.prepTime ? { en: en.prepTime, ar: ar.prepTime } : undefined,
      cookTime: en.cookTime && ar.cookTime ? { en: en.cookTime, ar: ar.cookTime } : undefined,
      servings: en.servings && ar.servings ? { en: en.servings, ar: ar.servings } : undefined,
      status: ContentStatus.PUBLISHED,
    };

    const form = new FormData();
    form.set("payload", JSON.stringify(payload));
    const buffer = fs.readFileSync(imagePath);
    form.set("image", new Blob([buffer], { type: "image/jpeg" }), meta.image);

    const res = await fetch(`${BASE_URL}/api/recipes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Failed to create recipe "${meta.key}": ${res.status} ${JSON.stringify(body)}`);
    }
    report.recipes.created++;
    console.log(`  created recipe: ${title.en}`);
  }
}

// ---------------------------------------------------------------------------
// Step 3: FAQ Sections + Items
// ---------------------------------------------------------------------------

function parseFaqSource(en: Record<string, string>, ar: Record<string, string>) {
  const sectionNumbers = [
    ...new Set(
      Object.keys(en)
        .map((k) => k.match(/^section(\d+)\.title$/)?.[1])
        .filter((n): n is string => Boolean(n))
    ),
  ].sort((a, b) => Number(a) - Number(b));

  return sectionNumbers.map((num, sectionIndex) => {
    const title: Localized = { en: en[`section${num}.title`], ar: ar[`section${num}.title`] };
    const questionNumbers = [
      ...new Set(
        Object.keys(en)
          .map((k) => k.match(new RegExp(`^section${num}\\.q(\\d+)\\.question$`))?.[1])
          .filter((n): n is string => Boolean(n))
      ),
    ].sort((a, b) => Number(a) - Number(b));

    const items = questionNumbers.map((qNum, itemIndex) => ({
      question: { en: en[`section${num}.q${qNum}.question`], ar: ar[`section${num}.q${qNum}.question`] } as Localized,
      answer: { en: en[`section${num}.q${qNum}.answer`], ar: ar[`section${num}.q${qNum}.answer`] } as Localized,
      order: itemIndex,
    }));

    return { title, order: sectionIndex, items };
  });
}

async function migrateFaq(): Promise<void> {
  const sections = parseFaqSource(faqEn, faqAr);
  report.faqSections.source = sections.length;
  report.faqItems.source = sections.reduce((sum, s) => sum + s.items.length, 0);

  const existingSections = await listAll<{ _id: string; title: Localized }>("/api/faq-sections");
  const sectionCache = new Map(existingSections.map((s) => [s.title.en, s]));

  for (const section of sections) {
    if (!section.title.en || !section.title.ar) throw new Error(`FAQ section missing a translation: ${JSON.stringify(section.title)}`);

    let sectionId: string;
    const cached = sectionCache.get(section.title.en);
    if (cached) {
      sectionId = cached._id;
      report.faqSections.matched++;
    } else {
      const created = await apiJson<{ _id: string; title: Localized }>("/api/faq-sections", "POST", {
        title: section.title,
        order: section.order,
        status: ContentStatus.PUBLISHED,
      });
      sectionId = created._id;
      sectionCache.set(section.title.en, created);
      report.faqSections.created++;
      console.log(`  created FAQ section: ${section.title.en}`);
    }

    const existingItems = await listAll<{ _id: string; question: Localized; section: string | { _id: string } }>(
      `/api/faq-items?section=${sectionId}`
    );
    const itemCache = new Map(existingItems.map((i) => [i.question.en, i]));

    for (const item of section.items) {
      if (!item.question.en || !item.question.ar || !item.answer.en || !item.answer.ar) {
        throw new Error(`FAQ item missing a translation under section "${section.title.en}": ${JSON.stringify(item.question)}`);
      }
      if (itemCache.has(item.question.en)) {
        report.faqItems.matched++;
        continue;
      }
      await apiJson("/api/faq-items", "POST", {
        section: sectionId,
        question: item.question,
        answer: item.answer,
        order: item.order,
        status: ContentStatus.PUBLISHED,
      });
      report.faqItems.created++;
      console.log(`    created FAQ item: ${item.question.en}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Step 4: Packages
// ---------------------------------------------------------------------------

// No hex-color-to-PackageVariant mapping exists anywhere in nutrition-staff
// yet (PackageVariant is a bare, unmapped styling enum — see
// package-variant.enum.ts) — assigned in tier order (Basic/Standard/Premium
// -> Primary/Secondary/Tertiary) as a disclosed, reasoned default, not
// extracted from real data. Icon mapping IS grounded: the enum's own doc
// comment records the exact Zap/Package/Diamond <-> nutrition-client mapping.
const PACKAGE_DEFS = [
  { key: "basic", sourceKey: "Basic", variant: PackageVariant.PRIMARY, icon: IconKey.ZAP, order: 0 },
  { key: "standard", sourceKey: "Standard", variant: PackageVariant.SECONDARY, icon: IconKey.PACKAGE, order: 1 },
  { key: "premium", sourceKey: "Premium", variant: PackageVariant.TERTIARY, icon: IconKey.DIAMOND, order: 2 },
];

function parsePricingTier(en: Record<string, string>, ar: Record<string, string>, duration: string) {
  // EN copy displays a "$" glyph, AR copy displays "ج" (EGP) for the
  // identical numeric amount (e.g. EN "$600" / AR "٦٠٠ ج") — the app's
  // currency is globally EGP-only (see Currency enum), so this is treated
  // as a display-only artifact of the old client, not two real prices. The
  // digits themselves already agree between locales; parse from the AR
  // string as source of truth since it uses the app's real currency.
  const raw = ar[duration] as string;
  const westernDigits = raw.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const parsed = Number(westernDigits.replace(/[^\d.]/g, ""));
  if (Number.isNaN(parsed)) throw new Error(`Could not parse price "${raw}" for duration "${duration}"`);
  return parsed;
}

async function migratePackages(): Promise<void> {
  const packagesEnMap = packagesEn.packages as Record<string, any>;
  const packagesArMap = packagesAr.packages as Record<string, any>;
  report.packages.source = PACKAGE_DEFS.length;

  const existing = await listAll<{ _id: string; key: string }>("/api/packages");
  const existingByKey = new Set(existing.map((p) => p.key));

  for (const def of PACKAGE_DEFS) {
    if (existingByKey.has(def.key)) {
      report.packages.matched++;
      continue;
    }

    const en = packagesEnMap[def.sourceKey];
    const ar = packagesArMap[def.sourceKey];
    if (!en || !ar) throw new Error(`Missing package source data for "${def.sourceKey}"`);

    const name: Localized = { en: en.category, ar: ar.category };
    const tag: Localized | undefined = en.tag && ar.tag ? { en: en.tag, ar: ar.tag } : undefined;
    const followUpLabel: Localized = { en: en["Follow-up"], ar: ar["Follow-up"] };

    const detailNumbers = [
      ...new Set(
        Object.keys(en)
          .map((k) => k.match(/^detail(\d+)$/)?.[1])
          .filter((n): n is string => Boolean(n))
      ),
    ].sort((a, b) => Number(a) - Number(b));
    const details: Localized[] = detailNumbers.map((n) => ({ en: en[`detail${n}`], ar: ar[`detail${n}`] }));

    const durations = ["month", "quarter", "half"] as const;
    const pricingTiers = Object.fromEntries(
      durations.map((d) => [
        d,
        {
          originalPrice: parsePricingTier(en.originalPrice, ar.originalPrice, d),
          price: parsePricingTier(en.price, ar.price, d),
        },
      ])
    );

    await apiJson("/api/packages", "POST", {
      key: def.key,
      name,
      tag,
      popular: def.sourceKey === "Standard",
      variant: def.variant,
      icon: def.icon,
      followUpLabel,
      pricingTiers,
      details,
      order: def.order,
      status: ContentStatus.PUBLISHED,
    });
    report.packages.created++;
    console.log(`  created package: ${name.en} (${def.key})`);
  }
}

// ---------------------------------------------------------------------------
// Step 5: one demo Review (added per explicit follow-up request)
// ---------------------------------------------------------------------------

// Transcribed structurally from nutrition-client/src/constant/reviews.ts
// (id 1, the first entry) — real content, not invented. That file has no
// English translation for any review (every entry is an Arabic-only
// Facebook testimonial quote), so this is imported as Draft with `en: ""`
// per the migration rule: never invent a translation to force a publish.
const DEMO_REVIEW = {
  contentAr:
    "حرفيا احنا عملنا إنجاز من 43 كيلو وجرثومة معدة ل 53 زياده صحية بدون دهون ولا شكل جسم مش صحي بفضل الله ♥️",
  sourceUrl: "https://www.facebook.com/share/p/5wQbix2K6zmaPXp8/",
  image: "image1.jpg",
};

async function migrateDemoReview(): Promise<void> {
  report.reviews.source = 1;

  const existing = await listAll<{ _id: string; sourceUrl?: string }>("/api/reviews");
  if (existing.some((r) => r.sourceUrl === DEMO_REVIEW.sourceUrl)) {
    report.reviews.matched++;
    return;
  }

  const imagePath = path.join(NUTRITION_CLIENT_PATH, "public/images", DEMO_REVIEW.image);
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Demo review image missing on disk: ${imagePath}`);
  }

  // English translation genuinely doesn't exist in the source — Draft, not
  // Published, and `en: ""` rather than a fabricated/copied value.
  const payload = {
    content: { ar: DEMO_REVIEW.contentAr, en: "" },
    sourceUrl: DEMO_REVIEW.sourceUrl,
    featured: false,
    status: ContentStatus.DRAFT,
  };

  const form = new FormData();
  form.set("payload", JSON.stringify(payload));
  const buffer = fs.readFileSync(imagePath);
  form.set("image", new Blob([buffer], { type: "image/jpeg" }), DEMO_REVIEW.image);

  const res = await fetch(`${BASE_URL}/api/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create demo review: ${res.status} ${JSON.stringify(body)}`);
  }
  report.reviews.created++;
  report.draftRecords.push(`Review ${body._id} (sourceUrl: ${DEMO_REVIEW.sourceUrl}) — no English translation exists in source`);
  console.log(`  created demo review (Draft, no EN translation in source): ${body._id}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Migration source: ${NUTRITION_CLIENT_PATH}`);
  console.log(`Migration target: ${BASE_URL}`);

  await login();

  console.log("\n--- Recipe Categories + Food Groups ---");
  const { categoryIdByKey, foodGroupIdByKey } = await migrateRecipeCategoriesAndFoodGroups();

  console.log("\n--- Recipes ---");
  await migrateRecipes(categoryIdByKey, foodGroupIdByKey);

  console.log("\n--- FAQ ---");
  await migrateFaq();

  console.log("\n--- Packages ---");
  await migratePackages();

  console.log("\n--- Demo Review ---");
  await migrateDemoReview();

  console.log("\n=== Migration report ===");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
