import { UserForm } from "../../../../common/forms/user-form";

export default function UserCreatePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-slate-900">Create User</h1>
      <UserForm />
    </main>
  );
}
