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
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RequireAuth>
        <RequirePageAccess>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b">
              <div className="flex items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Nav />
              </div>
            </header>
            <Suspense fallback={null}>
              <DashboardBranchBar />
            </Suspense>
            <ScrollArea>{children}</ScrollArea>
          </SidebarInset>
        </SidebarProvider>
        </RequirePageAccess>
      </RequireAuth>
    </div>
  );
}
