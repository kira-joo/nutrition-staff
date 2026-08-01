import { EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { NotebookPen } from "lucide-react";

export default function ClientAssessmentsPage() {
  return (
    <EmptyState
      icon={NotebookPen}
      title="Assessments coming soon"
      description="Nutrition assessment history will appear here once the Assessments checkpoint ships."
    />
  );
}
