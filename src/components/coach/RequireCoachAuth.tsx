"use client";

import type { ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tms } from "@/lib/tms-api";
import { setCoachCredentials } from "@/lib/store/features/coachSlice";

/**
 * Protects /coach/dashboard routes.
 * Redirects to /login if no coach token is present.
 */
const RequireCoachAuth = ({ children }: { children: ReactNode }) => {
  const token = useAppSelector((state) => state.coach.token);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [checking, setChecking] = useState(!token);

  useEffect(() => {
    if (token) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      try {
        const res = await tms.get("/api/coach/auth/verifyToken");
        const userData = res.data?.data?.user;
        if (userData) {
          dispatch(
            setCoachCredentials({
              token: "cookie_token",
              coachId: userData._id,
              name: userData.name,
              hasPtSessions: userData.hasPtSessions ?? true,
              hasScheduledClasses: userData.hasScheduledClasses ?? true
            })
          );
        }
        setChecking(false);
      } catch {
        router.replace("/login");
      }
    };
    verify();
  }, [token, router, dispatch]);

  if (checking) return null;

  return <>{children}</>;
};

export default RequireCoachAuth;
