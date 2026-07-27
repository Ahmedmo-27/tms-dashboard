"use client"
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { setCredentials, logout } from "@/lib/store/features/authSlice";
import { tms } from "@/lib/tms-api";
import { isCoachRole, isStaffRole } from "@/lib/config/roles";

export function AuthHydrator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const hydrate = async () => {
      if (user) return;

      try {
        const res = await tms.get("/auth/verifyToken"); 
        const userData = res.data?.data?.user ?? res.data?.user;
        const role = userData?.role as string | undefined;

        if (isStaffRole(role) && !isCoachRole(role)) {
          dispatch(setCredentials(userData));
        }
      } catch {
        dispatch(logout());
      }
    };

    hydrate();
  }, [user, dispatch]);

  return null;
}
