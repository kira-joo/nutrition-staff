import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /*
   * This repository sits beside sibling repositories with no shared lockfile,
   * and Turbopack's default root inference walks up until it finds one —
   * landing outside the repo. Pinning it keeps builds deterministic.
   */
  turbopack: { root: projectRoot },
  /*
   * puppeteer (used by @kira-joo/backend-toolkit-next's renderHtmlToPdf)
   * talks to Chromium over a real WebSocket via `ws`. Declaring these
   * external keeps Next from bundling them at all — they are `require()`d
   * directly at runtime instead — which is what avoids `ws`'s optional
   * native `bufferutil` addon resolving to a broken stub inside the bundled
   * route handler ("bufferUtil.mask is not a function"). This is the
   * top-level, bundler-agnostic replacement for the old
   * `experimental.serverComponentsExternalPackages` plus a manual
   * `webpack.externals` push — Turbopack (the Next 16 default) has no
   * `webpack()` hook to push into.
   */
  serverExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium", "chromium-bidi", "ws"],
  /*
   * `next dev` otherwise appends a block to CLAUDE.md on every run, and
   * re-appends it when removed.
   *
   * CLAUDE.md is this repository's working contract — the file every other
   * instruction defers to. Its value depends on nothing writing to it but us,
   * and a tool that edits it produces either a permanently dirty tree or a
   * generated section inside an authored document. The guidance it inserts is
   * accurate; that is not the objection.
   */
  agentRules: false,
};

export default nextConfig;
