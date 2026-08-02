"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Ruler } from "lucide-react";
import { ClientMeasurementForm } from "src/common/forms/client-measurement-form";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../../api/client.endpoints";
import { createClientMeasurementEndpoint } from "../../../../../../api/client-measurement.endpoints";

export default function ClientMeasurementCreatePage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={clientQuery}
      entityName="Client"
      backRoute={{ path: AppRoute.clientMeasurements, label: "Back to Measurements", params: { id: params.id } }}
    >
      {() => (
        <PageShell icon={Ruler} title="Add Measurement">
          <ClientMeasurementForm
            clientProfileId={params.id}
            endpoint={createClientMeasurementEndpoint}
            onSuccess={() => navigate(AppRoute.clientMeasurements, { id: params.id })}
          />
        </PageShell>
      )}
    </QueryState>
  );
}
