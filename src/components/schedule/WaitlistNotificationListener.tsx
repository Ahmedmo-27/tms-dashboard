"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store/store";
import { createTmsSocket } from "@/lib/socket";
import { getToken } from "@/lib/cookie";
import { toast } from "react-hot-toast";
import { AlertCircle } from "lucide-react";

export function WaitlistNotificationListener() {
  const router = useRouter();
  const authUser = useAppSelector((state: RootState) => state.auth.user) as any;
  const socketRef = useRef<any>(null);

  const role = authUser?.role as string | undefined;
  const userLocationId = authUser?.locationId
    ? String(authUser.locationId)
    : undefined;

  // Only branch_admin, admin, management need to listen
  const shouldListen = ["branch_admin", "admin", "management"].includes(
    role || ""
  );

  useEffect(() => {
    if (!shouldListen) return;

    let mounted = true;
    const token = getToken();
    const socket = createTmsSocket(token);
    socketRef.current = socket;

    socket.on("waitlist:manual_action_required", (payload: any) => {
      if (!mounted) return;

      // Filter by location if branch_admin
      if (role === "branch_admin" && userLocationId && payload.locationId) {
        if (String(payload.locationId) !== userLocationId) {
          return;
        }
      }

      // Show high-priority toast
      toast(
        (t) => (
          <div className="flex flex-col gap-1 max-w-sm">
            <div className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Waitlist Action Required</span>
            </div>
            <p className="text-xs text-foreground/90">
              <span className="font-medium">
                {payload.memberName || "Member"}
              </span>{" "}
              has their turn for{" "}
              <span className="font-medium">
                {payload.classTitle || "Class"}
              </span>{" "}
              but has{" "}
              <span className="text-destructive font-medium">
                NO active package
              </span>
              .
            </p>
            <p className="text-[11px] text-muted-foreground">
              Dynamic window:{" "}
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {payload.windowMinutes} mins
              </span>{" "}
              to contact member and lock spot.
            </p>
            {payload.phone && (
              <a
                href={`https://wa.me/${String(payload.phone).replace(
                  /\D/g,
                  ""
                )}?text=${encodeURIComponent(
                  `Hello ${payload.memberName || ""}, a slot just opened up for you in ${payload.classTitle || "class"}! Please let us know if you'd like to book so we can lock in your spot.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-xs text-emerald-600 hover:underline font-medium inline-block"
                onClick={() => toast.dismiss(t.id)}
              >
                💬 Contact Member on WhatsApp →
              </a>
            )}
          </div>
        ),
        {
          duration: 15000,
          id: `waitlist-${payload.scid}-${payload.userId}`,
          style: {
            border: "1px solid #f59e0b",
            padding: "12px",
          },
        }
      );

      // Refresh data so waitlist card updates
      router.refresh();
    });

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off("waitlist:manual_action_required");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [shouldListen, role, userLocationId, router]);

  return null;
}
