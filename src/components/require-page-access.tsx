"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/lib/hooks";
import { canAccessPage } from "@/lib/config/roles";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export function RequirePageAccess({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;

  if (!canAccessPage(role, pathname)) {
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
}
