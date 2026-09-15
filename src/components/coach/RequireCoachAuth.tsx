"use client";

import type { ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutCoach, setCoachCredentials } from "@/lib/store/features/coachSlice";
import { getCoachSession, logoutCoachAction } from "@/lib/actions/coach-auth-actions";
import { Loader2 } from "lucide-react";

const RequireCoachAuth = ({ children }: { children: ReactNode }) => {
  const token = useAppSelector((state) => state.coach.token);
  const coachId = useAppSelector((state) => state.coach.coachId);
  const capabilitiesLoaded = useAppSelector(
    (state) => state.coach.capabilitiesLoaded
  );
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [checking, setChecking] = useState(!token || !coachId || !capabilitiesLoaded);

  useEffect(() => {
    let mounted = true;

    // If token and capabilities are already in memory, session is valid
    if (token && coachId && capabilitiesLoaded) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      try {
        const session = await getCoachSession();
        if (!mounted) return;

        if (!session) {
          await logoutCoachAction();
          dispatch(logoutCoach());
          router.replace("/login");
          return;
        }

        dispatch(
          setCoachCredentials({
            token: session.token,
            coachId: session.coachId,
            name: session.name,
            email: session.email,
            phoneNumber: session.phoneNumber,
            role: session.role,
            branchName: session.branchName,
            hasPtSessions: session.hasPtSessions,
            hasScheduledClasses: session.hasScheduledClasses,
            capabilitiesLoaded: true,
          })
        );
        setChecking(false);
      } catch {
        if (mounted) {
          await logoutCoachAction();
          dispatch(logoutCoach());
          router.replace("/login");
        }
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [token, coachId, capabilitiesLoaded, router, dispatch]);

  if (checking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Checking coach session…</p>
      </div>
    );
  }

  if (!token || !coachId) return null;

  return <>{children}</>;
};

export default RequireCoachAuth;

