import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ResetForm } from "@/components/ResetForms";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  if (await getCurrentUser()) redirect("/home");
  const { id } = await searchParams;
  return <ResetForm identifier={id ?? ""} />;
}
