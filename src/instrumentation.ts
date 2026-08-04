// reflect-metadata is a global polyfill (it mutates the ambient `Reflect`
// object), so class-validator/class-transformer decorators only work once
// SOMETHING has imported it in the current process. Individual DTO files
// each self-import it, but that only helps once one of them has actually
// been loaded — a public route whose query DTO happens to be the first
// decorated class touched in a fresh process (very plausible on a
// serverless cold start, and reproduced locally by hitting
// /api/public/recipes|reviews|videos first) crashed with
// "TypeError: Reflect.getMetadata is not a function" before this line
// existed. Importing it here, in the one module Next.js guarantees runs
// before the server accepts any request, removes the dependency on
// incidental import ordering entirely.
import "reflect-metadata";

// Next.js startup hook (requires experimental.instrumentationHook on Next 14.x;
// see next.config.mjs). Runs once per server instance at boot.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { DateTimeConfig } = await import("@kira-joo/toolkit-common");
  const { APP_TIMEZONE } = await import("src/common/config/app-timezone.constant");
  // Every server-side day-based comparison (today's/overdue follow-ups,
  // dashboard bucket boundaries, date-range resolution) defaults to this —
  // set once here so no server module needs to pass a timezone manually.
  DateTimeConfig.timeZone = APP_TIMEZONE;

  const { connectToDatabase } = await import("src/server/core/db/connect");
  const { syncPermissions } = await import("@kira-joo/backend-toolkit-mongoose");
  const { PermissionModel } = await import("src/server/core/authorization/role.model");
  const { authorization } = await import("src/server/core/authorization/authorization-registry");

  await connectToDatabase();
  const result = await syncPermissions({ model: PermissionModel, definitions: authorization.definitions });
  console.log(`[permissions] synced: ${result.created.length} created, ${result.skipped.length} already existed`);
}
