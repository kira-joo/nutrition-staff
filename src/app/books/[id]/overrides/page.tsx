"use client";

import { useRequesterMutation, useRequesterQuery, type ImageAsset, type UploadPolicy } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomImageAssetUpload, CustomInput, PageSection, QueryState, toast } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import { getBookSettingsEndpoint } from "../../../../../api/book-settings.endpoints";
import { getBookByIdEndpoint, updateBookEndpoint } from "../../../../../api/book.endpoints";
import { ArrayFieldEditor } from "src/common/forms/array-field-editor";
import { OverrideField } from "src/common/forms/books/override-field";
import { BookOverrideKey } from "src/common/enums";
import type { BookSettings } from "src/common/interfaces/book-settings.interface";
import type { BookOverrides } from "src/common/interfaces/book.interface";
import { bookLogoPolicy, bookPortraitPolicy } from "src/common/upload-policies";

interface LocalOverrides extends Omit<BookOverrides, "doctorImage" | "bookLogo"> {
  doctorImage?: ImageAsset | File | null;
  bookLogo?: ImageAsset | File | null;
}

const SIMPLE_TEXT_KEYS: { key: BookOverrideKey; label: string }[] = [
  { key: BookOverrideKey.DOCTOR_NAME, label: "Doctor name (for books)" },
  { key: BookOverrideKey.DOCTOR_TITLE, label: "Professional title (for books)" },
  { key: BookOverrideKey.WEBSITE_URL, label: "Website URL" },
  { key: BookOverrideKey.QR_DESTINATION, label: "QR destination" },
];

const TEXTAREA_KEYS: { key: BookOverrideKey; label: string }[] = [
  { key: BookOverrideKey.DOCTOR_BIO, label: "Short bio (for books)" },
  { key: BookOverrideKey.DISCLAIMER, label: "Disclaimer" },
  { key: BookOverrideKey.COPYRIGHT_TEXT, label: "Copyright text" },
  { key: BookOverrideKey.BACK_COVER_CLOSING_TEXT, label: "Back cover closing message" },
  { key: BookOverrideKey.BACK_COVER_AUDIENCE_TEXT, label: "Back cover — who this guide is for" },
];

export default function BookOverridesPage({ params }: { params: { id: string } }) {
  const bookQuery = useRequesterQuery({ endpoint: getBookByIdEndpoint, options: { params: { id: params.id } } });
  const settingsQuery = useRequesterQuery({ endpoint: getBookSettingsEndpoint });

  return (
    <QueryState query={bookQuery} entityName="Book">
      {(book) => (
        <QueryState query={settingsQuery} entityName="Book Settings">
          {(settings) => (
            <OverridesEditor
              bookId={book._id}
              revision={book.revision}
              initialOverrides={book.overrides}
              initialOverriddenFields={book.overriddenFields}
              settings={settings}
              onSaved={() => bookQuery.refetch()}
            />
          )}
        </QueryState>
      )}
    </QueryState>
  );
}

