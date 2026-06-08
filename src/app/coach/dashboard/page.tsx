"use client";

import RequireCoachAuth from "@/components/coach/RequireCoachAuth";
import { CoachDashboardShell } from "@/components/coach/CoachDashboardShell";

export default function CoachDashboardPage() {
  return (
    <RequireCoachAuth>
      <CoachDashboardShell />
    </RequireCoachAuth>
  );
}
