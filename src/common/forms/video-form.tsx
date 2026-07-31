"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Settings2, Video as VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { createVideoEndpoint, updateVideoEndpoint } from "../../../api/video.endpoints";
import { ContentStatus } from "../enums";
import { Video, VideoFormValues } from "../interfaces/video.interface";
import { AppRoute } from "../routes/app-route";
import { videoContentPolicy, videoPosterPolicy } from "../upload-policies";

export interface VideoFormProps {
  defaultValues?: Video;
  endpoint: typeof createVideoEndpoint | typeof updateVideoEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function VideoForm({ defaultValues, endpoint }: VideoFormProps) {
  const router = useRouter();

  const contentFields: FormFieldConfig<VideoFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    { type: FieldType.VIDEO_ASSET, name: "video", label: "Uploaded video", policy: videoContentPolicy },
    { type: FieldType.INPUT, name: "externalUrl", label: "External URL (e.g. a Facebook reel)", inputType: "url" },
    { type: FieldType.IMAGE_ASSET, name: "poster", label: "Poster / thumbnail override", policy: videoPosterPolicy },
  ];

  const detailsFields: FormFieldConfig<VideoFormValues>[] = [
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<VideoFormValues, typeof endpoint>
      sections={[
        { title: "Content", icon: VideoIcon, fields: contentFields },
        { title: "Details", icon: Settings2, fields: detailsFields },
      ]}
      defaultValues={{
        title: defaultValues?.title ?? EMPTY_LOCALIZED,
        video: defaultValues?.video ?? null,
        externalUrl: defaultValues?.externalUrl,
        poster: defaultValues?.poster ?? null,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Video saved successfully");
        router.push(AppRoute.videos);
      }}
      layout="grid"
      columns={2}
    />
  );
}
