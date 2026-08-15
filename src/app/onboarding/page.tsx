import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Onboarding } from "@/components/Onboarding";

export default async function OnboardingPage() {
  if (await getCurrentUser()) redirect("/home");
  return <Onboarding />;
}
