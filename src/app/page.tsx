"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { tms } from "@/lib/tms-api";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

export default function Home() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const resolveHome = async () => {
      if (coachToken || isCoachRole(authUser?.role as string | undefined)) {
        router.replace("/coach/dashboard");
        setCheckingSession(false);
        return;
      }

      if (authUser && isStaffRole(authUser.role as string | undefined)) {
        router.replace("/dashboard/our-members");
        setCheckingSession(false);
        return;
      }

      try {
        const res = await tms.get("/auth/verifyToken");
        const userData = res.data?.data?.user ?? res.data?.user;
        const role = userData?.role as string | undefined;

        if (isCoachRole(role)) {
          router.replace("/coach/dashboard");
          return;
        }

        if (isStaffRole(role)) {
          router.replace("/dashboard/our-members");
          return;
        }
      } catch {
        try {
          await tms.get("/api/coach/auth/verifyToken");
          router.replace("/coach/dashboard");
          return;
        } catch {
          router.replace("/login");
        }
      } finally {
        setCheckingSession(false);
      }
    };

    resolveHome();
  }, [authUser, coachToken, router]);

  if (checkingSession) return null;

  return null;
}
