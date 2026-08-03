// Hard-deletes a single user by email — the cleanup counterpart to
// create-test-session.js, so throwaway QA accounts don't accumulate.
//
// Deliberately narrow (one exact email at a time, no pattern matching) so
// it can't accidentally take out more than intended — use
// find-users-by-pattern.ts first to see exactly what would be affected.
//
// Usage: node --env-file=.env --import tsx scripts/qa/delete-user-by-email.ts <email>
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { UserModel } from "../../src/server/users/user.schema";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Usage: delete-user-by-email.ts <email>");

  await connectToDatabase();

  const result = await UserModel.deleteOne({ email });
  console.log(`Deleted: ${result.deletedCount}`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
