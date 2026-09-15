"use server";

import { tms } from "@/lib/tms-api";
import { getToken, deleteToken } from "@/lib/cookie";
import { isCoachRole } from "@/lib/config/roles";
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

export async function getCoachSession(): Promise<CoachSessionResult | null> {
  try {
    const token = await getToken();
    if (!token) {
      return null;
    }

    // Verify token and retrieve user details
    const verifyRes = await tms.get("/auth/verifyToken");
    const user = verifyRes.data?.data?.user ?? verifyRes.data?.user;

    if (!user || !isCoachRole(user.role)) {
      return null;
    }

    // Fetch coach profile & capabilities
    const meRes = await tms.get("/api/coach/me");
    const profile = meRes.data?.data as CoachMeDto;

    if (!profile) {
      return null;
    }

    return {
      token,
      coachId: user._id || user.userId || "",
      name: profile.name || user.name || "Coach",
      email: profile.email || user.email,
      phoneNumber: profile.phoneNumber || user.phoneNumber,
      role: profile.role || user.role,
      branchName: profile.branchName ?? null,
      hasPtSessions: Boolean(profile.hasPtSessions),
      hasScheduledClasses: Boolean(profile.hasScheduledClasses),
    };
  } catch {
    return null;
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
