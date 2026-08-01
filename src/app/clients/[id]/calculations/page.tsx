import { EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { FlaskConical } from "lucide-react";

export default function ClientCalculationsPage() {
  return (
    <EmptyState
      icon={FlaskConical}
      title="Calculations coming soon"
      description="Saved Nutrition Calculation Workspace results will appear here once that checkpoint ships."
    />
  );
}
