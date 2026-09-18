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
import { MailNotificationListener } from "@/components/mailing/MailNotificationListener";
import { MailNotificationBell } from "@/components/mailing/MailNotificationBell";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RequireAuth>
        <RequirePageAccess>
          <WalkthroughProvider>
            <MailNotificationListener />
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="min-h-0">
                <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/95 px-2.5 sm:px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-w-0">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                    <SidebarTrigger className="h-8 w-8 shrink-0" />
                    <Separator orientation="vertical" className="h-4 shrink-0" />
                    <Suspense fallback={null}>
                      <Nav />
                    </Suspense>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 md:gap-2">
                    <Suspense fallback={null}>
                      <DashboardBranchBar />
                    </Suspense>
                    <Separator orientation="vertical" className="h-4 shrink-0 hidden sm:block" />
                    <CommandPalette />
                    <MailNotificationBell />
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
