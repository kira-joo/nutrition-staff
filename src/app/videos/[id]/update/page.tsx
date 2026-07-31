"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Video as VideoIcon } from "lucide-react";
import { getVideoByIdEndpoint, updateVideoEndpoint } from "../../../../../api/video.endpoints";
import { VideoForm } from "src/common/forms/video-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function VideoUpdatePage({ params }: { params: { id: string } }) {
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
        <PageShell icon={VideoIcon} title="Update Video" description="Update video content">
          <VideoForm defaultValues={video} endpoint={updateVideoEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
