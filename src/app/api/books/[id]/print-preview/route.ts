import { validateDto } from "@kira-joo/backend-toolkit-core";
import { authenticateRequest, authorizeUser, createErrorResponse, extractQueryObject, getNextBackendToolkitConfig } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { IsMongoId, IsOptional, IsString } from "class-validator";
import "reflect-metadata";
import "src/server/core/toolkit.config";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { resolveBookIdentity } from "src/common/books/resolve-book-identity";
import { getBookTemplate } from "src/server/books/render/book-template-registry";
import { bookRepository } from "src/server/books/books.repository";
import { bookSettingsRepository } from "src/server/book-settings/book-settings.repository";
import { getOrCreateSingleton } from "src/server/core/singleton";

export const dynamic = "force-dynamic";

const AUTH_OPTION = { permissions: [AppPermission.BOOK.READ] };

class PrintPreviewParamsDto {
  @IsMongoId()
  id!: string;
}

class PrintPreviewQueryDto {
  @IsOptional()
  @IsString()
  chapterId?: string;
}

/**
 * Returns the self-contained book HTML directly (`text/html`), never
 * JSON — `createGetRoute` always wraps a handler's return value with
 * `createSuccessResponse` (`NextResponse.json`), which would corrupt
 * this response the same way it would a binary PDF. Composes the same
 * auth/error pieces `createRoute` uses internally, by hand, exactly like
 * the recipe PDF export route already does for the same reason.
 *
 * The staff app injects this into an `<iframe srcdoc>` rather than
 * `<iframe src>` — the staff bearer token lives in `localStorage`, not a
 * cookie, so a direct `src` request would be unauthenticated.
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const config = getNextBackendToolkitConfig();
    await config.database.connect();

    const user = await authenticateRequest({ request, config, authOption: AUTH_OPTION });
    authorizeUser(user, AUTH_OPTION);

    const params = await validateDto(PrintPreviewParamsDto, context.params);
    const query = await validateDto(PrintPreviewQueryDto, extractQueryObject(request.nextUrl.searchParams));

    const book = await bookRepository.findOne({ where: { _id: params.id } });
    const settings = await getOrCreateSingleton(bookSettingsRepository, {});
    // `resolveBookIdentity`'s `settings` param is typed against the client-facing
    // `BookSettings` interface (used by both client and server callers); the
    // Mongoose document here is missing only `createdAt`/`updatedAt`, neither of
    // which the resolver reads.
    const identity = resolveBookIdentity(settings as unknown as Parameters<typeof resolveBookIdentity>[0], book);

    const template = getBookTemplate(identity.templateVersion);
    const html = await template.buildHtml({ book, identity, chapterId: query.chapterId });

    // `no-store` is required, not defensive. This renders the MUTABLE draft,
    // and the page fetches it with a plain GET whose URL never changes, so
    // without it the browser's own HTTP cache can satisfy a Refresh from a
    // previous response — the preview then shows an older contentRevision
    // than the block the author just saved. `dynamic = "force-dynamic"`
    // above does not cover this: it governs Next's server-side cache, not
    // the browser's.
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, must-revalidate" },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
