import { createMongoModel, Filterable, MongoField, MongoSchema, Relation } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ActivityLevel, AlcoholUse, NutritionGoal, SleepQuality, SmokingStatus } from "src/common/enums";
import { ClientProfileSchema } from "src/server/clients/client-profile.schema";
import { UserSchema } from "src/server/users/user.schema";

/**
 * This field list is a reviewed working draft (per the plan), not a fixed
 * medical questionnaire — expect it to be refined further against real
 * doctor feedback as this checkpoint sees actual use.
 */
@MongoSchema({ timestamps: true, softDelete: true })
export class NutritionAssessmentSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT, required: true })
  @Filterable()
  @Relation(() => ClientProfileSchema)
  clientProfileId!: mongoose.Types.ObjectId;

  @MongoField({ type: Date, required: true })
  assessedAt!: Date;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Relation(() => UserSchema)
  assessedByUserId!: mongoose.Types.ObjectId;

  /** Convenience link for "compare to previous" — auto-resolved to the client's most recent prior assessment at creation time unless explicitly overridden. */
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.NUTRITION_ASSESSMENT, required: false })
  @Relation(() => NutritionAssessmentSchema)
  previousAssessmentId?: mongoose.Types.ObjectId;

  @MongoField({ type: String, enum: Object.values(NutritionGoal), required: false })
  goal?: NutritionGoal;

  @MongoField({ type: String, enum: Object.values(ActivityLevel), required: false })
  activityLevel?: ActivityLevel;

  @MongoField({ type: String, required: false })
  occupation?: string;

  /** Covers day/night shift and similar — the agreed "daily routine" question, alongside lifestyleNotes below. */
  @MongoField({ type: String, required: false })
  workSchedule?: string;

  @MongoField({ type: Number, required: false })
  sleepHours?: number;

  @MongoField({ type: String, enum: Object.values(SleepQuality), required: false })
  sleepQuality?: SleepQuality;

  @MongoField({ type: String, enum: Object.values(SmokingStatus), required: false })
  smokingStatus?: SmokingStatus;

  @MongoField({ type: String, enum: Object.values(AlcoholUse), required: false })
  alcoholUse?: AlcoholUse;

  @MongoField({ type: Number, required: false })
  waterIntakeLiters?: number;

  @MongoField({ type: Number, required: false })
  mealsPerDay?: number;

  /** Sensitive: health data. */
  @MongoField({ type: [String], default: [] })
  medicalConditions!: string[];

  @MongoField({ type: [String], default: [] })
  medications!: string[];

  @MongoField({ type: [String], default: [] })
  supplements!: string[];

  @MongoField({ type: [String], default: [] })
  allergies!: string[];

  @MongoField({ type: [String], default: [] })
  foodIntolerances!: string[];

  @MongoField({ type: [String], default: [] })
  preferredFoods!: string[];

  @MongoField({ type: [String], default: [] })
  dislikedFoods!: string[];

  /** Kept free text for v1 — formalize into an enum later once real data shows common values. */
  @MongoField({ type: String, required: false })
  dietaryPattern?: string;

  /** Sensitive: highest tier. Free text (not an enum) — real clinical phrasing has more nuance (e.g. trimester) than a fixed set of values would capture. */
  @MongoField({ type: String, required: false })
  pregnancyStatus?: string;

  @MongoField({ type: String, required: false })
  breastfeedingStatus?: string;

  @MongoField({ type: String, required: false })
  digestiveNotes?: string;

  @MongoField({ type: String, required: false })
  appetiteNotes?: string;

  /** General lifestyle/daily-routine narrative — the agreed catch-all alongside occupation/workSchedule above. */
  @MongoField({ type: String, required: false })
  lifestyleNotes?: string;

  @MongoField({ type: String, required: false })
  generalNotes?: string;
}

export const NutritionAssessmentModel = createMongoModel(EntityName.NUTRITION_ASSESSMENT, NutritionAssessmentSchema);
