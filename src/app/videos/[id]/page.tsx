"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  AssetViewer,
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Pencil, Video as VideoIcon } from "lucide-react";
import { getVideoByIdEndpoint } from "../../../../api/video.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function VideoDetailsPage({ params }: { params: { id: string } }) {
  const videoQuery = useRequesterQuery({
    endpoint: getVideoByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={videoQuery}
      entityName={EntityName.VIDEO}
      backRoute={{ path: AppRoute.videos, label: "Back to Videos" }}
    >
      {(video) => (
        <PageShell
          icon={VideoIcon}
          title={video.title?.en || video.title?.ar || "Video"}
          badge={
            <Badge variant={video.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{video.status}</Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.videoUpdate}
              params={{ id: video._id }}
              permission={AppPermission.VIDEO.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={VideoIcon} title="Media">
              {video.video ? (
                <video controls poster={video.poster?.secureUrl} className="w-full rounded-md">
                  <source src={video.video.secureUrl} />
                </video>
              ) : video.poster ? (
                <AssetViewer image={{ asset: video.poster, label: video.title?.en || video.title?.ar || "Video poster" }} />
              ) : (
                <p className="text-sm text-slate-500">No uploaded video or poster.</p>
              )}
              {video.externalUrl ? <InfoRow label="External URL" value={video.externalUrl} /> : null}
            </PageSection>
            <PageSection icon={Activity} title="Status & activity">
              <div className="flex flex-col gap-3">
                <InfoRow label="Created" value={<DateText value={video.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={video.updatedAt} />} />
              </div>
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
