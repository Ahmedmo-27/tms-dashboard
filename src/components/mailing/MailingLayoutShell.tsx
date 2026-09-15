"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, Send, Inbox, Mail, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { tms } from "@/lib/tms-api";

interface MailingLayoutShellProps {
  basePath: string;
  children: React.ReactNode;
}

export function MailingLayoutShell({ basePath, children }: MailingLayoutShellProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{ email: string; name: string } | null>(null);

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

  const navItems = [
    {
      title: "Compose",
      href: basePath,
      icon: PenSquare,
      exact: true,
    },
    {
      title: "Inbox",
      href: `${basePath}/received`,
      icon: Inbox,
    },
    {
      title: "Sent",
      href: `${basePath}/sent`,
      icon: Send,
    },
  ];

  return (
    <div className="min-w-0 flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          Mailing System
        </h2>
      </div>

      <div className="flex min-w-0 flex-col gap-6 md:flex-row">
        {/* Sidebar Navigation */}
        <aside className="w-full shrink-0 md:w-64 space-y-3">
          <nav className="flex flex-col space-y-1 bg-card rounded-lg border p-2">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {profile && (
            <div className="bg-card rounded-lg border p-3.5 space-y-1.5 text-xs shadow-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                Active Mailbox
              </div>
              <div className="font-semibold text-foreground truncate" title={profile.name}>
                {profile.name}
              </div>
              <div className="text-muted-foreground break-all text-[11px]" title={profile.email}>
                {profile.email}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
