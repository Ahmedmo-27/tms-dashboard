"use client";

import { useParams } from "next/navigation";
import { PackageDetail } from "@/components/coach/PackageDetail";

export default function CoachClientDetailPage() {
  const params = useParams<{ memberId: string }>();
  return <PackageDetail memberId={params.memberId} />;
}
