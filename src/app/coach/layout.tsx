"use client";

import type { ReactNode } from "react";
import RequireCoachAuth from "@/components/coach/RequireCoachAuth";
import { CoachDashboardShell } from "@/components/coach/CoachDashboardShell";

import { WalkthroughProvider } from "@/lib/tutorials/walkthrough-context";
import { WalkthroughOverlay } from "@/components/tutorials/walkthrough-overlay";
import { HelpScenariosDialog } from "@/components/tutorials/help-scenarios-dialog";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <RequireCoachAuth>
      <WalkthroughProvider>
        <CoachDashboardShell>{children}</CoachDashboardShell>
        <WalkthroughOverlay />
        <HelpScenariosDialog />
      </WalkthroughProvider>
    </RequireCoachAuth>
  );
}

