"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  CustomButton,
  DateText,
  DeltaIndicator,
  EmptyState,
  FeatureTable,
  Modal,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Plus, Ruler } from "lucide-react";
import { useRef, useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { ClientMeasurementForm } from "src/common/forms/client-measurement-form";
import { ClientMeasurement } from "src/common/interfaces/client-measurement.interface";
import {
  getClientMeasurementsEndpoint,
  updateClientMeasurementEndpoint,
} from "../../../../../api/client-measurement.endpoints";

export default function ClientMeasurementsPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const tableRef = useRef<FeatureTableHandle>(null);
  const [editingMeasurement, setEditingMeasurement] = useState<ClientMeasurement | null>(null);

  const latestTwoQuery = useRequesterQuery({
    endpoint: getClientMeasurementsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC, limit: 2, page: 1 },
    },
  });

  const [latest, previous] = latestTwoQuery.data?.data ?? [];

  const columns: TableColumn<ClientMeasurement>[] = [
    { key: "measuredAt", header: "Measured on", render: (m) => <DateText value={m.measuredAt} /> },
    { key: "weightKg", header: "Weight (kg)", render: (m) => m.weightKg ?? "—" },
    { key: "bmi", header: "BMI", render: (m) => m.bmi ?? "—" },
    { key: "waistCm", header: "Waist (cm)", render: (m) => m.waistCm ?? "—" },
    { key: "bodyFatPercentage", header: "Body fat (%)", render: (m) => m.bodyFatPercentage ?? "—" },
    { key: "recordedBy", header: "Recorded by", render: (m) => m.recordedByUserId.name },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {latest ? (
            <>
              {latest.weightKg !== undefined ? (
                <DeltaIndicator
                  current={latest.weightKg}
                  previous={previous?.weightKg}
                  unit="kg"
                  label="since last visit"
                />
              ) : null}
              {latest.waistCm !== undefined ? (
                <DeltaIndicator
                  current={latest.waistCm}
                  previous={previous?.waistCm}
                  unit="cm waist"
                  label="since last visit"
                />
              ) : null}
            </>
          ) : (
            <span className="text-sm text-slate-500">No measurements recorded yet</span>
          )}
        </div>
        {can(AppPermission.CLIENT_MEASUREMENT.CREATE) ? (
          <CustomButton
            leftIcon={Plus}
            onClick={() => navigate(AppRoute.clientMeasurementCreate, { id: params.id })}
          >
            Add measurement
          </CustomButton>
        ) : null}
      </div>

      {latest ? (
        <FeatureTable<ClientMeasurement, typeof getClientMeasurementsEndpoint>
          ref={tableRef}
          endpoint={getClientMeasurementsEndpoint}
          entityName="Measurements"
          query={{ clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC }}
          columns={columns}
          syncWithUrl={false}
          rowActions={[
            {
              label: "Edit",
              onClick: (measurement) => setEditingMeasurement(measurement),
              hidden: !can(AppPermission.CLIENT_MEASUREMENT.UPDATE),
            },
          ]}
        />
      ) : (
        <EmptyState
          icon={Ruler}
          title="No measurements yet"
          description="Add the client's first measurement to start tracking progress."
        />
      )}

      <Modal
        open={editingMeasurement !== null}
        onOpenChange={(open) => !open && setEditingMeasurement(null)}
        title="Edit measurement"
        size="lg"
      >
        {editingMeasurement ? (
          <ClientMeasurementForm
            clientProfileId={params.id}
            defaultValues={editingMeasurement}
            endpoint={updateClientMeasurementEndpoint}
            onSuccess={() => {
              setEditingMeasurement(null);
              tableRef.current?.refetch();
              latestTwoQuery.refetch();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
