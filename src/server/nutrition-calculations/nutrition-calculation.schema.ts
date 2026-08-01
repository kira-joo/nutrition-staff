import { createMongoModel, Filterable, MongoField, MongoSchema, Relation } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { CalculationType } from "src/common/enums";
import { ClientProfileSchema } from "src/server/clients/client-profile.schema";
import { NutritionAssessmentSchema } from "src/server/assessments/nutrition-assessment.schema";
import { ClientMeasurementSchema } from "src/server/measurements/client-measurement.schema";
import { UserSchema } from "src/server/users/user.schema";

/**
 * Immutable except `notes` — inputs/results are never edited after the
 * fact; a redo creates a new row (see the Calculation Workspace plan).
 * Always references a `clientProfileId` once persisted: the standalone
 * flow simply never creates a row until "Assign to Client" happens, so
 * there's no "unassigned draft" state to model here.
 */
@MongoSchema({ timestamps: true, softDelete: true })
export class NutritionCalculationSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT, required: true })
  @Filterable()
  @Relation(() => ClientProfileSchema)
  clientProfileId!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.NUTRITION_ASSESSMENT, required: false })
  @Relation(() => NutritionAssessmentSchema)
  assessmentId?: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT_MEASUREMENT, required: false })
  @Relation(() => ClientMeasurementSchema)
  measurementId?: mongoose.Types.ObjectId;

  @MongoField({ type: String, enum: Object.values(CalculationType), required: true })
  type!: CalculationType;

  /** Tracks the overall formula-set revision (e.g. "workspace-v1") — distinct from each individual result's own `formula`/`formulaVersion`. */
  @MongoField({ type: String, required: true })
  engineVersion!: string;

  /** The exact raw inputs used — never re-derived from current profile/measurement/assessment values, which may have since changed. */
  @MongoField({ type: mongoose.Schema.Types.Mixed, required: true })
  inputs!: Record<string, unknown>;

  /** Each metric carries its own value/unit/formula inline — a single top-level formula name can't describe a multi-output run. */
  @MongoField({ type: mongoose.Schema.Types.Mixed, required: true })
  results!: Record<string, unknown>;

  @MongoField({ type: [String], default: [] })
  assumptions!: string[];

  @MongoField({ type: Date, required: true })
  calculatedAt!: Date;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Relation(() => UserSchema)
  calculatedByUserId!: mongoose.Types.ObjectId;

  /** Only meaningful for the standalone-flow "Assign to Client" path — absent when the calculation was computed directly against a known client. */
  @MongoField({ type: Date, required: false })
  assignedAt?: Date;

  /** The only field a doctor can edit after the fact — an annotation, never the clinical snapshot itself. */
  @MongoField({ type: String, required: false })
  notes?: string;
}

export const NutritionCalculationModel = createMongoModel(EntityName.NUTRITION_CALCULATION, NutritionCalculationSchema);
