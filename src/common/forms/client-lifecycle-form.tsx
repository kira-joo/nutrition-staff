"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { ClientLifecycle } from "src/common/enums";
import { updateClientEndpoint } from "../../../api/client.endpoints";

export interface ClientLifecycleFormValues {
  lifecycle: ClientLifecycle;
}

export interface ClientLifecycleFormProps {
  clientId: string;
  currentLifecycle: ClientLifecycle;
  onSuccess: () => void;
}

/**
 * Single-field form for the "Change lifecycle" quick action. No enforced
 * transition state machine for v1 (per the plan) — any lifecycle is
 * selectable. Not yet auto-logged as a `ClientInteraction` (that wiring is
 * added in the CRM interactions checkpoint, on top of this same action).
 */
export function ClientLifecycleForm({ clientId, currentLifecycle, onSuccess }: ClientLifecycleFormProps) {
  const fields: FormFieldConfig<ClientLifecycleFormValues>[] = [
    {
      type: FieldType.SELECT,
      name: "lifecycle",
      label: "Lifecycle",
      options: Object.values(ClientLifecycle).map((v) => ({ label: v, value: v })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<ClientLifecycleFormValues, typeof updateClientEndpoint>
      sections={[{ fields }]}
      defaultValues={{ lifecycle: currentLifecycle }}
      submitEndpoint={updateClientEndpoint}
      submitParams={{ id: clientId }}
      onSuccess={() => {
        toast.success("Lifecycle updated");
        onSuccess();
      }}
    />
  );
}
