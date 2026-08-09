import { createMongoModel, Filterable, MongoField, MongoSchema, Relation, Searchable } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ConsultationRequestIntent } from "src/common/enums";
import { UserSchema } from "src/server/users/user.schema";
import { ClientProfileSchema } from "src/server/clients/client-profile.schema";

/**
 * The permanent record of one public form submission — deliberately
 * separate from `User`/`ClientProfile`, which stay the CRM identity/lead
 * source of truth and are unchanged by this schema's existence.
 *
 * Investigated before adding this (see the plan): a `ClientProfile` only
 * ever holds the *latest* `sourceNote` and a deduplicated union of tags —
 * a returning lead's second submission updated `tags` but its `message`
 * was read into memory and then never written anywhere, silently and
 * completely. There is no existing field, array, or side collection that
 * lets that submission be reconstructed after the fact. `ClientInteraction`
 * is a real append-only history collection, but it requires a staff
 * `createdByUserId` and is never touched by the public flow, so it isn't a
 * fit either. This schema is that missing history — every field here is
 * exactly what the public form sends, nothing invented (no workflow
 * status; that's a later, explicitly out-of-scope decision).
 *
 * `name`/`phone`/`email` are a snapshot of what was submitted, not a live
 * reference to `User` — a person's name can be corrected by staff later on
 * `User` without rewriting history here. `userId`/`clientProfileId` are
 * the link back to whichever identity `createConsultationRequest` resolved
 * (create, or one of its two conflict-merge branches) for that submission.
 */
@MongoSchema({ timestamps: true, softDelete: true })
export class ConsultationRequestSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true })
  @Searchable()
  name!: string;

  @MongoField({ type: String, required: true })
  @Searchable()
  phone!: string;

  @MongoField({ type: String, required: false })
  @Searchable()
  email?: string;

  @MongoField({ type: String, enum: Object.values(ConsultationRequestIntent), required: true })
  @Filterable()
  intent!: ConsultationRequestIntent;

  /** `Package.key`, not an ObjectId — mirrors the public DTO; the package itself may since have been renamed or unpublished. */
  @MongoField({ type: String, required: false })
  packageKey?: string;

  /** The free-text submission itself — kept as an opaque blob, same convention as `ClientProfile.sourceNote`/`generalNotes`. */
  @MongoField({ type: String, required: false })
  message?: string;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  @Filterable()
  @Relation(() => UserSchema)
  userId!: mongoose.Types.ObjectId;

  /**
   * Optional only for schema-level defensiveness — in practice
   * `createConsultationRequest` always resolves one (create, or either
   * merge branch) before writing this row at all.
   */
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.CLIENT, required: false })
  @Filterable()
  @Relation(() => ClientProfileSchema)
  clientProfileId?: mongoose.Types.ObjectId;

  /** Request IP at submission time — the same value already computed for rate-limiting, kept here for spam/abuse review. */
  @MongoField({ type: String, required: false })
  ip?: string;
}

export const ConsultationRequestModel = createMongoModel(EntityName.CONSULTATION_REQUEST, ConsultationRequestSchema);
