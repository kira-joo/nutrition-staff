import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createPutRoute } from "src/server/core/route-factories";
import { moveBookBlock } from "src/server/books/blocks/handlers/move-book-block";
import { MoveBookBlockDto } from "src/server/books/blocks/dto/move-book-block.dto";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";

export const dynamic = "force-dynamic";

// Flat route (not nested under either container) because this is the one
// block mutation that spans TWO containers in one request — see
// move-book-block.ts.
export const PUT = createPutRoute({
  params: FindBookParamsDto,
  body: MoveBookBlockDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, body }) => moveBookBlock(params.id, body),
});
