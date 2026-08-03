// Real-browser regression check for page-level horizontal/vertical
// overflow on mobile — the class of bug where the visible card/table looks
// fine but the whole document can still be scrolled into blank space past
// it (see the 2026-08-03 fix in @kira-joo/frontend-toolkit-tailwind for the
// root cause: absolutely-positioned descendants with no positioned
// ancestor escaping scroll/clip containers all the way to the document
// root).
//
// This measures actual DOM layout (document.documentElement.scrollWidth/
// scrollHeight vs window.innerWidth/innerHeight) in a real Chromium
// instance across representative phone/tablet/desktop widths — not just
// class names or compiled CSS, since this bug only reproduces with real
// layout and populated data.
//
// Prerequisites:
//   - The app must already be running (e.g. `npm run start -- -p 4123`).
//   - You need an authenticated session token: run create-test-session.js
//     (+ grant-admin-role.ts if the page requires permissions) and pass the
//     token via the ACCESS_TOKEN env var.
//
// Usage:
//   ACCESS_TOKEN=<token> node scripts/qa/check-mobile-overflow.js [clientId] [baseUrl]
//
// `clientId` is optional — pass an existing ClientProfile _id to also check
// the per-client form pages (profile edit, add measurement, add
// assessment). Without it, only the top-level list/dashboard pages run.
//
// Exits non-zero and prints a summary of every failing page/viewport if
// any page overflows its viewport.
const puppeteer = require("puppeteer");

const BASE = process.argv[3] || "http://localhost:4123";
const CLIENT_ID = process.argv[2];
const TOKEN = process.env.ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Set ACCESS_TOKEN to an authenticated session token (see create-test-session.js).");
  process.exit(1);
}

const VIEWPORTS = [
  { name: "320w", width: 320, height: 700 },
  { name: "360w", width: 360, height: 740 },
  { name: "375w", width: 375, height: 812 },
  { name: "390w", width: 390, height: 844 },
  { name: "tablet-768w", width: 768, height: 1024 },
  { name: "desktop-1440w", width: 1440, height: 900 },
];

const PAGES = [
  { name: "recipes-list", path: "/recipes" },
  { name: "users-list", path: "/users" },
  { name: "clients-list", path: "/clients" },
  { name: "dashboard", path: "/dashboard" },
  ...(CLIENT_ID
    ? [
        { name: "client-profile-edit", path: `/clients/${CLIENT_ID}/profile` },
        { name: "add-measurement-form", path: `/clients/${CLIENT_ID}/measurements/create` },
        { name: "add-assessment-form", path: `/clients/${CLIENT_ID}/assessments/create` },
      ]
    : []),
];

async function measure(page) {
  return page.evaluate(() => {
    const docEl = document.documentElement;
    const tableWrapper = document.querySelector(".overflow-x-auto");

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      docScrollWidth: docEl.scrollWidth,
      docScrollHeight: docEl.scrollHeight,
      // A wide table is *expected* to still scroll within its own wrapper —
      // this isn't a failure, it's the one place local horizontal scroll
      // should remain possible.
      tableWrapperOverflows: tableWrapper ? tableWrapper.scrollWidth > tableWrapper.clientWidth : null,
    };
  });
}

async function main() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await page.evaluate((token) => localStorage.setItem("nutrition_staff_access_token", token), TOKEN);

  const results = [];

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height });
    for (const p of PAGES) {
      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: "networkidle0", timeout: 20000 });
        await new Promise((r) => setTimeout(r, 500));
        const m = await measure(page);
        results.push({
          viewport: vp.name,
          page: p.name,
          ...m,
          horizontalOverflow: m.docScrollWidth > m.innerWidth,
          verticalOverflow: m.docScrollHeight > m.innerHeight,
        });
      } catch (e) {
        results.push({ viewport: vp.name, page: p.name, error: e.message });
      }
    }
  }

  await browser.close();

  const failures = results.filter((r) => r.error || r.horizontalOverflow || r.verticalOverflow);

  for (const r of results) {
    const status = r.error ? `ERROR: ${r.error}` : r.horizontalOverflow || r.verticalOverflow ? "OVERFLOW" : "ok";
    console.log(
      `${r.viewport.padEnd(14)} ${r.page.padEnd(20)} | W ${r.innerWidth ?? "-"} -> ${r.docScrollWidth ?? "-"}` +
        ` | H ${r.innerHeight ?? "-"} -> ${r.docScrollHeight ?? "-"} | ${status}`
    );
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} page/viewport combination(s) overflow the document — see OVERFLOW rows above.`);
    process.exit(1);
  }

  console.log("\nAll pages stayed within their viewport at every checked width.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
