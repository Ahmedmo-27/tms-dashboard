"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store/store";
import {
  logoutCoach,
  setCoachClients,
  addNotification,
  markAllNotificationsRead,
} from "@/lib/store/features/coachSlice";
import { useCoachApi } from "@/hooks/useCoachApi";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Bell,
  Calendar,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { ClientList } from "@/components/coach/ClientList";
import { NotificationPanel } from "@/components/coach/NotificationPanel";
import { CoachCalendar } from "@/components/coach/CoachCalendar";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type ActiveView = "clients" | "schedule" | "notifications";

interface CoachNewPackagePayload {
  memberName: string;
  packageName: string;
  classesTotal: number;
  createdAt: string;
}

const API_URL = process.env.NEXT_PUBLIC_TMS_API_URL as string;

export function CoachDashboardShell() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const coachApi = useCoachApi();

  const { coachId, name, notifications, hasPtSessions, hasScheduledClasses } = useAppSelector(
    (state: RootState) => state.coach
  );

  const [activeView, setActiveView] = useState<ActiveView>(
    hasPtSessions ? "clients" : (hasScheduledClasses ? "schedule" : "clients")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = (notifications as { read: boolean }[]).filter((n: { read: boolean }) => !n.read).length;



  // Socket.io – join coach room and listen for new package events
  useEffect(() => {
    if (!coachId) return;

    const socket: Socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("coach:joinRoom", coachId);
    });

    socket.on("coach:newPackage", (payload: CoachNewPackagePayload) => {
      dispatch(addNotification(payload));
      toast(`New package assigned to ${payload.memberName}`, {
        icon: "📦",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [coachId, dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logoutCoach());
    router.replace("/login");
  }, [dispatch, router]);

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    setSidebarOpen(false);
    if (view === "notifications") {
      dispatch(markAllNotificationsRead());
    }
  };

  const navItems: {
    id: ActiveView;
    label: string;
    icon: React.ElementType;
  }[] = [
    ...(hasPtSessions ? [
      { id: "clients" as ActiveView, label: "My Clients", icon: Users },
    ] : []),
    ...(hasScheduledClasses ? [
      { id: "schedule" as ActiveView, label: "Schedule", icon: Calendar },
    ] : []),
    // { id: "notifications", label: "Notifications", icon: Bell },
  ];

  const SidebarContent = (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleNavClick(id)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
            activeView === id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <div className="relative">
            <Icon className="h-5 w-5" />
            {id === "notifications" && unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </div>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 border-r shrink-0">
        <div className="p-4 border-b">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Coach Portal
          </p>
          <p className="font-semibold truncate">{name ?? "Coach"}</p>
        </div>
        {SidebarContent}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 h-full bg-background border-r">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Coach Portal
                </p>
                <p className="font-semibold truncate">{name ?? "Coach"}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {SidebarContent}
            <div className="mt-auto p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-3 border-b px-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <span className="font-semibold text-sm">
              {navItems.find((n) => n.id === activeView)?.label}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {name ?? "Coach"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {activeView === "clients" && (
            <ClientList />
          )}
          {activeView === "schedule" && <CoachCalendar />}
          {/* {activeView === "notifications" && <NotificationPanel />} */}
        </main>

        {/* ── Mobile bottom nav ── */}
        <nav className="md:hidden flex border-t bg-background shrink-0">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                activeView === id
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {id === "notifications" && unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
