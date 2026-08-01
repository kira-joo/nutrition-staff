"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, DateText, InfoRow, Modal, PageSection, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, CalendarClock, Contact, FlaskConical, NotebookPen, Repeat, Ruler } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ClientLifecycleForm } from "src/common/forms/client-lifecycle-form";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../api/client.endpoints";
import { getClientMeasurementsEndpoint } from "../../../../../api/client-measurement.endpoints";
import { SortOrder } from "@kira-joo/frontend-toolkit-core";

/** Derived, not stored — a quick "how ready is this record" signal for staff, based on what's filled in so far. */
function profileCompleteness(client: {
  dateOfBirth?: string;
  gender?: string;
  heightCm?: number;
  source?: string;
}, hasMeasurement: boolean): { filled: number; total: number } {
  const checks = [client.dateOfBirth, client.gender, client.heightCm, client.source, hasMeasurement];
  return { filled: checks.filter(Boolean).length, total: checks.length };
}

export default function ClientOverviewPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [lifecycleDialogOpen, setLifecycleDialogOpen] = useState(false);

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const latestMeasurementQuery = useRequesterQuery({
    endpoint: getClientMeasurementsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC, limit: 1, page: 1 },
    },
  });
  const latestMeasurement = latestMeasurementQuery.data?.data[0];

  return (
    <QueryState query={clientQuery} entityName="Client">
      {(client) => {
        const completeness = profileCompleteness(client, Boolean(latestMeasurement));

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <CustomButton
                variant="outline"
                leftIcon={Repeat}
                onClick={() => setLifecycleDialogOpen(true)}
                disabled={!can(AppPermission.CLIENT.UPDATE)}
              >
                Change lifecycle
              </CustomButton>
              <CustomButton variant="outline" onClick={() => navigate(AppRoute.clientProfile, { id: params.id })}>
                Edit profile
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={Ruler}
                onClick={() => navigate(AppRoute.clientMeasurements, { id: params.id })}
                disabled={!can(AppPermission.CLIENT_MEASUREMENT.CREATE)}
              >
                Add measurement
              </CustomButton>
              <CustomButton variant="outline" leftIcon={NotebookPen} disabled title="Available once the Assessments checkpoint ships">
                Create assessment
              </CustomButton>
              <CustomButton variant="outline" leftIcon={FlaskConical} disabled title="Available once the Calculation Workspace checkpoint ships">
                Run calculator
              </CustomButton>
              <CustomButton variant="outline" leftIcon={CalendarClock} disabled title="Available once the Interactions checkpoint ships">
                Add interaction
              </CustomButton>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PageSection icon={Contact} title="Contact & CRM">
                <div className="flex flex-col gap-3">
                  <InfoRow label="Phone" value={client.userId.phone ?? "—"} />
                  <InfoRow label="Email" value={client.userId.email ?? "—"} />
                  <InfoRow label="Source" value={client.source ?? "—"} />
                  <InfoRow label="Assigned to" value={client.assignedToUserId?.name ?? "—"} />
                  <InfoRow label="Tags" value={client.tags.length > 0 ? client.tags.join(", ") : "—"} />
                </div>
              </PageSection>
              <PageSection icon={Activity} title="Status & activity">
                <div className="flex flex-col gap-3">
                  <InfoRow
                    label="Next follow-up"
                    value={client.nextFollowUpAt ? <DateText value={client.nextFollowUpAt} /> : "Not scheduled"}
                  />
                  <InfoRow
                    label="Last contacted"
                    value={client.lastContactedAt ? <DateText value={client.lastContactedAt} /> : "Never"}
                  />
                  <InfoRow label="Profile completeness" value={`${completeness.filled}/${completeness.total} fields`} />
                  <InfoRow label="Created" value={<DateText value={client.createdAt} />} />
                </div>
              </PageSection>
              <PageSection icon={Ruler} title="Latest measurement">
                {latestMeasurement ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Measured on" value={<DateText value={latestMeasurement.measuredAt} />} />
                    <InfoRow label="Weight" value={latestMeasurement.weightKg ? `${latestMeasurement.weightKg} kg` : "—"} />
                    <InfoRow label="BMI" value={latestMeasurement.bmi ?? "—"} />
                    <InfoRow label="Waist" value={latestMeasurement.waistCm ? `${latestMeasurement.waistCm} cm` : "—"} />
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No measurements recorded yet.</p>
                )}
              </PageSection>
            </div>

            <Modal open={lifecycleDialogOpen} onOpenChange={setLifecycleDialogOpen} title="Change lifecycle">
              <ClientLifecycleForm
                clientId={client._id}
                currentLifecycle={client.lifecycle}
                onSuccess={() => {
                  setLifecycleDialogOpen(false);
                  clientQuery.refetch();
                }}
              />
            </Modal>
          </div>
        );
      }}
    </QueryState>
  );
}
