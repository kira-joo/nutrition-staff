import mongoose from "mongoose";
import { connectToDatabase } from "../src/server/db/connect";
import { UserModel } from "../src/server/users/user.schema";
import { Status, UserRole } from "../common/enums";

const sampleUsers = [
  {
    name: "Ava Thompson",
    email: "ava.thompson@example.com",
    role: UserRole.ADMIN,
    status: Status.ACTIVE,
    salary: 95000,
    joinedAt: "2021-03-15",
  },
  {
    name: "Liam Chen",
    email: "liam.chen@example.com",
    role: UserRole.MANAGER,
    status: Status.ACTIVE,
    salary: 78000,
    joinedAt: "2022-01-10",
  },
  {
    name: "Sofia Martinez",
    email: "sofia.martinez@example.com",
    role: UserRole.EMPLOYEE,
    status: Status.ACTIVE,
    salary: 54000,
    joinedAt: "2022-08-22",
  },
  {
    name: "Noah Williams",
    email: "noah.williams@example.com",
    role: UserRole.HR,
    status: Status.INACTIVE,
    salary: 61000,
    joinedAt: "2020-11-05",
  },
  {
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    role: UserRole.EMPLOYEE,
    status: Status.ACTIVE,
    salary: 58000,
    joinedAt: "2023-02-01",
  },
];

async function seed() {
  await connectToDatabase();
  await UserModel.deleteMany({});
  const inserted = await UserModel.insertMany(sampleUsers);
  console.log(`Seeded ${inserted.length} users`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
