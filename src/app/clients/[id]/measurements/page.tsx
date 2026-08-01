"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  DateText,
  EmptyState,
  FeatureTable,
  Modal,
  CustomButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowDown, ArrowUp, Minus, Plus, Ruler } from "lucide-react";
import { useRef, useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ClientMeasurementForm } from "src/common/forms/client-measurement-form";
import { ClientMeasurement } from "src/common/interfaces/client-measurement.interface";
import {
  createClientMeasurementEndpoint,
  getClientMeasurementsEndpoint,
  updateClientMeasurementEndpoint,
} from "../../../../../api/client-measurement.endpoints";

function DeltaBadge({ current, previous, unit }: { current?: number; previous?: number; unit: string }) {
  if (current === undefined || previous === undefined) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-slate-500">
        <Minus className="h-3 w-3" /> No change since last visit
      </span>
    );
  }
  const isIncrease = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-sm ${isIncrease ? "text-amber-600" : "text-emerald-600"}`}>
      {isIncrease ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {isIncrease ? "+" : ""}
      {delta} {unit} since last visit
    </span>
  );
}

export default function ClientMeasurementsPage({ params }: { params: { id: string } }) {
  const { can } = usePermissions();
  const tableRef = useRef<FeatureTableHandle>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; measurement?: ClientMeasurement }>({ open: false });

  const latestTwoQuery = useRequesterQuery({
    endpoint: getClientMeasurementsEndpoint,
    options: { query: { clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC, limit: 2, page: 1 } },
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
              <DeltaBadge current={latest.weightKg} previous={previous?.weightKg} unit="kg" />
              <DeltaBadge current={latest.waistCm} previous={previous?.waistCm} unit="cm waist" />
            </>
          ) : (
            <span className="text-sm text-slate-500">No measurements recorded yet</span>
          )}
        </div>
        {can(AppPermission.CLIENT_MEASUREMENT.CREATE) ? (
          <CustomButton leftIcon={Plus} onClick={() => setDialogState({ open: true })}>
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
              onClick: (measurement) => setDialogState({ open: true, measurement }),
              hidden: !can(AppPermission.CLIENT_MEASUREMENT.UPDATE),
            },
          ]}
        />
      ) : (
        <EmptyState icon={Ruler} title="No measurements yet" description="Add the client's first measurement to start tracking progress." />
      )}

      <Modal
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        title={dialogState.measurement ? "Edit measurement" : "Add measurement"}
        size="lg"
      >
        <ClientMeasurementForm
          clientProfileId={params.id}
          defaultValues={dialogState.measurement}
          endpoint={dialogState.measurement ? updateClientMeasurementEndpoint : createClientMeasurementEndpoint}
          onSuccess={() => {
            setDialogState({ open: false });
            tableRef.current?.refetch();
            latestTwoQuery.refetch();
          }}
        />
      </Modal>
    </div>
  );
}
