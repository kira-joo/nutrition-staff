// Next.js startup hook (requires experimental.instrumentationHook on Next 14.x;
// see next.config.mjs). Runs once per server instance at boot.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { connectToDatabase } = await import("@/server/db/connect");
  const { syncPermissions } = await import("@kira-joo/backend-toolkit-mongoose");
  const { PermissionModel } = await import("@/server/authorization/role.model");
  const { authorization } = await import("@/server/authorization/authorization-registry");

  await connectToDatabase();
  const result = await syncPermissions({ model: PermissionModel, definitions: authorization.definitions });
  console.log(`[permissions] synced: ${result.created.length} created, ${result.skipped.length} already existed`);
}
