import { hashPassword } from "@kira-joo/backend-toolkit-next";
import mongoose from "mongoose";
import { Status } from "../src/common/enums";
import { RoleModel } from "../src/server/core/authorization/role.model";
import { connectToDatabase } from "../src/server/core/db/connect";
import { UserModel } from "../src/server/users/user.schema";

// Dev-only password shared by every seeded sample user, so there's a way to
// log in locally right after seeding. Never use this literal value outside
// local development.
const DEV_PASSWORD = "Passw0rd!";

// Requires `npm run seed:roles` to have already run at least once, so these
// role names resolve to real Role documents.
const SAMPLE_USERS = [
  {
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    roleName: "admin",
    status: Status.ACTIVE,
    salary: 95000,
    joinedAt: "2021-03-15",
  },
  {
    name: "Liam Chen",
    email: "liam.chen@example.com",
    roleName: "manager",
    status: Status.ACTIVE,
    salary: 78000,
    joinedAt: "2022-01-10",
  },
  {
    name: "Sofia Martinez",
    email: "sofia.martinez@example.com",
    roleName: "employee",
    status: Status.ACTIVE,
    salary: 54000,
    joinedAt: "2022-08-22",
  },
  {
    name: "Noah Williams",
    email: "noah.williams@example.com",
    roleName: "hr",
    status: Status.INACTIVE,
    salary: 61000,
    joinedAt: "2020-11-05",
  },
  {
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    roleName: "employee",
    status: Status.ACTIVE,
    salary: 58000,
    joinedAt: "2023-02-01",
  },
];

async function seed() {
  await connectToDatabase();
  const passwordHash = await hashPassword(DEV_PASSWORD);

  const roles = await RoleModel.find({}).lean();
  const roleIdByName = new Map(roles.map((role) => [role.name, role._id]));

  const sampleUsers = SAMPLE_USERS.map(({ roleName, ...user }) => {
    const roleId = roleIdByName.get(roleName);
    if (!roleId) {
      throw new Error(`Role "${roleName}" was not found — run \`npm run seed:roles\` before seeding users.`);
    }
    return { ...user, passwordHash, tokenVersion: 1, roles: [roleId] };
  });

  await UserModel.deleteMany({});
  const inserted = await UserModel.insertMany(sampleUsers);
  console.log(`Seeded ${inserted.length} users (password for all: "${DEV_PASSWORD}", dev-only)`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
