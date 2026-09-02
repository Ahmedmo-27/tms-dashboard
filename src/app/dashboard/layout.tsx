import { AppSidebar } from "@/components/app-sidebar";
import { Nav } from "@/components/ui/nav";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import RequireAuth from "@/components/require-auth";
import { RequirePageAccess } from "@/components/require-page-access";
import { DashboardBranchBar } from "@/components/dashboard-branch-bar";
import { CommandPalette } from "@/components/command-palette";
import { HelpButton } from "@/components/tutorials/help-button";
import { HelpScenariosDialog } from "@/components/tutorials/help-scenarios-dialog";
import { WalkthroughOverlay } from "@/components/tutorials/walkthrough-overlay";
import { WalkthroughProvider } from "@/lib/tutorials/walkthrough-context";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RequireAuth>
        <RequirePageAccess>
          <WalkthroughProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="min-h-0">
                <header className="flex h-14 shrink-0 items-center gap-2 overflow-hidden border-b px-3 min-w-0">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <Suspense fallback={null}>
                    <Nav />
                  </Suspense>
                  <div className="ml-auto flex min-w-0 shrink items-center gap-2">
                    <Suspense fallback={null}>
                      <DashboardBranchBar />
                    </Suspense>
                    <CommandPalette />
                    <HelpButton />
                  </div>
                </header>
                <ScrollArea className="flex-1 min-h-0 min-w-0">
                  <div className="min-w-0 max-w-full overflow-x-hidden">{children}</div>
                </ScrollArea>
              </SidebarInset>
            </SidebarProvider>
            <WalkthroughOverlay />
            <HelpScenariosDialog />
          </WalkthroughProvider>
        </RequirePageAccess>
      </RequireAuth>
    </div>
  );
}
