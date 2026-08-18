"use client";

import type { ReactNode } from "react";
import RequireCoachAuth from "@/components/coach/RequireCoachAuth";
import { CoachDashboardShell } from "@/components/coach/CoachDashboardShell";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <RequireCoachAuth>
      <CoachDashboardShell>{children}</CoachDashboardShell>
    </RequireCoachAuth>
  );
}
