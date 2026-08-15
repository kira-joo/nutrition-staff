"use client";

import { downloadRequester, useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, CustomButton, Modal, QueryState, toast } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import { getBookByIdEndpoint } from "../../../../../api/book.endpoints";
import { getBookEditionsEndpoint, getBookPublishCheckEndpoint, publishBookEditionEndpoint, type PublishValidationIssue } from "../../../../../api/book-edition.endpoints";
import { downloadBookArtifactPdfEndpoint, generateBookArtifactEndpoint, getBookArtifactEndpoint, type BookArtifact } from "../../../../../api/book-artifact.endpoints";
import type { Book } from "src/common/interfaces/book.interface";
import type { BookEdition } from "src/common/interfaces/book-edition.interface";
import { BookStatus } from "src/common/enums";
import { resolveArtifactState, type ArtifactUiState } from "src/common/books/artifacts/resolve-artifact-state";

// Mirrors publish-book-edition.ts's own PUBLISHABLE_STATUSES exactly —
// PUBLISHED is a legitimate source state (publishing again freezes the
// current draft into a new Edition and moves currentEditionId forward,
// it never touches the Edition being replaced), so a book already
// showing a current Edition is NOT "locked out" of publishing; only
// ARCHIVED is genuinely blocked (un-archive to Draft first).
const PUBLISHABLE_STATUSES: BookStatus[] = [BookStatus.DRAFT, BookStatus.READY_FOR_REVIEW, BookStatus.PUBLISHED];

export default function BookEditionsPage({ params }: { params: { id: string } }) {
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });
  const editionsQuery = useRequesterQuery({ endpoint: getBookEditionsEndpoint, options: { params: { id: params.id } } });

  return (
    <QueryState query={bookQuery}>
      {(book) => (
        <div className="flex flex-col gap-6">
          <PublishPanel book={book} onPublished={() => { bookQuery.refetch(); editionsQuery.refetch(); }} />
          <EditionHistory bookId={params.id} editions={editionsQuery.data ?? []} loading={editionsQuery.isLoading} />
        </div>
      )}
    </QueryState>
  );
}

