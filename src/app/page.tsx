"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { tms } from "@/lib/tms-api";

export default function Home() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const resolveHome = async () => {
      if (coachToken || authUser?.role === "coach") {
        router.replace("/coach/dashboard");
        setCheckingSession(false);
        return;
      }

      if (authUser) {
        router.replace("/dashboard/our-members");
        setCheckingSession(false);
        return;
      }

      try {
        await tms.get("/api/coach/auth/verifyToken");
        router.replace("/coach/dashboard");
      } catch {
        router.replace("/login");
      } finally {
        setCheckingSession(false);
      }
    };

    resolveHome();
  }, [authUser, coachToken, router]);

  if (checkingSession) return null;

  return null;
}
