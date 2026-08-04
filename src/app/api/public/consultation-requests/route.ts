import { createConsultationRequest } from "src/server/consultation-requests/create-consultation-request";
import { CreateConsultationRequestDto } from "src/server/consultation-requests/dto/create-consultation-request.dto";
import { createPostRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/**
 * The only public write endpoint in this app. Every consultation/contact/
 * package-inquiry form on nutrition-client submits here — see
 * CreateConsultationRequestDto's `intent` field for how one endpoint
 * serves all three instead of three near-identical routes.
 *
 * Anti-spam, layered (all before any database write):
 *  1. Honeypot (`website` field, real visitors never fill it in).
 *  2. Minimum time-to-submit (`formRenderedAt`, rejects faster-than-human
 *     submissions).
 *  3. A per-IP sliding-window rate limit (see simple-rate-limiter.ts).
 * All three fail *silently* — the response is `{ success: true }`
 * regardless, so a bot gets no signal about which check caught it.
 *
 * No CAPTCHA for v1 — disproportionate cost (a third-party script + a
 * consent/perf hit) unless real abuse shows up post-launch.
 */
export const POST = createPostRoute({
  body: CreateConsultationRequestDto,
  auth: false,
  handler: async ({ body, request }) => {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    return createConsultationRequest(body, ip);
  },
});
