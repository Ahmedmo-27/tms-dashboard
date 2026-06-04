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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <RequireAuth>
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
            <ScrollArea>{children}</ScrollArea>
          </SidebarInset>
        </SidebarProvider>
      </RequireAuth>
    </div>
  );
}
