"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, PageShell, QueryState, RouteTabs, type RouteTabItem } from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { getBookByIdEndpoint } from "../../../../api/book.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { BookStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

const BOOK_STATUS_BADGE_VARIANT: Record<BookStatus, "success" | "secondary" | "warning" | "destructive"> = {
  [BookStatus.DRAFT]: "secondary",
  [BookStatus.READY_FOR_REVIEW]: "warning",
  [BookStatus.PUBLISHED]: "success",
  [BookStatus.ARCHIVED]: "destructive",
};

/**
 * Content/Front Matter/Back Matter/References are Phase C. Publishing/
 * Preview/Editions stay Phase D+ and deliberately absent rather than
 * linking to routes that don't exist.
 */
const BOOK_EDITOR_TABS: RouteTabItem<string>[] = [
  { id: "overview", label: "Overview", path: AppRoute.bookOverview, permission: AppPermission.BOOK.READ },
  { id: "overrides", label: "Overrides", path: AppRoute.bookOverrides, permission: AppPermission.BOOK.READ },
  { id: "content", label: "Content", path: AppRoute.bookContent, permission: AppPermission.BOOK.READ },
  { id: "front-matter", label: "Front Matter", path: AppRoute.bookFrontMatter, permission: AppPermission.BOOK.READ },
  { id: "back-matter", label: "Back Matter", path: AppRoute.bookBackMatter, permission: AppPermission.BOOK.READ },
  { id: "references", label: "References", path: AppRoute.bookReferences, permission: AppPermission.BOOK.READ },
];

export default function BookEditorLayout({ children, params }: { children: ReactNode; params: { id: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });

  return (
    <QueryState query={bookQuery} entityName="Book" backRoute={{ path: AppRoute.books, label: "Back to Books" }}>
      {(book) => (
        <PageShell icon={BookOpen} title={book.title} badge={<Badge variant={BOOK_STATUS_BADGE_VARIANT[book.status]}>{book.status}</Badge>}>
          <RouteTabs tabs={BOOK_EDITOR_TABS} pathname={pathname} params={{ id: params.id }} onNavigate={(href) => router.push(href)} />
          <div className="mt-4">{children}</div>
        </PageShell>
      )}
    </QueryState>
  );
}
