import { createMongoModel, Filterable, MongoField, MongoSchema, Relation, Unique } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ClientLifecycle, ClientSource, Gender } from "src/common/enums";
import { UserSchema } from "src/server/users/user.schema";

@MongoSchema({ timestamps: true, softDelete: true })
export class ClientProfileSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Unique({ message: "This user already has a client profile" })
  @Relation(() => UserSchema)
  userId!: mongoose.Types.ObjectId;

  @MongoField({ type: String, enum: Object.values(ClientLifecycle), required: true })
  @Filterable()
  lifecycle!: ClientLifecycle;

  @MongoField({ type: Date, required: false })
  dateOfBirth?: Date;

  /** Only meaningful when `dateOfBirth` is unknown — age derived from this is approximate. */
  @MongoField({ type: Number, required: false })
  birthYear?: number;

  @MongoField({ type: String, enum: Object.values(Gender), required: false })
  gender?: Gender;

  @MongoField({ type: Number, required: false })
  heightCm?: number;

  @MongoField({ type: Number, required: false })
  targetWeightKg?: number;

  @MongoField({ type: String, enum: Object.values(ClientSource), required: false })
  @Filterable()
  source?: ClientSource;

  /** Free-text detail, only meaningful when `source` is `OTHER`. */
  @MongoField({ type: String, required: false })
  sourceNote?: string;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: false })
  @Filterable()
  @Relation(() => UserSchema)
  assignedToUserId?: mongoose.Types.ObjectId;

  @MongoField({ type: Boolean, required: false })
  marketingConsent?: boolean;

  @MongoField({ type: Date, required: false })
  marketingConsentAt?: Date;

  /**
   * Write-through cache of the latest `ClientInteraction.happenedAt` (source
   * of truth lives on that historical collection, added in a later
   * checkpoint) — kept here only so the Clients list can sort/filter on it
   * cheaply without joining.
   */
  @MongoField({ type: Date, required: false })
  lastContactedAt?: Date;

  @MongoField({ type: Date, required: false })
  @Filterable()
  nextFollowUpAt?: Date;

  @MongoField({ type: [String], default: [] })
  @Filterable()
  tags!: string[];

  @MongoField({ type: String, required: false })
  generalNotes?: string;
}

export const ClientProfileModel = createMongoModel(EntityName.CLIENT, ClientProfileSchema);
