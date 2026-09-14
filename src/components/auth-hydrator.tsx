"use client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { setCredentials, logout } from "@/lib/store/features/authSlice";
import { getAuthenticatedUser } from "@/lib/data/auth";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

export function AuthHydrator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (user) return;

      try {
        const userData = await getAuthenticatedUser();
        if (!mounted) return;

        if (!userData) {
          dispatch(logout());
          return;
        }

        const role = userData.role as string | undefined;
        if (isStaffRole(role) && !isCoachRole(role)) {
          dispatch(setCredentials(userData));
        }
      } catch {
        if (mounted) {
          dispatch(logout());
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, [user, dispatch]);

  return null;
}
