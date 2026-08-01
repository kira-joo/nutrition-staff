import { createMongoModel, MongoField, MongoSchema, Relation, Unique } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { UserSchema } from "src/server/users/user.schema";

/**
 * Optional one-to-one — a `User`'s participation as a staff member, exactly
 * symmetric with `ClientProfile`'s participation as a lead/client. A `User`
 * may have neither, either, or both; nothing about being staff is inferred
 * from `roles` (which stay purely account-authorization, on `User`).
 */
@MongoSchema({ timestamps: true, softDelete: true })
export class StaffProfileSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Unique({ message: "This user already has a staff profile" })
  @Relation(() => UserSchema)
  userId!: mongoose.Types.ObjectId;

  @MongoField({ type: Number, required: false })
  salary?: number;

  @MongoField({ type: String, required: false })
  joinedAt?: string;
}

export const StaffProfileModel = createMongoModel(EntityName.STAFF, StaffProfileSchema);
