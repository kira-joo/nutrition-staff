import mongoose from "mongoose";
import { hashPassword } from "@kira-joo/backend-toolkit-next";
import { Status, UserRole } from "../src/common/enums";
import { connectToDatabase } from "../src/server/db/connect";
import { UserModel } from "../src/server/users/user.schema";

// Dev-only password shared by every seeded sample user, so there's a way to
// log in locally right after seeding + running seed-roles-and-permissions.
// Never use this literal value outside local development.
const DEV_PASSWORD = "Passw0rd!";

async function seed() {
  await connectToDatabase();
  const passwordHash = await hashPassword(DEV_PASSWORD);

  // `role` is intentionally still a plain (legacy, no-longer-schema-declared)
  // field here rather than a `roles` relation — this seed script deliberately
  // recreates the pre-migration data shape so scripts/seed-roles-and-permissions.ts
  // has real legacy data to exercise the actual migration path against.
  const sampleUsers = [
    {
      name: "Ava Thompson",
      email: "ava.thompson@example.com",
      role: UserRole.ADMIN,
      status: Status.ACTIVE,
      salary: 95000,
      joinedAt: "2021-03-15",
      passwordHash,
      tokenVersion: 1,
    },
    {
      name: "Liam Chen",
      email: "liam.chen@example.com",
      role: UserRole.MANAGER,
      status: Status.ACTIVE,
      salary: 78000,
      joinedAt: "2022-01-10",
      passwordHash,
      tokenVersion: 1,
    },
    {
      name: "Sofia Martinez",
      email: "sofia.martinez@example.com",
      role: UserRole.EMPLOYEE,
      status: Status.ACTIVE,
      salary: 54000,
      joinedAt: "2022-08-22",
      passwordHash,
      tokenVersion: 1,
    },
    {
      name: "Noah Williams",
      email: "noah.williams@example.com",
      role: UserRole.HR,
      status: Status.INACTIVE,
      salary: 61000,
      joinedAt: "2020-11-05",
      passwordHash,
      tokenVersion: 1,
    },
    {
      name: "Emma Johnson",
      email: "emma.johnson@example.com",
      role: UserRole.EMPLOYEE,
      status: Status.ACTIVE,
      salary: 58000,
      joinedAt: "2023-02-01",
      passwordHash,
      tokenVersion: 1,
    },
  ];

  await UserModel.deleteMany({});
  // Raw collection insert (bypassing the Mongoose model) on purpose: the
  // current UserSchema no longer declares `role`, so Model.insertMany()'s
  // strict-mode casting would silently drop it before it ever reaches
  // MongoDB. Inserting via the raw driver recreates a genuine pre-migration
  // document shape, so seed-roles-and-permissions.ts has real legacy data to
  // migrate against.
  const inserted = await UserModel.collection.insertMany(sampleUsers);
  console.log(`Seeded ${inserted.insertedCount} users (password for all: "${DEV_PASSWORD}", dev-only)`);
  console.log('Run `npm run seed:roles` next to assign roles based on the legacy `role` field above.');
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
