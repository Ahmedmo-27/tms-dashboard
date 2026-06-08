"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";

export default function Home() {
  const router = useRouter();
  const authUser = useAppSelector((state) => state.auth.user);
  const coachToken = useAppSelector((state) => state.coach.token);

  useEffect(() => {
    if (coachToken || authUser?.role === "coach") {
      router.replace("/coach/dashboard");
      return;
    }

    if (authUser) {
      router.replace("/dashboard/our-members");
      return;
    }

    router.replace("/login");
  }, [authUser, coachToken, router]);

  return null;
}
