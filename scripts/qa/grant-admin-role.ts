// Grants the "admin" role directly in the database to an existing user,
// identified by email — bypassing the normal Users-management UI.
//
// Why this exists: a fresh signup (see create-test-session.js) always gets
// `roles: []` by design ("secure by default"), which isn't enough to view
// permission-gated pages (Users, Recipes, Clients, etc.). This is the
// fastest way to make a throwaway test account usable for that, without
// touching any other user's data.
//
// Usage: node --env-file=.env --import tsx scripts/qa/grant-admin-role.ts <email>
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { RoleModel } from "../../src/server/core/authorization/role.model";
import { UserModel } from "../../src/server/users/user.schema";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: grant-admin-role.ts <email>");

  await connectToDatabase();

  const adminRole = await RoleModel.findOne({ name: "admin" }).lean();
  if (!adminRole) throw new Error('No role named "admin" found — run `npm run seed:roles` first.');

  const result = await UserModel.updateOne({ email }, { $set: { roles: [adminRole._id] } });
  console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
