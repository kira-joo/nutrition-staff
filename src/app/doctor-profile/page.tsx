"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { UserRound } from "lucide-react";
import { getDoctorProfileEndpoint, updateDoctorProfileEndpoint } from "../../../api/doctor-profile.endpoints";
import { DoctorProfileForm } from "src/common/forms/doctor-profile-form";
import { DoctorProfileGallery } from "src/common/forms/doctor-profile/doctor-profile-gallery";
import { EntityName } from "src/common/authorization/entity-name.enum";

export default function DoctorProfilePage() {
  const doctorProfileQuery = useRequesterQuery({ endpoint: getDoctorProfileEndpoint });

  return (
    <QueryState query={doctorProfileQuery} entityName={EntityName.DOCTOR_PROFILE}>
      {(doctorProfile) => (
        <PageShell
          icon={UserRound}
          title="Doctor Profile"
          description="The doctor's public bio, program highlights, and photo gallery"
        >
          <div className="flex flex-col gap-6">
            <DoctorProfileForm defaultValues={doctorProfile} endpoint={updateDoctorProfileEndpoint} />
            <DoctorProfileGallery gallery={doctorProfile.gallery} onChanged={() => doctorProfileQuery.refetch()} />
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
