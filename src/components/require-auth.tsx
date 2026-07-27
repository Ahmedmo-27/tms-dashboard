"use client";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { tms } from "@/lib/tms-api";
import { setCredentials } from "@/lib/store/features/authSlice";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const resolveAuth = async () => {
      if (isCoachRole(user?.role as string | undefined)) {
        router.replace("/coach/dashboard");
        setCheckingSession(false);
        return;
      }

      if (user && isStaffRole(user.role as string | undefined)) {
        setCheckingSession(false);
        return;
      }

      try {
        const res = await tms.get("/auth/verifyToken");
        const userData = res.data?.data?.user ?? res.data?.user;
        const role = userData?.role as string | undefined;

        if (isCoachRole(role)) {
          router.replace("/coach/dashboard");
        } else if (isStaffRole(role)) {
          dispatch(setCredentials(userData));
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setCheckingSession(false);
      }
    };

    resolveAuth();
  }, [user, router, dispatch]);

  if (checkingSession) return null;

  if (!user || !isStaffRole(user.role as string | undefined)) return null;

  if (isCoachRole(user.role as string | undefined)) return null;

  return <>{children}</>;
};

export default RequireAuth;
