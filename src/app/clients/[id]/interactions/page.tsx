import { EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { CalendarClock } from "lucide-react";

export default function ClientInteractionsPage() {
  return (
    <EmptyState
      icon={CalendarClock}
      title="Interactions coming soon"
      description="Calls, messages, notes, and follow-ups will appear here once the CRM Interactions checkpoint ships."
    />
  );
}
