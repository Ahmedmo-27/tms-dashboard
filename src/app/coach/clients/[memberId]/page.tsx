"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { PackageDetail } from "@/components/coach/PackageDetail";
import { Loader2 } from "lucide-react";

function ClientDetailInner() {
  const params = useParams<{ memberId: string }>();
  return <PackageDetail memberId={params.memberId} />;
}

export default function CoachClientDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ClientDetailInner />
    </Suspense>
  );
}
