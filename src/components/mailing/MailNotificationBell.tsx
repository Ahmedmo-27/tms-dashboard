"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store/store";
import {
  markMailNotificationRead,
  markAllMailNotificationsRead,
  MailNotificationItem,
} from "@/lib/store/features/mailSlice";
import { tms } from "@/lib/tms-api";
import { formatDistanceToNow } from "date-fns";
import { Bell, Mail, CheckCheck, ExternalLink, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function parseSender(from: string) {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].replace(/["']/g, "").trim();
    return { name: name || match[2], email: match[2] };
  }
  return { name: from, email: from };
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function MailNotificationBell() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const authUser = useAppSelector((state: RootState) => state.auth.user);
  const coachUser = useAppSelector((state: RootState) => state.coach);
  const { unreadCount, notifications } = useAppSelector((state: RootState) => state.mail);

  const role = (authUser?.role as string) || coachUser?.role || "";
  const hasMailingAccess = ["management", "admin", "managing_coach", "mailer"].includes(role);
  const isManagingCoach = role === "managing_coach";
  const inboxUrl = isManagingCoach ? "/coach/mailing/received" : "/dashboard/mailing/received";

  if (!hasMailingAccess) {
    return null;
  }

  const handleOpenEmail = async (item: MailNotificationItem) => {
    const emailId = item.id || item._id;
    if (!item.isRead && emailId) {
      dispatch(markMailNotificationRead(emailId));
      try {
        await tms.patch(`/admin/mail/${emailId}/read`);
      } catch (err) {
        console.debug("Failed to mark email read:", err);
      }
    }
    setOpen(false);
    router.push(inboxUrl);
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await tms.patch("/admin/mail/read-all");
      dispatch(markAllMailNotificationsRead());
    } catch (err) {
      console.debug("Failed to mark all emails read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Mail Notifications"
          title="Mail Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold flex items-center justify-center rounded-full leading-none pointer-events-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-lg border rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Mail Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[11px] font-medium py-0 px-1.5 h-4.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all read</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[340px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                <Inbox className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground">No recent email alerts</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                When you receive emails at your connected mailbox, they will appear here.
              </p>
            </div>
          ) : (
            notifications.map((item: MailNotificationItem) => {
              const { name, email } = parseSender(item.from || "");
              const timeAgo = item.date
                ? (() => {
                    const d = new Date(item.date);
                    return isNaN(d.getTime())
                      ? ""
                      : formatDistanceToNow(d, { addSuffix: true });
                  })()
                : "";

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenEmail(item)}
                  className={cn(
                    "flex items-start gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50 text-left",
                    !item.isRead ? "bg-primary/5" : ""
                  )}
                >
                  <div className="h-8 w-8 rounded-full border bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {getInitials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "text-xs truncate",
                          !item.isRead ? "font-bold text-foreground" : "font-medium text-foreground/85"
                        )}
                      >
                        {name}
                      </p>
                      {timeAgo && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {timeAgo}
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs truncate mt-0.5",
                        !item.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.subject || "(No Subject)"}
                    </p>
                    {item.snippet && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {item.snippet}
                      </p>
                    )}
                  </div>
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-xs" />
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/20 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              router.push(inboxUrl);
            }}
            className="w-full text-xs h-8 gap-1 text-primary hover:text-primary font-medium"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Open Mailbox Inbox</span>
            <ExternalLink className="h-3 w-3 ml-0.5 opacity-70" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
