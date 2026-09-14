"use client";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/data/auth";
import { setCredentials, logout } from "@/lib/store/features/authSlice";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    const resolveAuth = async () => {
      // Always re-verify with the server — never trust persisted Redux alone.
      try {
        const userData = await getAuthenticatedUser();
        if (!mounted) return;

        if (!userData) {
          dispatch(logout());
          router.replace("/login");
          return;
        }

        const role = userData.role as string | undefined;

        if (isCoachRole(role)) {
          router.replace("/coach/today");
          return;
        }

        if (isStaffRole(role)) {
          dispatch(setCredentials(userData));
          return;
        }

        dispatch(logout());
        router.replace("/login");
      } catch {
        if (mounted) {
          dispatch(logout());
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    resolveAuth();

    return () => {
      mounted = false;
    };
  }, [router, dispatch]);

  if (checkingSession) return null;

  if (!user || !isStaffRole(user.role as string | undefined)) return null;

  if (isCoachRole(user.role as string | undefined)) return null;

  return <>{children}</>;
};

export default RequireAuth;
