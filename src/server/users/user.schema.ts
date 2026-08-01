import {
  createMongoModel,
  Filterable,
  MongoField,
  MongoSchema,
  Relation,
  RoleSchema,
  Searchable,
  Unique,
} from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Status } from "../../common/enums";

/**
 * The master identity/account record for every person in the system —
 * general identity, contact info, and authorization (`roles`) only.
 * Participation as a lead/client or as a staff member lives in the
 * optional, independent `ClientProfile`/`StaffProfile` — a `User` may have
 * neither, either, or both. Never inferred from `roles`, and there is no
 * `UserType`/mutually-exclusive category field here on purpose.
 */
@MongoSchema({ timestamps: true })
export class UserSchema {
  // Undecorated on purpose — Mongoose adds `_id` automatically at the schema
  // level; this declaration only exists so repository results are typed with
  // it (createMongoSchema()'s metadata reader ignores undecorated fields, so
  // this has zero effect on the actual generated Mongoose schema).
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true })
  @Searchable()
  name!: string;

  /**
   * Optional — a lead/client User (see `ClientProfile`) may have no email at
   * all. Still required by the staff-facing `CreateUserDto`/`UserForm`; only
   * the underlying schema constraint is relaxed here. Sparse so any number
   * of Users can omit it without tripping the uniqueness constraint.
   */
  @MongoField({ type: String, required: false })
  @Searchable()
  @Unique({ sparse: true, message: "A user with this email already exists" })
  email?: string;

  /** Optional — required by `CreateClientDto` for a new lead/client, but not by staff creation. Sparse for the same reason as `email`. */
  @MongoField({ type: String, required: false })
  @Searchable()
  @Unique({ sparse: true, message: "A user with this phone number already exists" })
  phone?: string;

  /**
   * Never returned by a normal read — only visible to a query that
   * explicitly selects it (see the login handler). Optional: a user
   * created by an admin via POST /api/users has no password until a
   * future "set/reset password" flow exists; such a user simply can't
   * log in until then.
   */
  @MongoField({ type: String, required: false, select: false })
  passwordHash?: string;

  /** Compared against the JWT's tokenVersion claim on every request; bump to force a global logout. */
  @MongoField({ type: Number, default: 1 })
  tokenVersion!: number;

  /** Authorization roles this user holds. Replaces the old flat UserRole enum field entirely. */
  @MongoField({ type: [mongoose.Schema.Types.ObjectId], ref: EntityName.ROLE, default: [] })
  @Filterable()
  @Relation(() => RoleSchema)
  roles!: mongoose.Types.ObjectId[];

  @MongoField({ type: String, enum: Object.values(Status), required: true })
  @Searchable()
  @Filterable()
  status!: Status;
}

export const UserModel = createMongoModel(EntityName.USER, UserSchema);
