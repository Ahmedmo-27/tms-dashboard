"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import type { RootState } from "@/lib/store/store";
import {
  logoutCoach,
  addNotification,
  setNotifications,
  markAllNotificationsRead,
} from "@/lib/store/features/coachSlice";
import { useCoachApi } from "@/hooks/useCoachApi";
import { Socket } from "socket.io-client";
import { createTmsSocket } from "@/lib/socket";
import {
  getCoachNotifications,
  markCoachNotificationsRead,
} from "@/lib/data/coach-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Users,
  Bell,
  Calendar,
  LogOut,
  ScanLine,
  Ticket,
  Home,
  Settings,
  MoreHorizontal,
} from "lucide-react";
import { NotificationPanel } from "@/components/coach/NotificationPanel";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface CoachNewPackagePayload {
  memberId?: string;
  memberName: string;
  packageName: string;
  classesTotal: number;
  createdAt: string;
}

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  match: (path: string) => boolean;
};

function titleForPath(pathname: string, items: NavItem[]): string {
  const hit = items.find((n) => n.match(pathname));
  if (hit) return hit.label;
  if (pathname.startsWith("/coach/clients/")) return "Client";
  if (pathname.startsWith("/coach/settings")) return "Settings";
  if (pathname.startsWith("/coach/scans")) return "Scans";
  return "Coach Portal";
}

export function CoachDashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const coachApi = useCoachApi();

  const { coachId, name, notifications, hasPtSessions, hasScheduledClasses, token } =
    useAppSelector((state: RootState) => state.coach);

  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadCount = (notifications as { read: boolean }[]).filter((n) => !n.read).length;

  useEffect(() => {
    if (!coachId) return;

    const socket: Socket = createTmsSocket(token);

    socket.on("connect", () => {
      socket.emit("coach:joinRoom", coachId);
    });

    socket.on("coach:newPackage", (payload: CoachNewPackagePayload) => {
      dispatch(addNotification(payload));
      toast(`New package assigned to ${payload.memberName}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [coachId, token, dispatch]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const items = await getCoachNotifications(coachApi);
        if (!cancelled) dispatch(setNotifications(items));
      } catch {
        /* keep persisted/socket notifications */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [coachApi, dispatch]);

  const handleLogout = useCallback(() => {
    dispatch(logoutCoach());
    router.replace("/login");
  }, [dispatch, router]);

  const openNotifications = async () => {
    setNotifOpen(true);
    dispatch(markAllNotificationsRead());
    try {
      await markCoachNotificationsRead(coachApi);
    } catch {
      /* ignore */
    }
  };

  const primaryNav: NavItem[] = [
    {
      href: "/coach/today",
      label: "Today",
      icon: Home,
      match: (p) => p.startsWith("/coach/today") || p === "/coach" || p === "/coach/dashboard",
    },
    ...(hasPtSessions
      ? [
          {
            href: "/coach/clients",
            label: "Clients",
            icon: Users,
            match: (p: string) => p.startsWith("/coach/clients"),
          },
        ]
      : []),
    ...(hasScheduledClasses
      ? [
          {
            href: "/coach/schedule",
            label: "Schedule",
            icon: Calendar,
            match: (p: string) => p.startsWith("/coach/schedule"),
          },
        ]
      : []),
  ];

  const moreItems: NavItem[] = [
    ...(hasScheduledClasses
      ? [
          {
            href: "/coach/scans",
            label: "Scans",
            icon: ScanLine,
            match: (p: string) => p.startsWith("/coach/scans"),
          },
        ]
      : []),
    {
      href: "/coach/tickets",
      label: "Tickets",
      icon: Ticket,
      match: (p) => p.startsWith("/coach/tickets"),
    },
    {
      href: "/coach/settings",
      label: "Settings",
      icon: Settings,
      match: (p) => p.startsWith("/coach/settings"),
    },
  ];

  const allNav = [...primaryNav, ...moreItems];
  const pageTitle = titleForPath(pathname, allNav);

  const SidebarNav = (
    <nav className="flex flex-col gap-1 p-4">
      {allNav.map(({ href, label, icon: Icon, match }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            match(pathname)
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-56 md:flex-col shrink-0 border-r">
        <div className="border-b p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Coach Portal
          </p>
          <p className="truncate font-semibold">{name ?? "Coach"}</p>
        </div>
        {SidebarNav}
        <div className="mt-auto border-t p-4">
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

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <div className="min-w-0 flex-1">
            <span className="text-sm font-semibold">{pageTitle}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openNotifications}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        <nav className="md:hidden flex shrink-0 border-t bg-background">
          {primaryNav.map(({ href, label, icon: Icon, match }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                match(pathname) ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
              moreItems.some((i) => i.match(pathname))
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            {moreItems.map(({ href, label, icon: Icon, match }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                  match(pathname) ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <Button
              variant="ghost"
              className="mt-2 justify-start gap-3 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={notifOpen} onOpenChange={setNotifOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <NotificationPanel onSelect={() => setNotifOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
