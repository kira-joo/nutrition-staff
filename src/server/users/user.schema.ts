import {
  Filterable,
  MongoField,
  MongoSchema,
  Searchable,
  Unique,
  createMongoModel,
} from "@kira-joo/backend-toolkit-mongoose";
import { Status, UserRole } from "../../common/enums";

@MongoSchema({ timestamps: true })
export class UserSchema {
  @MongoField({ type: String, required: true })
  @Searchable()
  name!: string;

  @MongoField({ type: String, required: true })
  @Searchable()
  @Unique({ message: "A user with this email already exists" })
  email!: string;

  @MongoField({ type: String, enum: Object.values(UserRole), required: true })
  @Searchable()
  @Filterable()
  role!: UserRole;

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

export const UserModel = createMongoModel("User", UserSchema);
