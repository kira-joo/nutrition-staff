import { connectToDatabase } from "@/server/db/connect";
import { resolveUser } from "@/server/auth/resolve-user";
import { configureNextBackendToolkit } from "@kira-joo/backend-toolkit-next";
// Side-effect import: registers RoleModel/PermissionModel via createMongoModel()
// within THIS module graph. Next.js dev mode compiles instrumentation.ts as a
// separate bundle from route handlers, so the model registration it does
// isn't visible here — every route already imports this file (via
// route-factories.ts), so this is what actually guarantees UserSchema's
// @Relation(() => RoleSchema) can resolve at request time.
import "@/server/authorization/role.model";

configureNextBackendToolkit({
  database: { connect: connectToDatabase },
  jwt: { secret: process.env.JWT_SECRET! },
  auth: { resolveUser },
});