function PublishPanel({ book, onPublished }: { book: Book; onPublished: () => void }) {
  const [checkResult, setCheckResult] = useState<{ errors: PublishValidationIssue[]; warnings: PublishValidationIssue[] } | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);

  const checkQuery = useRequesterQuery({ endpoint: getBookPublishCheckEndpoint, options: { params: { id: book._id } }, queryOptions: { enabled: false } });
  const publishMutation = useRequesterMutation({
    endpoint: publishBookEditionEndpoint,
    onSuccess: () => {
      toast.success("Book published");
      setCheckResult(null);
      onPublished();
    },
    onError: (error: { message: string }) => toast.error(error.message),
  });

  const canPublish = PUBLISHABLE_STATUSES.includes(book.status);

  async function handleRunCheck(): Promise<void> {
    setChecking(true);
    try {
      const result = await checkQuery.refetch();
      if (result.data) {
        setCheckResult(result.data);
        setAcknowledged(new Set());
      }
    } finally {
      setChecking(false);
    }
  }

  function handleConfirmPublish(): void {
    if (!checkResult) return;
    publishMutation.mutate({
      params: { id: book._id },
      body: {
        expectedRevision: book.revision,
        expectedContentRevision: book.contentRevision,
        acknowledgedWarningCodes: [...acknowledged],
      },
    });
  }

  const allWarningsAcknowledged = checkResult ? checkResult.warnings.every((warning) => acknowledged.has(warning.code)) : false;

  return (
    <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Publishing</h3>
          <p className="text-sm text-slate-500">
            Status: <Badge variant="secondary">{book.status}</Badge> · Current edition: {book.editionCount > 0 ? `#${book.editionCount}` : "none yet"}
          </p>
        </div>
        {canPublish ? (
          <CustomButton type="button" loading={checking} onClick={handleRunCheck}>
            {book.editionCount > 0 ? "Publish New Edition" : "Check & Publish"}
          </CustomButton>
        ) : (
          <p className="text-sm text-slate-500">This book is archived — restore it to Draft before publishing.</p>
        )}
      </div>

      {checkResult ? (
        <Modal open onOpenChange={() => setCheckResult(null)} title="Publish checklist" size="lg">
          <div className="flex flex-col gap-4">
            {checkResult.errors.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-red-600">These issues must be resolved before publishing:</p>
                {checkResult.errors.map((error) => (
                  <div key={error.code} className="rounded-md bg-red-50 p-2 text-sm text-red-700">
                    {error.message}
                  </div>
                ))}
              </div>
            ) : null}

            {checkResult.warnings.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="font-medium text-amber-600">Please review and acknowledge these warnings:</p>
                {checkResult.warnings.map((warning) => (
                  <label key={warning.code} className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-sm text-amber-800">
                    <input
                      type="checkbox"
                      checked={acknowledged.has(warning.code)}
                      onChange={(event) => {
                        setAcknowledged((prev) => {
                          const next = new Set(prev);
                          if (event.target.checked) next.add(warning.code);
                          else next.delete(warning.code);
                          return next;
                        });
                      }}
                    />
                    <span>{warning.message}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {checkResult.errors.length === 0 && checkResult.warnings.length === 0 ? (
              <p className="text-sm text-slate-600">No issues found. This book is ready to publish.</p>
            ) : null}

            <CustomButton
              type="button"
              disabled={checkResult.errors.length > 0 || !allWarningsAcknowledged}
              loading={publishMutation.loading}
              onClick={handleConfirmPublish}
            >
              {book.editionCount > 0 ? "Confirm new edition" : "Confirm publish"}
            </CustomButton>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function EditionHistory({ bookId, editions, loading }: { bookId: string; editions: BookEdition[]; loading: boolean }) {
  const [viewing, setViewing] = useState<BookEdition | null>(null);

  if (loading) return <p className="text-sm text-slate-500">Loading editions…</p>;
  if (editions.length === 0) return <p className="text-sm text-slate-500">No editions published yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">الطبعات (Editions)</h3>
      {editions.map((edition) => (
        <button
          key={edition._id}
          type="button"
          onClick={() => setViewing(edition)}
          className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-right hover:bg-slate-50"
        >
          <span className="text-sm text-slate-500">{new Date(edition.publishedAt).toLocaleDateString()}</span>
          <span className="font-medium" dir="rtl">
            {edition.editionLabel ?? `Edition ${edition.editionNumber}`}
          </span>
        </button>
      ))}

      {viewing ? (
        <Modal open onOpenChange={() => setViewing(null)} title={viewing.editionLabel ?? `Edition ${viewing.editionNumber}`} size="lg">
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <strong>Title at publish:</strong> {viewing.titleAtPublish}
            </p>
            <p>
              <strong>Published:</strong> {new Date(viewing.publishedAt).toLocaleString()}
            </p>
            <p>
              <strong>Template version:</strong> {viewing.templateVersion}
            </p>
            <p>
              <strong>Chapters frozen:</strong> {viewing.content.chapters.length}
            </p>
            <p>
              <strong>Referenced assets:</strong> {viewing.referencedAssetPublicIds.length}
            </p>
            <p>
              <strong>Resolved doctor name:</strong> {viewing.resolvedSettings.doctorName || "—"}
            </p>
            {viewing.notes ? (
              <p>
                <strong>Notes:</strong> {viewing.notes}
              </p>
            ) : null}
            <p className="text-xs text-slate-400">This is a read-only historical snapshot — it can never be edited.</p>

            <ArtifactPanel bookId={bookId} edition={viewing} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

const ARTIFACT_STATE_BADGE_VARIANT: Record<ArtifactUiState, "success" | "secondary" | "warning" | "destructive"> = {
  NOT_GENERATED: "secondary",
  GENERATING: "warning",
  READY: "success",
  FAILED: "destructive",
  OUTDATED: "warning",
};

const ARTIFACT_STATE_LABEL: Record<ArtifactUiState, string> = {
  NOT_GENERATED: "Not generated",
  GENERATING: "Generating…",
  READY: "Ready",
  FAILED: "Failed",
  OUTDATED: "Outdated",
};

/**
 * PDF generation runs SYNCHRONOUSLY server-side (see the Phase F
 * report's S8/Vercel note) — `generateMutation` resolving IS the final
 * READY/FAILED outcome, not a "started" acknowledgement, so no polling
 * is needed here.
 */
function ArtifactPanel({ bookId, edition }: { bookId: string; edition: BookEdition }) {
  const artifactQuery = useRequesterQuery({ endpoint: getBookArtifactEndpoint, options: { params: { id: bookId, editionId: edition._id } } });
  const generateMutation = useRequesterMutation({
    endpoint: generateBookArtifactEndpoint,
    onSuccess: () => {
      toast.success("PDF generated");
      artifactQuery.refetch();
    },
    onError: (error: { message: string }) => {
      toast.error(error.message);
      artifactQuery.refetch();
    },
  });

  const artifact: BookArtifact | null | undefined = artifactQuery.data;
  const state = resolveArtifactState(artifact ?? null, edition.templateVersion);
  const canDownload = state === "READY" || state === "OUTDATED";

  async function handleDownload(): Promise<void> {
    try {
      await downloadRequester({
        endpoint: downloadBookArtifactPdfEndpoint,
        options: { params: { id: bookId, editionId: edition._id } },
        fileName: `${edition.titleAtPublish || "book"}.pdf`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download the PDF.");
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">PDF</span>
        <Badge variant={ARTIFACT_STATE_BADGE_VARIANT[state]}>{ARTIFACT_STATE_LABEL[state]}</Badge>
      </div>

      {artifact?.pageCount ? (
        <p className="text-xs text-slate-500">
          {artifact.pageCount} pages · {artifact.fileSize ? `${Math.round(artifact.fileSize / 1024)}KB` : "—"}
        </p>
      ) : null}

      {state === "FAILED" && artifact?.errorMessage ? <p className="text-xs text-red-600">Generation failed — you can try again.</p> : null}

      <div className="flex gap-2">
        <CustomButton
          type="button"
          size="sm"
          loading={generateMutation.loading}
          disabled={state === "GENERATING"}
          onClick={() => generateMutation.mutate({ params: { id: bookId, editionId: edition._id } })}
        >
          {state === "NOT_GENERATED" ? "Generate PDF" : "Regenerate PDF"}
        </CustomButton>
        <CustomButton type="button" size="sm" variant="secondary" disabled={!canDownload} onClick={handleDownload}>
          Download
        </CustomButton>
      </div>
    </div>
  );
}
