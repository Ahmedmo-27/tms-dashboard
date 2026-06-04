"use client";
import type { ReactNode } from "react";
import { useAppSelector } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login"); // client-side redirect
    }
  }, [user, router]);

  if (!user) return null;

  return <>{children}</>;
};

export default RequireAuth;
