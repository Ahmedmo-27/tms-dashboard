export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/data/auth";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (user) {
    if (isCoachRole(user.role)) {
      redirect("/coach/today");
    }
    if (isStaffRole(user.role)) {
      redirect("/dashboard/scans-monitor");
    }
  }

  redirect("/login");
}
