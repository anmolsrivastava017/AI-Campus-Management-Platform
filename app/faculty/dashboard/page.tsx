import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import FacultyDashboardClient from "@/components/FacultyDashboardClient";
export const dynamic = "force-dynamic";

export default async function FacultyDashboard() {
  const user = await getAuthUser();

  if (!user || user.role !== "FACULTY") {
    redirect("/login/faculty");
  }

  return <FacultyDashboardClient />;
}