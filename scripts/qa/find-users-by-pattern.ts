// Lists user emails matching a regular expression — mainly for finding
// leftover throwaway test/QA accounts (e.g. everything created by
// create-test-session.js) before deleting them with delete-user-by-email.ts.
//
// Usage: node --env-file=.env --import tsx scripts/qa/find-users-by-pattern.ts <regex>
//   node --env-file=.env --import tsx scripts/qa/find-users-by-pattern.ts "qa-test-"
import mongoose from "mongoose";
import { connectToDatabase } from "../../src/server/core/db/connect";
import { UserModel } from "../../src/server/users/user.schema";

async function main() {
  const pattern = process.argv[2];
  if (!pattern) throw new Error("Usage: find-users-by-pattern.ts <regex>");

  await connectToDatabase();

  const users = await UserModel.find({ email: new RegExp(pattern) }).lean();
  console.log(users.map((user) => user.email));

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
