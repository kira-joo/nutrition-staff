"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { InteractionType } from "../enums";
import type {
  createClientInteractionEndpoint,
  updateClientInteractionEndpoint,
} from "../../../api/client-interaction.endpoints";
import { ClientInteraction, CreateClientInteractionDto } from "../interfaces/client-interaction.interface";

/** `LIFECYCLE_CHANGE` is deliberately excluded — it's only ever auto-logged, never manually chosen. */
const MANUAL_INTERACTION_TYPES = Object.values(InteractionType).filter((type) => type !== InteractionType.LIFECYCLE_CHANGE);

export interface ClientInteractionFormProps {
  clientProfileId: string;
  defaultValues?: ClientInteraction;
  endpoint: typeof createClientInteractionEndpoint | typeof updateClientInteractionEndpoint;
  onSuccess: () => void;
}

/**
 * Manual interaction logging only — system-generated entries (lifecycle
 * changes) never reach this form; the Interactions page blocks editing
 * them entirely. `type` is only shown when creating — like
 * `UpdateClientInteractionDto`, editing never reassigns it.
 */
export function ClientInteractionForm({ clientProfileId, defaultValues, endpoint, onSuccess }: ClientInteractionFormProps) {
  const fields: FormFieldConfig<CreateClientInteractionDto>[] = [
    ...(defaultValues
      ? []
      : [
          {
            type: FieldType.SELECT,
            name: "type",
            label: "Type",
            options: MANUAL_INTERACTION_TYPES.map((v) => ({ label: v, value: v })),
            rules: { required: true },
          } satisfies FormFieldConfig<CreateClientInteractionDto>,
        ]),
    { type: FieldType.TEXTAREA, name: "summary", label: "Summary", rules: { required: true } },
    { type: FieldType.DATE, name: "happenedAt", label: "Happened on", includeTime: true },
    { type: FieldType.DATE, name: "nextFollowUpAt", label: "Next follow-up (optional)", includeTime: true },
  ];

  return (
    <CustomForm<CreateClientInteractionDto, typeof endpoint>
      sections={[{ fields }]}
      defaultValues={defaultValues ?? { clientProfileId }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      transformValues={(values) => (defaultValues ? values : { ...values, clientProfileId })}
      onSuccess={() => {
        toast.success("Interaction saved");
        onSuccess();
      }}
    />
  );
}
