import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard - Ooty Baker",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth?redirect=/dashboard");
  }

  return <DashboardShell user={{ id: session.id, email: session.email }} />;
}
