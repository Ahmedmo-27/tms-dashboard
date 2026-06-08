"use client";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { tms } from "@/lib/tms-api";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const resolveAuth = async () => {
      if (user?.role === "coach" || coachToken) {
        router.replace("/coach/dashboard");
        setCheckingSession(false);
        return;
      }

      if (user) {
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

    resolveAuth();
  }, [coachToken, user, router]);

  if (checkingSession) return null;

  if (!user) return null;

  if (user.role === "coach" || coachToken) return null;

  return <>{children}</>;
};

export default RequireAuth;
