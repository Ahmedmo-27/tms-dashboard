"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare, Send, Inbox, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MailingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Compose",
      href: "/dashboard/mailing",
      icon: PenSquare,
      exact: true,
    },
    {
      title: "Inbox",
      href: "/dashboard/mailing/received",
      icon: Inbox,
    },
    {
      title: "Sent",
      href: "/dashboard/mailing/sent",
      icon: Send,
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          Mailing Inbox
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
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
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
