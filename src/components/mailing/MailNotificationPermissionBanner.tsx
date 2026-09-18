"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, BellRing, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tms_mail_notif_minimized";

export function MailNotificationPermissionBanner({ className }: { className?: string }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hasNotificationApi = typeof window !== "undefined" && "Notification" in window;
    const iosDevice =
      typeof window !== "undefined" &&
      (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

    setIsIOS(iosDevice);
    setIsSupported(hasNotificationApi || iosDevice);

    if (hasNotificationApi) {
      setPermission(Notification.permission);
    }

    const minimized = localStorage.getItem(STORAGE_KEY) === "true";
    setIsMinimized(minimized);
  }, []);

  const handleActivate = useCallback(async () => {
    if (typeof window === "undefined") return;

    // If iOS Safari without standalone PWA support
    if (!("Notification" in window)) {
      if (isIOS) {
        toast(
          "To receive notifications on iOS: tap Share (⎋) in Safari, choose 'Add to Home Screen', and open the app from your home screen.",
          {
            icon: "📲",
            duration: 7000,
          }
        );
        return;
      }
      toast.error("Browser notifications are not supported on this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked in your browser. Please tap the lock/settings icon in your address bar to allow them.",
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
        setIsMinimized(false);
        toast.success("Notifications activated! You'll be alerted when new emails arrive.");

        try {
          new Notification("The Mind Space", {
            body: "Email notifications are now enabled!",
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
  }, [isIOS]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {}
  }, []);

  if (!isMounted || !isSupported || permission === "granted") {
    return null;
  }

  const isDenied = permission === "denied";

  // Minimized state: Small persistent bar so user can activate anytime later
  if (isMinimized) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all shadow-xs",
          isDenied
            ? "bg-amber-500/10 border-amber-500/25 text-amber-900 dark:text-amber-200"
            : "bg-muted/40 hover:bg-muted/60 border-border/60 text-muted-foreground",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isDenied ? (
            <BellOff className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <Bell className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          <span className="truncate text-[11px] sm:text-xs">
            {isDenied
              ? "Email notifications are blocked"
              : "Email notifications are off"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={isDenied ? "outline" : "default"}
            onClick={handleActivate}
            disabled={isRequesting}
            className="h-6.5 px-2.5 text-[11px] font-semibold gap-1 rounded-md shadow-none cursor-pointer"
          >
            <Bell className="h-3 w-3" />
            <span>{isRequesting ? "..." : "Activate"}</span>
          </Button>
        </div>
      </div>
    );
  }

  // Default compact banner (mobile & desktop friendly with a much smaller button)
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5 sm:p-3 shadow-xs transition-all duration-200",
        isDenied
          ? "bg-amber-500/10 border-amber-500/25 text-amber-950 dark:text-amber-100"
          : "bg-primary/5 border-primary/20 text-foreground",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left Side: Icon & Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center shrink-0",
              isDenied
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-primary/15 text-primary"
            )}
          >
            {isDenied ? (
              <BellOff className="h-3.5 w-3.5" />
            ) : (
              <BellRing className="h-3.5 w-3.5 animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="font-semibold text-xs sm:text-sm leading-tight truncate">
                {isDenied
                  ? "Notifications Blocked"
                  : "Enable Email Notifications"}
              </h4>
              {isDenied && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded">
                  <AlertCircle className="h-2.5 w-2.5" />
                  Blocked
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate max-w-sm sm:max-w-md">
              {isDenied
                ? "Unblock in browser settings for email alerts."
                : "Get instant alerts when new emails arrive."}
            </p>
          </div>
        </div>

        {/* Right Side: Much Smaller Button + Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isDenied && (
            <Button
              size="sm"
              onClick={handleActivate}
              disabled={isRequesting}
              className="h-7 px-2.5 text-xs gap-1 font-semibold shadow-xs rounded-md cursor-pointer"
            >
              <Bell className="h-3 w-3 shrink-0" />
              <span>{isRequesting ? "..." : "Activate"}</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-md shrink-0 cursor-pointer"
            title="Dismiss for now (activate later)"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
