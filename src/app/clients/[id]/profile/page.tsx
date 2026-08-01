"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ClientProfileForm } from "src/common/forms/client-profile-form";
import { getClientByIdEndpoint } from "../../../../../api/client.endpoints";

export default function ClientProfilePage({ params }: { params: { id: string } }) {
  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState query={clientQuery} entityName="Client">
      {(client) => <ClientProfileForm client={client} onSuccess={() => clientQuery.refetch()} />}
    </QueryState>
  );
}
