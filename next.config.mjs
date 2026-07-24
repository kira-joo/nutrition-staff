/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Required on Next 14.x for src/instrumentation.ts to run at all —
    // on by default only from Next 15 onward.
    instrumentationHook: true,
  },
};

export default nextConfig;
