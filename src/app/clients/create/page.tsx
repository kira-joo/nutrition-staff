"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { UserRoundCog } from "lucide-react";
import { ClientForm } from "src/common/forms/client-form";
import { AppRoute } from "src/common/routes/app-route";
import { createClientEndpoint } from "../../../../api/client.endpoints";

export default function ClientCreatePage() {
  return (
    <PageShell icon={UserRoundCog} title="Add Client" backRoute={{ path: AppRoute.clients, label: "Back to Clients" }}>
      <ClientForm endpoint={createClientEndpoint} />
    </PageShell>
  );
}
