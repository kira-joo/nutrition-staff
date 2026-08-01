import { redirect } from "next/navigation";

export default function ClientDetailsRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/clients/${params.id}/overview`);
}
