"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { upsertStaffProfileEndpoint } from "../../../api/staff-profile.endpoints";
import { UpsertStaffProfileDto } from "../interfaces/staff-profile.interface";

export interface StaffProfileFormProps {
  userId: string;
  defaultValues?: UpsertStaffProfileDto;
  onSuccess: () => void;
}

/** Small upsert form for a User's employment details — create-if-missing, else update, via the same PUT endpoint either way. */
export function StaffProfileForm({ userId, defaultValues, onSuccess }: StaffProfileFormProps) {
  const fields: FormFieldConfig<UpsertStaffProfileDto>[] = [
    { type: FieldType.INPUT, name: "salary", label: "Salary", inputType: "number" },
    { type: FieldType.DATE, name: "joinedAt", label: "Joined At" },
  ];

  return (
    <CustomForm<UpsertStaffProfileDto, typeof upsertStaffProfileEndpoint>
      sections={[{ fields }]}
      defaultValues={defaultValues}
      submitEndpoint={upsertStaffProfileEndpoint}
      submitParams={{ userId }}
      onSuccess={() => {
        toast.success("Staff details saved");
        onSuccess();
      }}
    />
  );
}
