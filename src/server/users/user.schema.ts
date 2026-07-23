import mongoose, { Schema, type HydratedDocument } from "mongoose";
import { Status, UserRole } from "../../../common/enums";

export interface UserAttrs {
  name: string;
  email: string;
  role: UserRole;
  status: Status;
  salary: number;
  joinedAt: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<UserAttrs>;

const userSchema = new Schema<UserAttrs>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    status: { type: String, enum: Object.values(Status), required: true },
    salary: { type: Number, default: 0 },
    joinedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { timestamps: true },
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserAttrs>) || mongoose.model<UserAttrs>("User", userSchema);
