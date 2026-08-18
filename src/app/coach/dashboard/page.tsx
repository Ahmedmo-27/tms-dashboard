import { redirect } from "next/navigation";

export default function CoachDashboardRedirectPage() {
  redirect("/coach/today");
}
