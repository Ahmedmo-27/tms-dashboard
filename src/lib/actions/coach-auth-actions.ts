"use server";

import { tms } from "@/lib/tms-api";
import { getToken, deleteToken } from "@/lib/cookie";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";
import type { CoachMeDto } from "@/types/coach.types";

export interface CoachSessionResult {
  token: string;
  coachId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
  branchName?: string | null;
  hasPtSessions: boolean;
  hasScheduledClasses: boolean;
}

export type CoachSessionResolution =
  | { status: "coach"; session: CoachSessionResult }
  | { status: "staff"; role: string }
  | { status: "unauthenticated" };

export async function getCoachSession(): Promise<CoachSessionResolution> {
  try {
    const token = await getToken();
    if (!token) {
      return { status: "unauthenticated" };
    }

    // Verify token and retrieve user details
    const verifyRes = await tms.get("/auth/verifyToken");
    const user = verifyRes.data?.data?.user ?? verifyRes.data?.user;

    if (!user) {
      return { status: "unauthenticated" };
    }

    if (isStaffRole(user.role)) {
      return { status: "staff", role: user.role };
    }

    if (!isCoachRole(user.role)) {
      return { status: "unauthenticated" };
    }

    // Fetch coach profile & capabilities
    const meRes = await tms.get("/api/coach/me");
    const profile = meRes.data?.data as CoachMeDto;

    if (!profile) {
      return { status: "unauthenticated" };
    }

    return {
      status: "coach",
      session: {
        token,
        coachId: user._id || user.userId || "",
        name: profile.name || user.name || "Coach",
        email: profile.email || user.email,
        phoneNumber: profile.phoneNumber || user.phoneNumber,
        role: profile.role || user.role,
        branchName: profile.branchName ?? null,
        hasPtSessions: Boolean(profile.hasPtSessions),
        hasScheduledClasses: Boolean(profile.hasScheduledClasses),
      },
    };
  } catch {
    return { status: "unauthenticated" };
  }
}

export async function logoutCoachAction(): Promise<{ success: boolean }> {
  try {
    const token = await getToken();
    if (token) {
      try {
        await tms.get("/auth/logout");
      } catch {
        /* ignore server errors during logout */
      }
    }
  } finally {
    await deleteToken();
  }
  return { success: true };
}
