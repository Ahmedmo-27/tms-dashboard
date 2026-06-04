"use client"
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { setCredentials, logout } from "@/lib/store/features/authSlice";
import { tms } from "@/lib/tms-api";

export function AuthHydrator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    const hydrate = async () => {
      if (!user) {
        try {
          const res = await tms.get("/auth/verifyToken"); 
          console.log("Hydration succeded: ", res.data)
          dispatch(setCredentials(res.data));
        } catch (err) {
          dispatch(logout());
          console.warn("Auth hydration failed:", err);
        }
      }
    };

    hydrate();
  }, []);

  return null;
}