"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { updateClientEndpoint } from "../../../api/client.endpoints";

interface ScheduleFollowUpFormValues {
  nextFollowUpAt?: string;
}

export interface ScheduleFollowUpFormProps {
  clientId: string;
  currentNextFollowUpAt?: string;
  onSuccess: () => void;
}

/**
 * A dedicated quick action for rescheduling a follow-up on its own —
 * distinct from logging a full interaction (Add interaction), for the
 * common case of just bumping a date without a new contact record.
 * Writes directly to ClientProfile.nextFollowUpAt via the same field an
 * interaction's write-through also updates — one field, two ways to set
 * it, never two sources of truth.
 */
export function ScheduleFollowUpForm({ clientId, currentNextFollowUpAt, onSuccess }: ScheduleFollowUpFormProps) {
  const fields: FormFieldConfig<ScheduleFollowUpFormValues>[] = [
    { type: FieldType.DATE, name: "nextFollowUpAt", label: "Next follow-up date" },
  ];

  return (
    <CustomForm<ScheduleFollowUpFormValues, typeof updateClientEndpoint>
      sections={[{ fields }]}
      defaultValues={{ nextFollowUpAt: currentNextFollowUpAt }}
      submitEndpoint={updateClientEndpoint}
      submitParams={{ id: clientId }}
      submitButtonText="Save"
      onSuccess={() => {
        toast.success("Follow-up updated");
        onSuccess();
      }}
    />
  );
}
