import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { UserModel } from "src/server/users/user.schema";

export const userRepository = createMongooseRepository({ model: UserModel, entityName: "User" });
