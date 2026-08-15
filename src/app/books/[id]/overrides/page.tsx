"use client";

import { useRequesterMutation, useRequesterQuery, type ImageAsset, type UploadPolicy } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomImageAssetUpload, CustomInput, PageSection, QueryState, toast } from "@kira-joo/frontend-toolkit-tailwind";
import { useState } from "react";
import { getBookSettingsEndpoint } from "../../../../../api/book-settings.endpoints";
import { getBookByIdEndpoint, updateBookEndpoint } from "../../../../../api/book.endpoints";
import { ArrayFieldEditor } from "src/common/forms/array-field-editor";
import { OverrideField } from "src/common/forms/books/override-field";
import { BookMarginPreset, BookOverrideKey, BookPageSize } from "src/common/enums";
import type { BookContactBlock, BookPrintSettings, BookSettings } from "src/common/interfaces/book-settings.interface";
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

      <PageSection title="Contact">
        <OverrideField
          label="Contact"
          isOverridden={isOverridden(BookOverrideKey.CONTACT)}
          renderDefault={() => formatContact(settings.contact) || "—"}
          renderOverride={() => (
            <div className="grid grid-cols-2 gap-2">
              {(["phone", "whatsapp", "email", "address"] as const).map((field) => (
                <input
                  key={field}
                  className="rounded border px-2 py-1"
                  placeholder={field}
                  value={overrides.contact?.[field] ?? ""}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, contact: { ...prev.contact, [field]: e.target.value } }))}
                />
              ))}
            </div>
          )}
          // Contact resolves as a WHOLE-VALUE replace, not a partial merge
          // (see resolveBookIdentity: `overrides.contact ?? {}`, no spread
          // of settings.contact) — so overriding seeds the complete
          // inherited object as the starting point; there is no per-field
          // "inherit this one, override that one" for contact.
          onOverride={() => handleOverride(BookOverrideKey.CONTACT, { ...(settings.contact ?? {}) }, "contact")}
          onReset={() => handleReset(BookOverrideKey.CONTACT, "contact")}
        />
      </PageSection>

      <PageSection title="Print defaults">
        <OverrideField
          label="Print settings"
          isOverridden={isOverridden(BookOverrideKey.PRINT)}
          renderDefault={() => formatPrint(settings.print) || "—"}
          renderOverride={() => (
            <div className="grid grid-cols-2 gap-2">
              <select
                className="rounded border px-2 py-1"
                value={overrides.print?.pageSize ?? settings.print.pageSize}
                onChange={(e) => setOverrides((prev) => ({ ...prev, print: { ...prev.print, pageSize: e.target.value as BookPageSize } }))}
              >
                {Object.values(BookPageSize).map((value) => (
                  <option key={value} value={value}>
                    {value.toUpperCase()}
                  </option>
                ))}
              </select>
              <select
                className="rounded border px-2 py-1"
                value={overrides.print?.marginPreset ?? settings.print.marginPreset}
                onChange={(e) => setOverrides((prev) => ({ ...prev, print: { ...prev.print, marginPreset: e.target.value as BookMarginPreset } }))}
              >
                {Object.values(BookMarginPreset).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="rounded border px-2 py-1"
                placeholder="Gutter (mm)"
                value={overrides.print?.gutterMm ?? settings.print.gutterMm}
                onChange={(e) => setOverrides((prev) => ({ ...prev, print: { ...prev.print, gutterMm: Number(e.target.value) } }))}
              />
              <input
                type="number"
                className="rounded border px-2 py-1"
                placeholder="First page number"
                value={overrides.print?.pageNumberStart ?? settings.print.pageNumberStart}
                onChange={(e) => setOverrides((prev) => ({ ...prev, print: { ...prev.print, pageNumberStart: Number(e.target.value) } }))}
              />
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={overrides.print?.doublePageSpread ?? settings.print.doublePageSpread}
                  onChange={(e) => setOverrides((prev) => ({ ...prev, print: { ...prev.print, doublePageSpread: e.target.checked } }))}
                />
                Double-page spread preview
              </label>
            </div>
          )}
          // Print resolves as a PARTIAL MERGE (see resolveBookIdentity:
          // `{ ...settings.print, ...overrides.print }`) — seeding with the
          // full resolved object is still correct (a complete object is a
          // valid partial input), and any field the doctor leaves alone
          // here would fall back to the books default even if this seed
          // weren't complete.
          onOverride={() => handleOverride(BookOverrideKey.PRINT, { ...settings.print }, "print")}
          onReset={() => handleReset(BookOverrideKey.PRINT, "print")}
        />
      </PageSection>

      <CustomButton type="button" loading={saveMutation.loading} onClick={handleSave}>
        Save overrides
      </CustomButton>
    </div>
  );
}

function formatContact(contact: BookContactBlock | undefined): string {
  if (!contact) return "";
  return [contact.phone, contact.whatsapp, contact.email, contact.address].filter(Boolean).join(" · ");
}

function formatPrint(print: BookPrintSettings): string {
  return `${print.pageSize.toUpperCase()} · ${print.marginPreset} margins · ${print.gutterMm}mm gutter`;
}
