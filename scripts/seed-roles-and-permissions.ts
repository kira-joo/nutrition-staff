import { syncPermissions } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { AppPermission, authorization } from "../src/server/core/authorization/authorization-registry";
import { PermissionModel, RoleModel } from "../src/server/core/authorization/role.model";
import { connectToDatabase } from "../src/server/core/db/connect";
import { UserModel } from "../src/server/users/user.schema";

interface RoleDefinition {
  name: string;
  grantsAll: boolean;
  permissionKeys: string[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  { name: "admin", grantsAll: true, permissionKeys: [] },
  {
    name: "hr",
    grantsAll: false,
    permissionKeys: [
      AppPermission.USER.READ,
      AppPermission.USER.READ_ONE,
      AppPermission.USER.CREATE,
      AppPermission.USER.UPDATE,
      AppPermission.ROLE.READ,
    ],
  },
  {
    name: "manager",
    grantsAll: false,
    permissionKeys: [
      AppPermission.USER.READ,
      AppPermission.USER.READ_ONE,
      AppPermission.USER.UPDATE,
      AppPermission.ROLE.READ,
    ],
  },
  { name: "employee", grantsAll: false, permissionKeys: [] },
];

// Maps the legacy flat `UserSchema.role` enum value (still physically present
// on existing documents even though the Mongoose schema no longer declares
// that field) to the seeded Role name above.
const LEGACY_ROLE_TO_ROLE_NAME: Record<string, string> = {
  admin: "admin",
  hr: "hr",
  manager: "manager",
  employee: "employee",
};

async function seedRoles(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const allPermissions = await PermissionModel.find({}).lean();
  const permissionIdByKey = new Map(allPermissions.map((permission) => [permission.key, permission._id]));
  const roleIdByName = new Map<string, mongoose.Types.ObjectId>();

  for (const definition of ROLE_DEFINITIONS) {
    const permissionIds = definition.permissionKeys.map((key) => {
      const id = permissionIdByKey.get(key);
      if (!id) throw new Error(`Permission "${key}" was not found — did syncPermissions() run first?`);
      return id;
    });

    const role = await RoleModel.findOneAndUpdate(
      { name: definition.name },
      { $set: { grantsAll: definition.grantsAll, permissions: permissionIds } },
      { upsert: true, new: true },
    );

    roleIdByName.set(definition.name, role._id);
    console.log(
      `[roles] upserted "${definition.name}" (grantsAll=${definition.grantsAll}, ${permissionIds.length} permissions)`,
    );
  }

  return roleIdByName;
}

async function migrateExistingUsers(roleIdByName: Map<string, mongoose.Types.ObjectId>): Promise<void> {
  // Raw collection access on purpose: UserSchema no longer declares `role`,
  // but existing documents still physically have it in MongoDB.
  const rawUsers = await UserModel.collection.find({}).project({ role: 1 }).toArray();

  let migrated = 0;

  for (const rawUser of rawUsers) {
    const legacyRole = typeof rawUser.role === "string" ? rawUser.role : undefined;
    const roleName = legacyRole ? LEGACY_ROLE_TO_ROLE_NAME[legacyRole] : undefined;
    const roleId = roleName ? roleIdByName.get(roleName) : undefined;

    if (!roleId) {
      console.warn(
        `[migrate] user ${rawUser._id} has no mappable legacy role ("${legacyRole}") — left with empty roles`,
      );
      continue;
    }

    await UserModel.collection.updateOne(
      { _id: rawUser._id },
      { $set: { roles: [roleId], tokenVersion: 1 }, $unset: { role: "" } },
    );
    migrated++;
  }

  const total = await UserModel.countDocuments({});
  const withRoles = await UserModel.countDocuments({ "roles.0": { $exists: true } });
  console.log(
    `[migrate] ${migrated} users migrated. Verification: ${withRoles}/${total} users now have at least one role.`,
  );
}

async function main() {
  await connectToDatabase();
  const syncResult = await syncPermissions({ model: PermissionModel, definitions: authorization.definitions });
  console.log(
    `[permissions] synced: ${syncResult.created.length} created, ${syncResult.skipped.length} already existed`,
  );

  const roleIdByName = await seedRoles();
  await migrateExistingUsers(roleIdByName);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("seed-roles-and-permissions failed:", error);
  process.exit(1);
});
