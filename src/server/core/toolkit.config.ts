import { configureNextBackendToolkit } from "@kira-joo/backend-toolkit-next";
import { resolveUser } from "src/server/core/auth/resolve-user";
import { connectToDatabase } from "src/server/core/db/connect";
import { publishRevalidation } from "src/server/core/revalidation/publish-revalidation";
// Side-effect import: registers RoleModel/PermissionModel via createMongoModel()
// within THIS module graph. Next.js dev mode compiles instrumentation.ts as a
// separate bundle from route handlers, so the model registration it does
// isn't visible here — every route already imports this file (via
// route-factories.ts), so this is what actually guarantees UserSchema's
// @Relation(() => RoleSchema) can resolve at request time.
import "src/server/core/authorization/role.model";

configureNextBackendToolkit({
  database: { connect: connectToDatabase },
  jwt: { secret: process.env.JWT_SECRET! },
  auth: { resolveUser },
  // Every route's `revalidateTags` option (see src/server/core/route-factories.ts)
  // resolves to this — createRoute calls it once, after a successful write,
  // with the deduplicated tag list. Best-effort, timeout-bounded; see
  // publish-revalidation.ts's own doc comment.
  cache: { publishRevalidation },
});
