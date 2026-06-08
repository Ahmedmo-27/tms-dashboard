"use client";
import type { ReactNode } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "coach" || coachToken) {
      router.replace("/coach/dashboard");
      return;
    }

    if (!user) {
      router.replace("/login");
    }
  }, [coachToken, user, router]);

  if (!user) return null;

  if (user.role === "coach" || coachToken) return null;

  return <>{children}</>;
};

export default RequireAuth;
