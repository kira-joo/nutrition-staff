"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { Video as VideoIcon } from "lucide-react";
import { createVideoEndpoint } from "../../../../api/video.endpoints";
import { VideoForm } from "src/common/forms/video-form";
import { AppRoute } from "src/common/routes/app-route";

export default function VideoCreatePage() {
  return (
    <PageShell
      icon={VideoIcon}
      title="Create Video"
      description="Add a new video"
      backRoute={{ path: AppRoute.videos, label: "Back to Videos" }}
    >
      <VideoForm endpoint={createVideoEndpoint} />
    </PageShell>
  );
}
