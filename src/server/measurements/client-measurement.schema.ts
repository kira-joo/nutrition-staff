import { createMongoModel, Filterable, MongoField, MongoSchema, Relation } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BodyCompositionMethod } from "src/common/enums";
import { ClientProfileSchema } from "src/server/clients/client-profile.schema";
import { UserSchema } from "src/server/users/user.schema";

@MongoSchema({ timestamps: true, softDelete: true })
export class ClientMeasurementSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT, required: true })
  @Filterable()
  @Relation(() => ClientProfileSchema)
  clientProfileId!: mongoose.Types.ObjectId;

  @MongoField({ type: Date, required: true })
  measuredAt!: Date;

  @MongoField({ type: Number, required: false })
  weightKg?: number;

  @MongoField({ type: Number, required: false })
  waistCm?: number;

  @MongoField({ type: Number, required: false })
  hipCm?: number;

  @MongoField({ type: Number, required: false })
  chestCm?: number;

  @MongoField({ type: Number, required: false })
  neckCm?: number;

  @MongoField({ type: Number, required: false })
  armCm?: number;

  @MongoField({ type: Number, required: false })
  thighCm?: number;

  @MongoField({ type: Number, required: false })
  bodyFatPercentage?: number;

  @MongoField({ type: Number, required: false })
  muscleMassKg?: number;

  @MongoField({ type: Number, required: false })
  bodyWaterPercentage?: number;

  @MongoField({ type: Number, required: false })
  visceralFatLevel?: number;

  /** Data provenance for the body-composition fields above — how they were obtained, not who entered them. */
  @MongoField({ type: String, enum: Object.values(BodyCompositionMethod), required: false })
  bodyCompositionMethod?: BodyCompositionMethod;

  /** Derived at write time from weightKg + heightCmUsed — never recomputed from a possibly-since-changed ClientProfile.heightCm. */
  @MongoField({ type: Number, required: false })
  bmi?: number;

  /** The ClientProfile.heightCm in effect when bmi was computed — kept so the derivation stays self-explanatory even if the profile's height later changes. */
  @MongoField({ type: Number, required: false })
  heightCmUsed?: number;

  @MongoField({ type: String, required: false })
  notes?: string;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Relation(() => UserSchema)
  recordedByUserId!: mongoose.Types.ObjectId;
}

export const ClientMeasurementModel = createMongoModel(EntityName.CLIENT_MEASUREMENT, ClientMeasurementSchema);
