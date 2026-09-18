"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store/store";
import {
  setUnreadCount,
  incrementUnreadCount,
  addMailNotification,
  setMailNotifications,
  mapEmailToNotificationItem,
  MailNotificationItem,
} from "@/lib/store/features/mailSlice";
import { createTmsSocket } from "@/lib/socket";
import { getToken } from "@/lib/cookie";
import { tms } from "@/lib/tms-api";
import { toast } from "react-hot-toast";
import { Mail } from "lucide-react";

function parseSender(from: string) {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].replace(/["']/g, "").trim();
    return { name: name || match[2], email: match[2] };
  }
  return { name: from, email: from };
}

export function MailNotificationListener() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state: RootState) => state.auth.user);
  const coachUser = useAppSelector((state: RootState) => state.coach);
  const socketRef = useRef<any>(null);

  const role = (authUser?.role as string) || coachUser?.role || "";
  const hasMailingAccess = ["management", "admin", "managing_coach", "mailer"].includes(role);
  const isManagingCoach = role === "managing_coach";

  useEffect(() => {
    if (!hasMailingAccess) return;

    let mounted = true;

    // Fetch initial unread count
    tms.get("/admin/mail/unread-count")
      .then((res) => {
        if (!mounted) return;
        const count = res.data?.data?.unreadCount ?? res.data?.unreadCount ?? 0;
        dispatch(setUnreadCount(count));
      })
      .catch((err) => {
        // Silently catch if not authorized or network issue
        console.debug("Failed to fetch mail unread count:", err);
      });

    // Fetch initial recent notifications
    tms.get("/admin/mail/inbox", { params: { limit: 15 } })
      .then((res) => {
        if (!mounted) return;
        const data = res.data?.data || res.data;
        const rawEmails = Array.isArray(data) ? data : (data?.emails || []);
        if (Array.isArray(rawEmails)) {
          const items = rawEmails.map(mapEmailToNotificationItem);
          dispatch(setMailNotifications(items));
        }
      })
      .catch((err) => {
        console.debug("Failed to fetch initial mail notifications:", err);
      });

    // Connect to socket and join mail room
    const initSocket = async () => {
      try {
        const token = coachUser?.token || (await getToken());
        if (!mounted) return;

        const socket = createTmsSocket(token);
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("mail:joinRoom", { token });
        });

        socket.on("mail:newEmail", (payload: any) => {
          if (!mounted) return;

          const emailId = payload.id || payload._id || "";
          dispatch(incrementUnreadCount(1));
          dispatch(addMailNotification(mapEmailToNotificationItem({
            ...payload,
            id: emailId,
            _id: emailId,
            isRead: false,
          })));

          const fromName = parseSender(payload.from || "").name;
          const targetInboxUrl = isManagingCoach
            ? "/coach/mailing/received"
            : "/dashboard/mailing/received";

          toast(
            (t) => (
              <div className="flex items-start gap-3 max-w-sm">
                <div className="mt-0.5 p-2 rounded-full bg-primary/10 text-primary shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">
                    New email from {fromName}
                  </p>
                  <p className="text-xs font-medium text-foreground/90 line-clamp-1 mt-0.5">
                    {payload.subject || "(No Subject)"}
                  </p>
                  {payload.snippet && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {payload.snippet}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      toast.dismiss(t.id);
                      router.push(targetInboxUrl);
                    }}
                    className="mt-2 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    View in Inbox &rarr;
                  </button>
                </div>
              </div>
            ),
            {
              duration: 7000,
              position: "top-right",
            }
          );

          // Trigger native browser notification if allowed
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              const desktopNotif = new Notification(`New email from ${fromName}`, {
                body: payload.subject || payload.snippet || "New incoming message",
                icon: "/Logo.ico",
                tag: emailId || undefined,
              });
              desktopNotif.onclick = () => {
                window.focus();
                router.push(targetInboxUrl);
                desktopNotif.close();
              };
            } catch (err) {
              console.debug("Failed to create desktop notification:", err);
            }
          }
        });
      } catch (err) {
        console.debug("Error initializing mail notification socket:", err);
      }
    };

    initSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [hasMailingAccess, isManagingCoach, coachUser?.token, dispatch, router]);

  return null;
}