function OverridesEditor({
  bookId,
  revision,
  initialOverrides,
  initialOverriddenFields,
  settings,
  onSaved,
}: {
  bookId: string;
  revision: number;
  initialOverrides: BookOverrides;
  initialOverriddenFields: BookOverrideKey[];
  settings: BookSettings;
  onSaved: () => void;
}) {
  const [overrides, setOverrides] = useState<LocalOverrides>(initialOverrides ?? {});
  const [overriddenFields, setOverriddenFields] = useState<BookOverrideKey[]>(initialOverriddenFields ?? []);

  const saveMutation = useRequesterMutation({
    endpoint: updateBookEndpoint,
    onSuccess: () => {
      toast.success("Overrides saved");
      onSaved();
    },
  });

  function isOverridden(key: BookOverrideKey): boolean {
    return overriddenFields.includes(key);
  }

  function defaultValueFor(key: BookOverrideKey): string | undefined {
    switch (key) {
      case BookOverrideKey.DOCTOR_NAME:
        return settings.doctorName;
      case BookOverrideKey.DOCTOR_TITLE:
        return settings.doctorTitle;
      case BookOverrideKey.DOCTOR_BIO:
        return settings.doctorBio;
      case BookOverrideKey.WEBSITE_URL:
        return settings.websiteUrl;
      case BookOverrideKey.QR_DESTINATION:
        return settings.defaultQrDestination;
      case BookOverrideKey.DISCLAIMER:
        return settings.disclaimer;
      case BookOverrideKey.COPYRIGHT_TEXT:
        return settings.copyrightText;
      case BookOverrideKey.BACK_COVER_CLOSING_TEXT:
        return settings.backCoverClosingText;
      case BookOverrideKey.BACK_COVER_AUDIENCE_TEXT:
        return settings.backCoverAudienceText;
      default:
        return undefined;
    }
  }

  function handleOverride(key: BookOverrideKey, seedValue: unknown, targetField: keyof LocalOverrides): void {
    setOverriddenFields((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setOverrides((prev) => ({ ...prev, [targetField]: seedValue }));
  }

  function handleReset(key: BookOverrideKey, targetField: keyof LocalOverrides): void {
    setOverriddenFields((prev) => prev.filter((k) => k !== key));
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[targetField];
      return next;
    });
  }

  function handleSave(): void {
    const { doctorImage, bookLogo, ...restOverrides } = overrides;

    const jsonOverrides: Record<string, unknown> = { ...restOverrides };
    // A File is pulled out and sent as its own multipart field (dotted
    // name matching BOOK_ASSET_FIELDS); an unchanged ImageAsset or an
    // explicit `null` (clear) stays in the JSON payload as-is.
    if (!(doctorImage instanceof File)) jsonOverrides.doctorImage = doctorImage ?? null;
    if (!(bookLogo instanceof File)) jsonOverrides.bookLogo = bookLogo ?? null;

    const payload = { overrides: jsonOverrides, overriddenFields, expectedRevision: revision };

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    if (doctorImage instanceof File) formData.set("overrides.doctorImage", doctorImage);
    if (bookLogo instanceof File) formData.set("overrides.bookLogo", bookLogo);

    saveMutation.mutate({ params: { id: bookId }, body: formData as unknown as Record<string, unknown> });
  }

  return (
    <div className="space-y-4">
      <PageSection title="Doctor identity & links">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SIMPLE_TEXT_KEYS.map(({ key, label }) => (
            <OverrideField
              key={key}
              label={label}
              isOverridden={isOverridden(key)}
              renderDefault={() => defaultValueFor(key) || "—"}
              renderOverride={() => (
                <CustomInput
                  dir="rtl"
                  value={(overrides[key as keyof BookOverrides] as string) ?? ""}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              )}
              onOverride={() => handleOverride(key, defaultValueFor(key) ?? "", key as keyof LocalOverrides)}
              onReset={() => handleReset(key, key as keyof LocalOverrides)}
            />
          ))}
        </div>
      </PageSection>

      <PageSection title="Text content">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEXTAREA_KEYS.map(({ key, label }) => (
            <OverrideField
              key={key}
              label={label}
              isOverridden={isOverridden(key)}
              renderDefault={() => defaultValueFor(key) || "—"}
              renderOverride={() => (
                <textarea
                  dir="rtl"
                  rows={3}
                  className="w-full rounded border px-2 py-1"
                  value={(overrides[key as keyof BookOverrides] as string) ?? ""}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              )}
              onOverride={() => handleOverride(key, defaultValueFor(key) ?? "", key as keyof LocalOverrides)}
              onReset={() => handleReset(key, key as keyof LocalOverrides)}
            />
          ))}
        </div>
      </PageSection>

      <PageSection title="Images">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <OverrideField
            label="Doctor image"
            isOverridden={isOverridden(BookOverrideKey.DOCTOR_IMAGE)}
            renderDefault={() =>
              settings.doctorImage ? <img src={settings.doctorImage.secureUrl} alt="" className="h-24 w-24 rounded object-cover" /> : "—"
            }
            renderOverride={() => (
              <CustomImageAssetUpload
                value={overrides.doctorImage ?? null}
                policy={bookPortraitPolicy as UploadPolicy}
                onChange={(file: File | null) => setOverrides((prev) => ({ ...prev, doctorImage: file }))}
              />
            )}
            onOverride={() => handleOverride(BookOverrideKey.DOCTOR_IMAGE, settings.doctorImage ?? null, "doctorImage")}
            onReset={() => handleReset(BookOverrideKey.DOCTOR_IMAGE, "doctorImage")}
          />
          <OverrideField
            label="Book logo"
            isOverridden={isOverridden(BookOverrideKey.BOOK_LOGO)}
            renderDefault={() => (settings.bookLogo ? <img src={settings.bookLogo.secureUrl} alt="" className="h-24 w-24 rounded object-cover" /> : "—")}
            renderOverride={() => (
              <CustomImageAssetUpload
                value={overrides.bookLogo ?? null}
                policy={bookLogoPolicy as UploadPolicy}
                onChange={(file: File | null) => setOverrides((prev) => ({ ...prev, bookLogo: file }))}
              />
            )}
            onOverride={() => handleOverride(BookOverrideKey.BOOK_LOGO, settings.bookLogo ?? null, "bookLogo")}
            onReset={() => handleReset(BookOverrideKey.BOOK_LOGO, "bookLogo")}
          />
        </div>
      </PageSection>

      <PageSection title="Social links">
        <OverrideField
          label="Social links"
          isOverridden={isOverridden(BookOverrideKey.SOCIAL_LINKS)}
          renderDefault={() => (settings.socialLinks?.length ? settings.socialLinks.map((l) => l.platform).join(", ") : "—")}
          renderOverride={() => (
            <ArrayFieldEditor
              items={overrides.socialLinks ?? []}
              onChange={(items) => setOverrides((prev) => ({ ...prev, socialLinks: items }))}
              createItem={() => ({ platform: "", url: "", order: 0 })}
              addLabel="Add social link"
              emptyLabel="No overridden social links yet."
              renderItem={(item, _index, update) => (
                <div className="grid grid-cols-2 gap-2">
                  <input className="rounded border px-2 py-1" placeholder="Platform" value={item.platform} onChange={(e) => update({ platform: e.target.value })} />
                  <input className="rounded border px-2 py-1" placeholder="URL" value={item.url} onChange={(e) => update({ url: e.target.value })} />
                </div>
              )}
            />
          )}
          onOverride={() => handleOverride(BookOverrideKey.SOCIAL_LINKS, settings.socialLinks ?? [], "socialLinks")}
          onReset={() => handleReset(BookOverrideKey.SOCIAL_LINKS, "socialLinks")}
        />
      </PageSection>

      <CustomButton type="button" loading={saveMutation.loading} onClick={handleSave}>
        Save overrides
      </CustomButton>
    </div>
  );
}
