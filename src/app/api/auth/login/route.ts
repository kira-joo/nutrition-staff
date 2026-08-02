import { UnauthorizedError } from "@kira-joo/backend-toolkit-core";
import { comparePassword, signAuthToken } from "@kira-joo/backend-toolkit-next";
import { LoginDto } from "src/server/core/auth/dto/login.dto";
import { resolveUser } from "src/server/core/auth/resolve-user";
import { createPostRoute } from "src/server/core/route-factories";
import { UserModel } from "src/server/users/user.schema";

export const dynamic = "force-dynamic";

export const POST = createPostRoute({
  body: LoginDto,
  auth: false,
  successStatus: 200,
  handler: async ({ body }) => {
    // Queries the raw Mongoose model (not userRepository) on purpose:
    // passwordHash is @MongoField({ select: false }), and the repository's
    // `select` option can never surface a select:false field — a deliberate
    // security boundary in the toolkit, not something to work around there.
    // Mongoose's own native "+field" override syntax is the correct, narrow
    // way to unhide it for this one query.
    const record = await UserModel.findOne({ email: body.email }).select("+passwordHash").lean();

    if (!record?.passwordHash || !(await comparePassword(body.password, record.passwordHash))) {
      // Deliberately generic — never reveal whether the email or the password was wrong.
      throw new UnauthorizedError("Invalid email or password");
    }

    const user = await resolveUser(String(record._id));
    if (!user) {
      // Covers an inactive account — same generic message as a wrong password, no leakage.
      throw new UnauthorizedError("Invalid email or password");
    }

    const accessToken = await signAuthToken({ sub: String(record._id), tokenVersion: record.tokenVersion });

    return { accessToken, user };
  },
});
