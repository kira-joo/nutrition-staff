"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { Package as PackageIcon } from "lucide-react";
import { createPackageEndpoint } from "../../../../api/package.endpoints";
import { PackageForm } from "src/common/forms/package-form";
import { AppRoute } from "src/common/routes/app-route";

export default function PackageCreatePage() {
  return (
    <PageShell
      icon={PackageIcon}
      title="Create Package"
      description="Add a new membership package"
      backRoute={{ path: AppRoute.packages, label: "Back to Packages" }}
    >
      <PackageForm endpoint={createPackageEndpoint} />
    </PageShell>
  );
}
