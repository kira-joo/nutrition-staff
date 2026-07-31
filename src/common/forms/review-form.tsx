"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Image as ImageIcon, MessageSquareText, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { createReviewEndpoint, updateReviewEndpoint } from "../../../api/review.endpoints";
import { ContentStatus } from "../enums";
import { Review, ReviewFormValues } from "../interfaces/review.interface";
import { AppRoute } from "../routes/app-route";
import { reviewImagePolicy } from "../upload-policies";

export interface ReviewFormProps {
  defaultValues?: Review;
  endpoint: typeof createReviewEndpoint | typeof updateReviewEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function ReviewForm({ defaultValues, endpoint }: ReviewFormProps) {
  const router = useRouter();

  const contentFields: FormFieldConfig<ReviewFormValues>[] = [
    { type: FieldType.LOCALIZED_TEXTAREA, name: "content", label: "Content", rows: 4 },
    { type: FieldType.LOCALIZED_INPUT, name: "authorName", label: "Author name" },
    { type: FieldType.LOCALIZED_INPUT, name: "authorLabel", label: "Author label" },
  ];

  const mediaFields: FormFieldConfig<ReviewFormValues>[] = [
    { type: FieldType.IMAGE_ASSET, name: "image", label: "Image", policy: reviewImagePolicy },
    { type: FieldType.IMAGE_ASSET, name: "beforeImage", label: "Before image", policy: reviewImagePolicy },
    { type: FieldType.IMAGE_ASSET, name: "afterImage", label: "After image", policy: reviewImagePolicy },
  ];

  const detailsFields: FormFieldConfig<ReviewFormValues>[] = [
    { type: FieldType.SWITCH, name: "featured", label: "Featured" },
    { type: FieldType.INPUT, name: "sourceUrl", label: "Source URL", inputType: "url" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<ReviewFormValues, typeof endpoint>
      sections={[
        { title: "Content", icon: MessageSquareText, fields: contentFields },
        { title: "Media", icon: ImageIcon, fields: mediaFields },
        { title: "Details", icon: Settings2, fields: detailsFields },
      ]}
      defaultValues={
        defaultValues
          ? {
              content: defaultValues.content ?? EMPTY_LOCALIZED,
              authorName: defaultValues.authorName ?? EMPTY_LOCALIZED,
              authorLabel: defaultValues.authorLabel ?? EMPTY_LOCALIZED,
              image: defaultValues.image ?? null,
              beforeImage: defaultValues.beforeImage ?? null,
              afterImage: defaultValues.afterImage ?? null,
              featured: defaultValues.featured,
              sourceUrl: defaultValues.sourceUrl,
              status: defaultValues.status,
            }
          : {
              content: EMPTY_LOCALIZED,
              authorName: EMPTY_LOCALIZED,
              authorLabel: EMPTY_LOCALIZED,
              image: null,
              beforeImage: null,
              afterImage: null,
              featured: false,
              status: ContentStatus.DRAFT,
            }
      }
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Review saved successfully");
        router.push(AppRoute.reviews);
      }}
      layout="grid"
      columns={2}
    />
  );
}
