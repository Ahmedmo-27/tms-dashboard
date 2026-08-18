"use client";

import type { ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tms } from "@/lib/tms-api";
import { setCoachCredentials } from "@/lib/store/features/coachSlice";
import { Loader2 } from "lucide-react";
import type { CoachMeDto } from "@/types/coach.types";

const RequireCoachAuth = ({ children }: { children: ReactNode }) => {
  const token = useAppSelector((state) => state.coach.token);
  const coachId = useAppSelector((state) => state.coach.coachId);
  const capabilitiesLoaded = useAppSelector(
    (state) => state.coach.capabilitiesLoaded
  );
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [checking, setChecking] = useState(!(token || coachId) || !capabilitiesLoaded);

  useEffect(() => {
    if ((token || coachId) && capabilitiesLoaded) {
      setChecking(false);
      return;
    }

    const verify = async () => {
      try {
        const authHeaders = token
          ? { Authorization: `Bearer ${token}` }
          : undefined;

        let resolvedCoachId = coachId;
        let resolvedName: string | undefined;

        if (!token && !coachId) {
          const res = await tms.get("/api/coach/auth/verifyToken");
          const userData = res.data?.data?.user;
          if (!userData) {
            router.replace("/login");
            return;
          }
          resolvedCoachId = userData._id;
          resolvedName = userData.name;
        }

        const meRes = await tms.get("/api/coach/me", { headers: authHeaders });
        const profile = meRes.data.data as CoachMeDto;

        dispatch(
          setCoachCredentials({
            token: token ?? null,
            coachId: resolvedCoachId ?? "",
            name: profile.name || resolvedName,
            email: profile.email,
            phoneNumber: profile.phoneNumber,
            branchName: profile.branchName,
            hasPtSessions: profile.hasPtSessions,
            hasScheduledClasses: profile.hasScheduledClasses,
            capabilitiesLoaded: true,
          })
        );
        setChecking(false);
      } catch {
        router.replace("/login");
      }
    };

    verify();
  }, [token, coachId, capabilitiesLoaded, router, dispatch]);

  if (checking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Checking session…</p>
      </div>
    );
  }

  if (!token && !coachId) return null;

  return <>{children}</>;
};

export default RequireCoachAuth;
