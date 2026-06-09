"use client";

import { useEffect, useState } from "react";
import { Undo2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MemberRefundForm } from "@/components/ui/refunds/member-refund-form";
import { CashOutForm } from "@/components/ui/refunds/cash-out-form";
import { useAppSelector } from "@/lib/hooks";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export function RefundsPageContent() {
  const user = useAppSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!user || user.role !== "admin") {
    return <UnauthorizedPage />;
  }

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Undo2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Refunds</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Record a member refund or a cash out.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
        <MemberRefundForm />
        <CashOutForm />
      </div>
    </div>
  );
}
