"use client";

import type { ReactNode } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Protects /coach/dashboard routes.
 * Redirects to /login if no coach token is present.
 */
const RequireCoachAuth = ({ children }: { children: ReactNode }) => {
  const token = useAppSelector((state) => state.coach.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) return null;

  return <>{children}</>;
};

export default RequireCoachAuth;
