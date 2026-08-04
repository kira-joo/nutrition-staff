const REVALIDATION_TIMEOUT_MS = 2500;

/**
 * Tells nutrition-client's `/api/revalidate` route to bust the given Next.js
 * Data Cache tags, right after a mutating route here successfully commits a
 * write — the on-demand counterpart to the per-domain fallback intervals
 * nutrition-client's `cache-policy.ts` already applies.
 *
 * Awaited, not fire-and-forget — genuine detached fire-and-forget work is
 * unsafe on serverless (the function can freeze/terminate the instant the
 * response is sent, with no guarantee an unawaited promise ever runs) — but
 * bounded by a hard timeout via `AbortController`, and every failure is
 * swallowed rather than rethrown: a slow or unreachable nutrition-client
 * must never fail the write that triggered this call. Worst case,
 * nutrition-client's own fallback `revalidate` interval (see its
 * cache-policy.ts) catches up within its normal window.
 *
 * A no-op (not an error) when `NUTRITION_CLIENT_URL`/`REVALIDATE_SECRET`
 * aren't configured in this environment — e.g. local development against a
 * nutrition-client instance you don't have running.
 */
export async function publishRevalidation(tags: string[]): Promise<void> {
  if (tags.length === 0) return;

  const nutritionClientUrl = process.env.NUTRITION_CLIENT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!nutritionClientUrl || !secret) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVALIDATION_TIMEOUT_MS);

  try {
    await fetch(new URL("/api/revalidate", nutritionClientUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags }),
      signal: controller.signal,
    });
  } catch {
    // Best-effort — see the doc comment above.
  } finally {
    clearTimeout(timeout);
  }
}
