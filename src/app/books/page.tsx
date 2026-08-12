"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  DateText,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteBookEndpoint, getBooksEndpoint } from "../../../api/book.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { thumbUrl } from "src/common/books/cloudinary-thumb";
import { BookStatus, BookVisibility } from "src/common/enums";
import { Book } from "src/common/interfaces/book.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

const BOOK_STATUS_BADGE_VARIANT: Record<BookStatus, "success" | "secondary" | "warning" | "destructive"> = {
  [BookStatus.DRAFT]: "secondary",
  [BookStatus.READY_FOR_REVIEW]: "warning",
  [BookStatus.PUBLISHED]: "success",
  [BookStatus.ARCHIVED]: "destructive",
};

export default function BooksPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteBookEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Book>[] = [
    {
      key: "cover",
      header: "Cover",
      render: (book) =>
        book.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl(book.coverImage, 60)} alt="" className="h-16 w-12 rounded object-cover" />
        ) : (
          <div className="h-16 w-12 rounded bg-slate-100" />
        ),
    },
    {
      key: "title",
      header: "Title",
      render: (book) => (
        <AppLink path={AppRoute.bookOverview} params={{ id: book._id }}>
          {book.title || "(untitled)"}
        </AppLink>
      ),
    },
    { key: "category", header: "Category", render: (book) => book.category || "—" },
    {
      key: "status",
      header: "Status",
      render: (book) => <Badge variant={BOOK_STATUS_BADGE_VARIANT[book.status]}>{book.status}</Badge>,
    },
    { key: "editionCount", header: "Editions", render: (book) => book.editionCount || 0 },
    { key: "updatedAt", header: "Last updated", render: (book) => <DateText value={book.updatedAt} /> },
  ];

  return (
    <PageShell
      icon={BookOpen}
      title="Books"
      description="Arabic health guides authored once and published as PDF and interactive flipbook"
      actions={
        <RouteButton path={AppRoute.bookCreate} permission={AppPermission.BOOK.CREATE} leftIcon={Plus}>
          New Book
        </RouteButton>
      }
    >
      <FeatureTable<Book, typeof getBooksEndpoint>
        ref={tableRef}
        endpoint={getBooksEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.BOOK]}
        filters={[
          { key: "status", header: "Status", options: Object.values(BookStatus).map((value) => ({ label: value, value })) },
          { key: "visibility", header: "Visibility", options: Object.values(BookVisibility).map((value) => ({ label: value, value })) },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (book) => navigate(AppRoute.bookOverview, { id: book._id }),
            hidden: !can(AppPermission.BOOK.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (book) => deleteMutation.mutate({ params: { id: book._id } }),
            hidden: !can(AppPermission.BOOK.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
