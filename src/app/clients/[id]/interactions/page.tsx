"use client";

import { SortOrder, useRequesterMutation, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  CustomButton,
  DateText,
  EmptyState,
  Modal,
  Timeline,
  type TimelineItem,
} from "@kira-joo/frontend-toolkit-tailwind";
import {
  CalendarClock,
  History,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { InteractionType } from "src/common/enums";
import { ClientInteractionForm } from "src/common/forms/client-interaction-form";
import { ClientInteraction } from "src/common/interfaces/client-interaction.interface";
import {
  createClientInteractionEndpoint,
  deleteClientInteractionEndpoint,
  getClientInteractionsEndpoint,
  updateClientInteractionEndpoint,
} from "../../../../../api/client-interaction.endpoints";

const TYPE_ICONS: Record<InteractionType, typeof Phone> = {
  [InteractionType.CALL]: Phone,
  [InteractionType.WHATSAPP]: MessageCircle,
  [InteractionType.MESSAGE]: MessageSquare,
  [InteractionType.EMAIL]: Mail,
  [InteractionType.MEETING]: Users,
  [InteractionType.NOTE]: StickyNote,
  [InteractionType.LIFECYCLE_CHANGE]: History,
  [InteractionType.OTHER]: MoreHorizontal,
};

export default function ClientInteractionsPage({ params }: { params: { id: string } }) {
  const { can } = usePermissions();
  const [dialogState, setDialogState] = useState<{ open: boolean; interaction?: ClientInteraction }>({ open: false });

  const interactionsQuery = useRequesterQuery({
    endpoint: getClientInteractionsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "happenedAt", sortOrder: SortOrder.DESC, limit: 50, page: 1 },
    },
  });

  const deleteMutation = useRequesterMutation({
    endpoint: deleteClientInteractionEndpoint,
    onSuccess: () => interactionsQuery.refetch(),
  });

  const interactions = interactionsQuery.data?.data ?? [];

  const timelineItems: TimelineItem[] = interactions.map((interaction) => {
    const systemGenerated = interaction.isSystemGenerated;
    return {
      id: interaction._id,
      icon: TYPE_ICONS[interaction.type],
      markerClassName: systemGenerated ? "bg-slate-100" : undefined,
      content: (
        <div className={`flex items-start justify-between gap-4 ${systemGenerated ? "text-slate-500" : ""}`}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${systemGenerated ? "italic text-slate-500" : "text-slate-900"}`}>
                {interaction.summary}
              </span>
              {systemGenerated ? <Badge variant="secondary">System</Badge> : null}
            </div>
            <span className="text-xs text-slate-500">
              <DateText value={interaction.happenedAt} /> · {interaction.createdByUserId.name}
            </span>
            {interaction.nextFollowUpAt ? (
              <span className="inline-flex w-fit items-center gap-1 text-xs text-amber-700">
                <CalendarClock className="h-3 w-3" /> Follow-up: <DateText value={interaction.nextFollowUpAt} />
              </span>
            ) : null}
          </div>
          {!systemGenerated ? (
            <div className="flex gap-1">
              {can(AppPermission.CLIENT_INTERACTION.UPDATE) ? (
                <button
                  type="button"
                  className="text-slate-400 hover:text-slate-700"
                  onClick={() => setDialogState({ open: true, interaction })}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              {can(AppPermission.CLIENT_INTERACTION.DELETE) ? (
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => deleteMutation.mutate({ params: { id: interaction._id } })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {can(AppPermission.CLIENT_INTERACTION.CREATE) ? (
          <CustomButton leftIcon={Plus} onClick={() => setDialogState({ open: true })}>
            Add interaction
          </CustomButton>
        ) : null}
      </div>

      <Timeline
        items={timelineItems}
        emptyState={
          <EmptyState
            icon={MessageSquare}
            title="No interactions yet"
            description="Log calls, messages, meetings, and notes here to build this client's contact history."
          />
        }
      />

      <Modal
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        title={dialogState.interaction ? "Edit interaction" : "Add interaction"}
      >
        <ClientInteractionForm
          clientProfileId={params.id}
          defaultValues={dialogState.interaction}
          endpoint={dialogState.interaction ? updateClientInteractionEndpoint : createClientInteractionEndpoint}
          onSuccess={() => {
            setDialogState({ open: false });
            interactionsQuery.refetch();
          }}
        />
      </Modal>
    </div>
  );
}
