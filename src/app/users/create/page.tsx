import { Card, PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { UserForm } from "../../../../common/forms/user-form";

export default function UserCreatePage() {
  return (
    <PageShell title="Create User" description="Add a new staff user" maxWidth="2xl">
      <Card>
        <UserForm />
      </Card>
    </PageShell>
  );
}
