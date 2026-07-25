import {
  Filterable,
  MongoField,
  MongoSchema,
  RoleSchema,
  Searchable,
  Unique,
  createMongoModel,
  Relation,
} from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { Status } from "../../common/enums";
import { EntityName } from "@/common/authorization/entity-name.enum";

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

  @MongoField({ type: String, required: true })
  @Searchable()
  @Unique({ message: "A user with this email already exists" })
  email!: string;

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

  @MongoField({ type: Number, default: 0 })
  @Filterable()
  salary!: number;

  @MongoField({ type: String, default: () => new Date().toISOString().slice(0, 10) })
  joinedAt!: string;
}

export const UserModel = createMongoModel(EntityName.USER, UserSchema);
