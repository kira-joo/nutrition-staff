import { redirect } from "next/navigation";

export default async function BookDetailsRedirectPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/books/${params.id}/overview`);
}
