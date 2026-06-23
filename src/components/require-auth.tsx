"use client";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { tms } from "@/lib/tms-api";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const resolveAuth = async () => {
      if (user?.role === "coach") {
        router.replace("/coach/dashboard");
        setCheckingSession(false);
        return;
      }

      if (user) {
        setCheckingSession(false);
        return;
      }

      try {
        const res = await tms.get("/auth/verifyToken");
        const userData = res.data?.data?.user;
        if (userData?.role === "coach") {
          router.replace("/coach/dashboard");
        } else {
          setCheckingSession(false);
        }
      } catch {
        router.replace("/login");
      }
    };

    resolveAuth();
  }, [user, router]);

  if (checkingSession) return null;

  if (!user) return null;

  if (user.role === "coach") return null;

  return <>{children}</>;
};

export default RequireAuth;
