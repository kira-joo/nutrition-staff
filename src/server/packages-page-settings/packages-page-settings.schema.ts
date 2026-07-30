import { createMongoModel, localizedStringField, MongoField, MongoSchema } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";

const durationLabelsSchema = new mongoose.Schema(
  {
    month: localizedStringField(),
    quarter: localizedStringField(),
    half: localizedStringField(),
  },
  { _id: false }
);

export interface DurationLabels {
  month: LocalizedString;
  quarter: LocalizedString;
  half: LocalizedString;
}

@MongoSchema({ timestamps: true })
export class PackagesPageSettingsSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  title!: LocalizedString;

  @MongoField(localizedStringField())
  titleAccent!: LocalizedString;

  @MongoField(localizedStringField())
  subtitle!: LocalizedString;

  @MongoField({ type: durationLabelsSchema, default: () => ({}) })
  durationLabels!: DurationLabels;

  @MongoField(localizedStringField())
  subscribeButtonLabel!: LocalizedString;
}

export const PackagesPageSettingsModel = createMongoModel(EntityName.PACKAGES_PAGE_SETTINGS, PackagesPageSettingsSchema);
