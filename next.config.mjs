/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Required on Next 14.x for src/instrumentation.ts to run at all —
    // on by default only from Next 15 onward.
    instrumentationHook: true,
    // puppeteer (used by @kira-joo/backend-toolkit-next's renderHtmlToPdf)
    // talks to Chromium over a real WebSocket via `ws`. Left to webpack's
    // default bundling, `ws`'s optional native `bufferutil` addon resolves
    // to a broken stub inside the route-handler bundle ("bufferUtil.mask is
    // not a function") — excluding it from bundling and letting Node
    // `require()` it directly at runtime avoids that entirely.
    serverComponentsExternalPackages: ["puppeteer", "puppeteer-core", "@sparticuz/chromium", "chromium-bidi", "ws"],
  },
  // Belt-and-suspenders alongside serverComponentsExternalPackages above:
  // that experimental flag doesn't reliably stop deeply-nested transitive
  // requires (like `ws`'s own optional-native-binding loader) from still
  // being bundled — a direct webpack externals push does.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("puppeteer", "puppeteer-core", "@sparticuz/chromium", "chromium-bidi", "ws");
    }
    return config;
  },
};

export default nextConfig;
