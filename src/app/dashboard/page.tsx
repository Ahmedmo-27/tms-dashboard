import { redirect } from "next/navigation";
import { getToken } from "@/lib/cookie";
import { getDashboardRouteForRole, STAFF_DASHBOARD_HOME } from "@/lib/config/roles";

function getJwtRole(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const token = await getToken();
  const role = getJwtRole(token);
  const target = getDashboardRouteForRole(role) || STAFF_DASHBOARD_HOME;
  redirect(target);
}
