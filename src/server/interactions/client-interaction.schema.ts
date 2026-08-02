import { createMongoModel, Filterable, MongoField, MongoSchema, Relation } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { InteractionType } from "src/common/enums";
import { ClientProfileSchema } from "src/server/clients/client-profile.schema";
import { UserSchema } from "src/server/users/user.schema";

@MongoSchema({ timestamps: true, softDelete: true })
export class ClientInteractionSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT, required: true })
  @Filterable()
  @Relation(() => ClientProfileSchema)
  clientProfileId!: mongoose.Types.ObjectId;

  @MongoField({ type: String, enum: Object.values(InteractionType), required: true })
  @Filterable()
  type!: InteractionType;

  @MongoField({ type: String, required: true })
  summary!: string;

  @MongoField({ type: Date, required: true })
  happenedAt!: Date;

  /** When set, write-throughs to `ClientProfile.nextFollowUpAt` at creation time. */
  @MongoField({ type: Date, required: false })
  @Filterable()
  nextFollowUpAt?: Date;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Relation(() => UserSchema)
  createdByUserId!: mongoose.Types.ObjectId;

  /** True only for auto-logged lifecycle changes (see updateClient) — never set directly by a staff member. Never editable or deletable, regardless of permission, so the lifecycle audit trail can't be silently rewritten. */
  @MongoField({ type: Boolean, default: false })
  isSystemGenerated!: boolean;
}

export const ClientInteractionModel = createMongoModel(EntityName.CLIENT_INTERACTION, ClientInteractionSchema);
