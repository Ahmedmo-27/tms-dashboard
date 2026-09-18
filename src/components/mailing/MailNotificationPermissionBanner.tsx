"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, BellRing, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tms_mail_notif_permission_ignored";

export function MailNotificationPermissionBanner({ className }: { className?: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isIgnored, setIsIgnored] = useState(true); // default to true until checked in client
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    const ignored = localStorage.getItem(STORAGE_KEY) === "true";
    setIsIgnored(ignored);
  }, []);

  const handleActivate = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked in your browser. Please click the site settings/lock icon in your address bar to allow them.",
        { duration: 6000 }
      );
      return;
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        localStorage.removeItem(STORAGE_KEY);
        setIsIgnored(false);
        toast.success("Desktop notifications activated! You'll be alerted when new emails arrive.");

        try {
          new Notification("The Mind Space", {
            body: "Email notifications are now enabled for your mailbox!",
            icon: "/Logo.ico",
          });
        } catch {
          // ignore notification constructor failure
        }
      } else if (result === "denied") {
        toast.error("Notifications permission was denied.");
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const handleIgnore = useCallback(() => {
    setIsIgnored(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Do not show if:
  // 1. Browser doesn't support notifications
  // 2. Permission is already granted
  // 3. User clicked "Ignore"
  if (!isSupported || permission === "granted" || isIgnored) {
    return null;
  }

  const isDenied = permission === "denied";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 shadow-xs transition-all duration-200",
        isDenied
          ? "bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100"
          : "bg-primary/5 border-primary/20 text-foreground",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Icon & Details */}
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
              isDenied
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-primary/15 text-primary"
            )}
          >
            {isDenied ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <BellRing className="h-4 w-4 animate-pulse" />
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm leading-tight">
                {isDenied
                  ? "Email Notifications Blocked"
                  : "Enable Desktop Email Notifications"}
              </h4>
              {isDenied && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded">
                  <AlertCircle className="h-3 w-3" />
                  Blocked in Browser
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              {isDenied
                ? "Your browser has notifications disabled for this website. To get desktop alerts for incoming emails, click the lock icon in your browser address bar and set Notifications to 'Allow'."
                : "You currently don't have browser notifications enabled. Activate notifications so you never miss an email received through the website, even when working in another tab or app."}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {!isDenied && (
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={isRequesting}
              className="h-8 text-xs gap-1.5 font-semibold shadow-xs"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{isRequesting ? "Activating..." : "Activate"}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleIgnore}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1 sm:hidden" />
            <span>Ignore</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
