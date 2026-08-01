import { EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { Ruler } from "lucide-react";

export default function ClientMeasurementsPage() {
  return (
    <EmptyState
      icon={Ruler}
      title="Measurements coming soon"
      description="Weight, body composition, and progress history will appear here once the Measurements checkpoint ships."
    />
  );
}
