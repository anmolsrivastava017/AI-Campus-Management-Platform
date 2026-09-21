import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import StudentDashboardClient from "@/components/StudentDashboardClient";
export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await getAuthUser();

  if (!user || user.role !== "STUDENT") {
    redirect("/login/student");
  }

  return <StudentDashboardClient />;
}