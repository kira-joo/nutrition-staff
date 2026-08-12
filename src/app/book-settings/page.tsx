"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Settings } from "lucide-react";
import { getBookSettingsEndpoint, updateBookSettingsEndpoint } from "../../../api/book-settings.endpoints";
import { BookSettingsForm } from "src/common/forms/book-settings-form";

export default function BookSettingsPage() {
  const settingsQuery = useRequesterQuery({ endpoint: getBookSettingsEndpoint });

  return (
    <PageShell
      icon={Settings}
      title="Book Settings"
      description="The default publishing identity for books — doctor name, bio, logo, contact, and print defaults. Separate from the website's Doctor Profile; a book may override any of these individually."
    >
      <QueryState query={settingsQuery}>
        {(settings) => <BookSettingsForm defaultValues={settings} endpoint={updateBookSettingsEndpoint} />}
      </QueryState>
    </PageShell>
  );
}
