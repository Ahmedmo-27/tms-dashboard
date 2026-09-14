"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { getAuthenticatedUser } from "@/lib/data/auth";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveHome = async () => {
      if (coachToken || isCoachRole(authUser?.role as string | undefined)) {
        if (mounted) {
          router.replace("/coach/today");
          setCheckingSession(false);
        }
        return;
      }

      if (authUser && isStaffRole(authUser.role as string | undefined)) {
        if (mounted) {
          router.replace("/dashboard/scans-monitor");
          setCheckingSession(false);
        }
        return;
      }

      try {
        const userData = await getAuthenticatedUser();
        if (!mounted) return;

        if (userData) {
          const role = userData.role as string | undefined;

          if (isCoachRole(role)) {
            router.replace("/coach/today");
            return;
          }

          if (isStaffRole(role)) {
            router.replace("/dashboard/scans-monitor");
            return;
          }
        }

        router.replace("/login");
      } catch {
        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    resolveHome();

    return () => {
      mounted = false;
    };
  }, [authUser, coachToken, router]);

  if (checkingSession) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Checking session…</p>
      </div>
    );
  }

  return null;
}
