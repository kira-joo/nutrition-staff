// Creates a throwaway, fully-authenticated browser session via the real
// public signup flow, and prints its email + access token as JSON.
//
// Why this exists: the seeded demo users (scripts/seed-users.ts) are only
// as good as their password hash staying compatible with the current
// hashing algorithm. When that drifts (e.g. mid-migration) every seeded
// login starts 401ing, which otherwise blocks any UI/manual verification
// pass entirely. Signing up a fresh user always produces a hash compatible
// with whatever hashPassword() currently does, so this is a reliable
// fallback path to get *a* logged-in session for manual/scripted checks.
//
// A fresh signup gets `roles: []` (no permissions) — pair this with
// grant-admin-role.js to make the resulting account useful for viewing
// permission-gated pages (Users, Recipes, Clients, etc.).
//
// Usage: node scripts/qa/create-test-session.js [baseUrl]
//   node scripts/qa/create-test-session.js > session.json
const puppeteer = require("puppeteer");

const BASE = process.argv[2] || "http://localhost:4123";

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0" });

  const email = `qa-test-${Date.now()}@example.com`;
  await page.type('input[name="name"]', "QA Test User");
  await page.type('input[name="email"]', email);
  await page.type('input[name="password"]', "Passw0rd!123");
  await page.type('input[name="confirmPassword"]', "Passw0rd!123");
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {}),
  ]);

  const token = await page.evaluate(() => localStorage.getItem("nutrition_staff_access_token"));
  await browser.close();

  if (!token) {
    console.error("Signup did not produce an access token — check the signup form still has this shape.");
    process.exit(1);
  }

  console.log(JSON.stringify({ email, token }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
