/**
 * ONE-TIME STAFF-PROFILE MIGRATION UTILITY
 * ==========================================
 * `salary`/`joinedAt` used to live directly on `User` (a staff-only-shaped
 * pair of fields). They now live on the new, independent `StaffProfile`
 * (see `src/server/staff/staff-profile.schema.ts`) — `User` is the general
 * identity/account record for everyone, not a staff-only record.
 *
 * Unlike `migrate-client-content.ts` (which deliberately goes through the
 * real authenticated HTTP API to respect that app's own content-validation
 * rules when importing brand-new external content), this migration reads
 * and writes MongoDB directly. That's intentional here, not a shortcut:
 * this is an internal, same-app, one-time data-*shape* migration between
 * two of the app's own collections, and there is no HTTP endpoint that
 * could expose the legacy `salary`/`joinedAt` values anymore — they've been
 * removed from `UserSchema`/`CreateUserDto`/`UpdateUserDto` entirely, so the
 * only place those values still exist is whatever's physically stored in
 * already-existing `users` documents from before this change. Reads go
 * through the raw MongoDB collection (bypassing `UserModel`) specifically
 * so this works regardless of any Mongoose schema-cast/strict-mode
 * behavior around fields no longer declared on the schema.
 *
 * Idempotent: skips any User that already has a StaffProfile (via the
 * unique `userId` index), and only touches Users whose raw document still
 * has a `salary` or `joinedAt` value. A rerun after the first successful
 * pass does nothing.
 *
 * Run:
 *   node --env-file=.env --import tsx scripts/migrate-staff-profiles.ts
 */
import { connectToDatabase } from "../src/server/core/db/connect";
import { StaffProfileModel } from "../src/server/staff/staff-profile.schema";
import { UserModel } from "../src/server/users/user.schema";

interface LegacyUserDoc {
  _id: unknown;
  name: string;
  salary?: number;
  joinedAt?: string;
}

async function main() {
  await connectToDatabase();

  const db = UserModel.collection;
  const legacyUsers = (await db
    .find({ $or: [{ salary: { $exists: true } }, { joinedAt: { $exists: true } }] })
    .toArray()) as unknown as LegacyUserDoc[];

  console.log(`Found ${legacyUsers.length} User document(s) with legacy salary/joinedAt fields`);

  const existingStaffProfiles = await StaffProfileModel.find({
    userId: { $in: legacyUsers.map((user) => user._id) },
  }).lean();
  const alreadyMigrated = new Set(existingStaffProfiles.map((profile) => String(profile.userId)));

  let created = 0;
  let skipped = 0;

  for (const user of legacyUsers) {
    if (alreadyMigrated.has(String(user._id))) {
      skipped++;
      continue;
    }

    await StaffProfileModel.create({
      userId: user._id,
      salary: user.salary,
      joinedAt: user.joinedAt,
    });
    created++;
    console.log(`  created StaffProfile for "${user.name}" (salary: ${user.salary ?? "—"}, joinedAt: ${user.joinedAt ?? "—"})`);
  }

  // Cleanup: the fields are no longer declared on UserSchema — remove the
  // orphaned raw values so they don't linger as stale, confusing data.
  const cleanup = await db.updateMany(
    { $or: [{ salary: { $exists: true } }, { joinedAt: { $exists: true } }] },
    { $unset: { salary: "", joinedAt: "" } }
  );

  console.log("\n=== Migration report ===");
  console.log(JSON.stringify({ found: legacyUsers.length, created, alreadyHadProfile: skipped, cleanedUp: cleanup.modifiedCount }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
