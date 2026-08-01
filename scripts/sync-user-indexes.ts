/**
 * ONE-TIME INDEX-REPAIR UTILITY
 * ==========================================
 * Mongoose's default autoIndex behavior only *adds* indexes declared on a
 * schema that don't yet exist in MongoDB — it does not alter or replace an
 * existing index whose key pattern already matches but whose options (e.g.
 * `sparse`) differ. `email`'s index predates the sparse-unique change (it
 * used to be plain `unique: true`), so after that change, any environment
 * whose database already had that old index keeps enforcing the *old*,
 * stricter behavior indefinitely — silently defeating the whole point of
 * making `email` optional (two Users without an email would still collide).
 * `phone` needed no such fix since it's a brand-new index with no prior
 * definition to conflict with.
 *
 * `Model.syncIndexes()` (unlike plain autoIndex) reconciles the database's
 * actual indexes with the schema's current declarations — dropping ones
 * that no longer match and creating the correct ones. Run this once after
 * deploying the `email`/`phone` sparse-unique schema change to any
 * environment whose database predates it (already run against the local
 * dev database as part of this verification pass).
 *
 * Run:
 *   node --env-file=.env --import tsx scripts/sync-user-indexes.ts
 */
import { connectToDatabase } from "../src/server/core/db/connect";
import { UserModel } from "../src/server/users/user.schema";

async function main() {
  await connectToDatabase();

  const before = await UserModel.collection.indexes();
  console.log("Indexes before sync:", JSON.stringify(before, null, 2));

  const result = await UserModel.syncIndexes();
  console.log("syncIndexes result (dropped index names, if any):", result);

  const after = await UserModel.collection.indexes();
  console.log("Indexes after sync:", JSON.stringify(after, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Index sync failed:", error);
    process.exit(1);
  });
