import { redirect } from "next/navigation";

export default async function ClientDetailsRedirectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/clients/${params.id}/overview`);
}
