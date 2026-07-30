import { createCloudinaryProvider } from "@kira-joo/backend-toolkit-cloudinary";

// Credentials are read once, from environment variables only — the provider
// itself never hardcodes or embeds them (see @kira-joo/backend-toolkit-cloudinary's
// own docs). This app is the only place that knows these values exist.
export const assetProvider = createCloudinaryProvider({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
});
