"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { UserPlus } from "lucide-react";
import { UserForm } from "src/common/forms/user-form";
import { AppRoute } from "src/common/routes/app-route";
import { createUserEndpoint } from "../../../../api/user.endpoints";

export default function UserCreatePage() {
  return (
    <PageShell
      icon={UserPlus}
      title="Create User"
      description="Add a new staff user"
      backRoute={{ path: AppRoute.users, label: "Back to Users" }}
    >
      <UserForm endpoint={createUserEndpoint} />
    </PageShell>
  );
}
