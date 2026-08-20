"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Pencil, Plus, Trash2, Video as VideoIcon } from "lucide-react";
import { useRef } from "react";
import { deleteVideoEndpoint, getVideosEndpoint } from "../../../api/video.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { Video } from "src/common/interfaces/video.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function VideosPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteVideoEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Video>[] = [
    {
      key: "title",
      header: "Title",
      render: (video) => (
        <AppLink path={AppRoute.videoDetails} params={{ id: video._id }}>
          {video.title?.en || video.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    { key: "source", header: "Source", render: (video) => (video.video ? "Uploaded" : "External") },
    {
      key: "status",
      header: "Status",
      render: (video) => (
        <Badge variant={video.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{video.status}</Badge>
      ),
    },
  ];

  return (
    <PageShell
      icon={VideoIcon}
      title="Videos"
      description="Videos shown on the public site — uploaded or linked externally"
      actions={
        <RouteButton path={AppRoute.videoCreate} permission={AppPermission.VIDEO.CREATE} leftIcon={Plus}>
          Add Video
        </RouteButton>
      }
    >
      <FeatureTable<Video, typeof getVideosEndpoint>
        ref={tableRef}
        endpoint={getVideosEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.VIDEO]}
        filters={[
          {
            key: "status",
            header: "Status",
            options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (video) => navigate(AppRoute.videoUpdate, { id: video._id }),
            hidden: !can(AppPermission.VIDEO.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            // Names the video rather than saying "this item": the row that was
            // clicked and the row someone meant to click are not always the same.
            confirm: (video) => ({
              title: `Delete ${video.title?.en || video.title?.ar || "this video"}?`,
              description: "This permanently deletes the video and cannot be undone.",
              confirmLabel: "Delete",
            }),
            // `mutateAsync`, so the table can await the real request and show an
            // executing state instead of clearing the moment the click lands.
            onClick: (video) => deleteMutation.mutateAsync({ params: { id: video._id } }),
            hidden: !can(AppPermission.VIDEO.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
