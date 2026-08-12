import { redirect } from "next/navigation";

export default function BookDetailsRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/books/${params.id}/overview`);
}
