"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PenSquare, 
  Send, 
  Inbox, 
  Mail, 
  UserCheck, 
  Copy, 
  Check, 
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tms } from "@/lib/tms-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

interface MailingLayoutShellProps {
  basePath: string;
  children: React.ReactNode;
}

export function MailingLayoutShell({ basePath, children }: MailingLayoutShellProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ email: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    tms.get("/admin/mail/profile")
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.email) {
          setProfile({ email: data.email, name: data.name });
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyEmail = () => {
    if (profile?.email) {
      navigator.clipboard.writeText(profile.email);
      setCopied(true);
      toast.success("Mailbox address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    {
      title: "Compose",
      href: basePath,
      icon: PenSquare,
      exact: true,
      description: "Send direct & broadcast emails",
    },
    {
      title: "Inbox",
      href: `${basePath}/received`,
      icon: Inbox,
      description: "Incoming mailbox messages",
    },
    {
      title: "Sent",
      href: `${basePath}/sent`,
      icon: Send,
      description: "Delivery logs & history",
    },
  ];

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "MB";
  };

  return (
    <div className="min-w-0 flex-1 space-y-6 p-4 pt-6 md:p-8">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Mail className="h-4 w-4" />
            </div>
            <Badge variant="secondary" className="gap-1.5 text-xs font-medium px-2 py-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              Communications Hub
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mailing System</h1>
          <p className="text-sm text-muted-foreground">
            Compose announcements, handle incoming messages, and monitor transactional delivery logs.
          </p>
        </div>

        {profile && (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/40 border rounded-full px-3 py-1.5 text-xs shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-muted-foreground">Mailbox Online:</span>
            <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[220px]">
              {profile.email}
            </span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full shrink-0 lg:w-64 space-y-4">
          {/* Mobile & Tablet Nav: Horizontal Segmented Pills */}
          <nav className="flex lg:hidden rounded-xl border bg-muted/30 p-1 gap-1">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg py-2 px-3 text-xs sm:text-sm font-medium transition-all text-center",
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Nav: Sleek Vertical Sidebar */}
          <nav className="hidden lg:flex flex-col space-y-1 bg-card rounded-xl border p-2 shadow-xs">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-background group-hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="font-semibold leading-none">{item.title}</div>
                    <div
                      className={cn(
                        "text-[11px] truncate mt-1",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Active Mailbox Card */}
          {profile && (
            <div className="bg-card rounded-xl border p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Active Mailbox</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                  Ready
                </Badge>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-xs">
                  {getInitials(profile.name, profile.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-foreground truncate" title={profile.name}>
                    {profile.name || "Mail User"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" title={profile.email}>
                    {profile.email}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="w-full text-xs h-8 gap-1.5 font-normal text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Address</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

