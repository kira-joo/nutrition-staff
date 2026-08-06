const REVALIDATION_TIMEOUT_MS = 2500;

/**
 * Tells nutrition-client's `/api/revalidate` route to bust the given Next.js
 * Data Cache tags — registered as `cache.publishRevalidation` in
 * `toolkit.config.ts`, so `createRoute` (from `@kira-joo/backend-toolkit-next`
 * ^0.4.0) calls this automatically for any route declaring `revalidateTags`,
 * once per request, right after that route's handler commits a write. The
 * on-demand counterpart to the per-domain fallback intervals
 * nutrition-client's `cache-policy.ts` already applies.
 *
 * Bounded by a hard timeout via `AbortController` — genuine detached
 * fire-and-forget work is unsafe on serverless (the function can
 * freeze/terminate the instant the response is sent, with no guarantee an
 * unawaited promise ever runs), so this is awaited, not fire-and-forget,
 * but capped so a slow nutrition-client can't hang the request indefinitely.
 *
 * Throws (rather than swallowing) on timeout, a non-2xx response, or a
 * network failure — `createRoute`'s `revalidateTags` machinery is what
 * actually makes this best-effort: it catches and logs any rejection from
 * this function and never lets it fail the HTTP response. Thrown messages
 * deliberately never include `REVALIDATE_SECRET` or any request header.
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

  let response: Response;
  try {
    response = await fetch(new URL("/api/revalidate", nutritionClientUrl), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tags }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`nutrition-client revalidation timed out after ${REVALIDATION_TIMEOUT_MS}ms`);
    }
    throw new Error(`nutrition-client revalidation request failed: ${error instanceof Error ? error.message : "unknown network error"}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`nutrition-client revalidation responded with ${response.status}`);
  }
}
