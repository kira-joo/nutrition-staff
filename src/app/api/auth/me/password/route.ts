import { BadRequestError } from "@kira-joo/backend-toolkit-core";
import { comparePassword, hashPassword } from "@kira-joo/backend-toolkit-next";
import { createPutRoute } from "src/server/core/route-factories";
import { UpdateOwnPasswordDto } from "src/server/users/dto/update-own-password.dto";
import { UserModel } from "src/server/users/user.schema";
import { userRepository } from "src/server/users/users.repository";

export const PUT = createPutRoute({
  body: UpdateOwnPasswordDto,
  auth: true,
  handler: async ({ user, body }) => {
    // Raw Mongoose model, not userRepository — passwordHash is
    // @MongoField({ select: false }); only Mongoose's native "+field"
    // override can surface it, same as the login route.
    const record = await UserModel.findById(user._id).select("+passwordHash").lean();

    if (!record?.passwordHash || !(await comparePassword(body.currentPassword, record.passwordHash))) {
      throw new BadRequestError("Current password is incorrect");
    }

    const passwordHash = await hashPassword(body.newPassword);
    await userRepository.update({ where: { _id: user._id } }, { passwordHash });

    return { success: true };
  },
});
