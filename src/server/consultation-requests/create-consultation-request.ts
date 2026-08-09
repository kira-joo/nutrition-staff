import { ConflictError } from "@kira-joo/backend-toolkit-core";
import { ClientSource } from "src/common/enums";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { createClient } from "src/server/clients/create-client";
import { attachClientProfile } from "src/server/clients/attach-client-profile";
import { consultationRequestRepository } from "src/server/consultation-requests/consultation-requests.repository";
import { CreateConsultationRequestDto } from "src/server/consultation-requests/dto/create-consultation-request.dto";
import { checkRateLimit } from "src/server/core/rate-limit/simple-rate-limiter";

const MIN_SUBMIT_TIME_MS = 2000;
const RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };

function buildTags(body: CreateConsultationRequestDto): string[] {
  return [body.intent, ...(body.packageKey ? [`package:${body.packageKey}`] : [])];
}

/**
 * The public lead-capture entry point (`POST /api/public/consultation-
 * requests`). Every real path returns `{ success: true }` — an
 * unauthenticated caller must never learn whether a phone/email already
 * exists in the CRM (that's exactly the information createClient's 409
 * gives to *staff*, who are allowed to know it). See
 * docs/architecture.md-equivalent comment in the route file for the
 * anti-spam layers this sits behind.
 *
 * Also writes one `ConsultationRequest` row per real submission (after the
 * honeypot/timing/rate-limit gates, so spam never reaches the log) —
 * investigated first: a `ClientProfile` only ever holds the latest
 * `sourceNote` and a tag union, so a returning lead's second submission
 * previously left its own `message` nowhere. This row is that missing
 * history, independent of whichever create/merge branch below resolved
 * the shared `User`/`ClientProfile` identity — that CRM behavior is
 * unchanged.
 */
export async function createConsultationRequest(body: CreateConsultationRequestDto, ip: string): Promise<{ success: true }> {
  // Honeypot: a real visitor never fills this field in. Silently accept
  // without doing anything — never reveal to a bot that it was caught.
  if (body.website) {
    return { success: true };
  }

  if (body.formRenderedAt) {
    const renderedAt = Number(body.formRenderedAt);
    if (Number.isFinite(renderedAt) && Date.now() - renderedAt < MIN_SUBMIT_TIME_MS) {
      return { success: true };
    }
  }

  const { allowed } = checkRateLimit(`consultation-requests:${ip}`, RATE_LIMIT);
  if (!allowed) {
    // Same success response even when throttled — a real error here would
    // tell a scripted caller exactly when to back off and retry.
    return { success: true };
  }

  const tags = buildTags(body);
  let userId: string | undefined;
  let clientProfileId: string | undefined;

  try {
    const created = await createClient({
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: ClientSource.WEBSITE,
      sourceNote: body.message,
    });
    await clientProfileRepository.update({ where: { _id: created._id } }, { tags });
    userId = String(created.userId);
    clientProfileId = String(created._id);
  } catch (error) {
    if (!(error instanceof ConflictError)) {
      throw error;
    }

    const details = error.details as
      | { existingUserId?: string; hasClientProfile?: boolean; clientProfileId?: string }
      | undefined;

    if (details?.hasClientProfile && details.clientProfileId) {
      // Already a known lead/client — append the new tag rather than
      // overwrite whatever staff has already recorded on this profile.
      const existing = await clientProfileRepository.findOne({ where: { _id: details.clientProfileId }, skipThrowError: true });
      const mergedTags = Array.from(new Set([...(existing?.tags ?? []), ...tags]));
      await clientProfileRepository.update({ where: { _id: details.clientProfileId } }, { tags: mergedTags });
      userId = details.existingUserId;
      clientProfileId = details.clientProfileId;
    } else if (details?.existingUserId) {
      // A User exists but has no ClientProfile yet (e.g. a signed-up
      // account) — attach one rather than creating a duplicate identity.
      const attached = await attachClientProfile(details.existingUserId, { source: ClientSource.WEBSITE, sourceNote: body.message });
      await clientProfileRepository.update({ where: { _id: attached._id } }, { tags });
      userId = details.existingUserId;
      clientProfileId = String(attached._id);
    }
    // Any other conflict shape: still respond success — never surface
    // CRM-internal state to a public caller. No userId resolved means no
    // ConsultationRequest row either; there's nothing to link it to.
  }

  if (userId) {
    await consultationRequestRepository.save({
      name: body.name,
      phone: body.phone,
      email: body.email,
      intent: body.intent,
      packageKey: body.packageKey,
      message: body.message,
      userId,
      clientProfileId,
      ip,
    });
  }

  return { success: true };
}
