"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCoachApi } from "@/hooks/useCoachApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { DeductionModal } from "@/components/coach/DeductionModal";
import { getCoachDeductions } from "@/lib/data/coach-portal";
import type { DeductionHistoryItemDto } from "@/types/coach.types";
import { telHref } from "@/lib/utils/phone";
import toast from "react-hot-toast";

export interface MemberPackageData {
  pkgId: string;
  pkgStartDate: string;
  pkgEndDate: string;
  remainingClasses: number;
  totalClasses?: number;
  status: string;
  isExpired: boolean;
  daysUntilExpiry: number;
  name?: string;
  isPtPackage?: boolean;
}

interface PackageDetailProps {
  memberId: string;
}

function StatusBadge({
  isExpired,
  daysUntilExpiry,
}: {
  isExpired: boolean;
  daysUntilExpiry: number;
}) {
  if (isExpired) {
    return (
      <Badge className="border-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Expired
      </Badge>
    );
  }
  if (daysUntilExpiry <= 14) {
    return (
      <Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Expiring soon
      </Badge>
    );
  }
  return (
    <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </Badge>
  );
}

function PackageCard({
  pkg,
  onDeduct,
}: {
  pkg: MemberPackageData;
  onDeduct?: () => void;
}) {
  const label = pkg.name ?? `Package ${pkg.pkgId}`;
  const endDate = format(new Date(pkg.pkgEndDate), "dd MMM yyyy");
  const progressValue =
    pkg.totalClasses && pkg.totalClasses > 0
      ? Math.round((pkg.remainingClasses / pkg.totalClasses) * 100)
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm leading-tight font-semibold">{label}</p>
        <StatusBadge isExpired={pkg.isExpired} daysUntilExpiry={pkg.daysUntilExpiry} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Classes remaining</span>
          <span className="font-medium text-foreground">
            {pkg.remainingClasses}
            {pkg.totalClasses ? ` / ${pkg.totalClasses}` : ""}
          </span>
        </div>
        {progressValue !== null ? (
          <Progress value={progressValue} className="h-2" />
        ) : (
          <div className="h-2 rounded-full bg-muted" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Expires: <span className="font-medium text-foreground">{endDate}</span>
      </p>
      {pkg.isPtPackage && onDeduct && (
        <Button
          size="sm"
          variant="outline"
          className="mt-auto w-full"
          disabled={pkg.isExpired || pkg.remainingClasses === 0}
          onClick={onDeduct}
        >
          Deduct class
        </Button>
      )}
    </div>
  );
}

export function PackageDetail({ memberId }: PackageDetailProps) {
  const coachApi = useCoachApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [memberName, setMemberName] = useState(searchParams.get("name") ?? "Client");
  const [phone, setPhone] = useState(searchParams.get("phone") ?? "");
  const [packages, setPackages] = useState<MemberPackageData[]>([]);
  const [history, setHistory] = useState<DeductionHistoryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductTarget, setDeductTarget] = useState<MemberPackageData | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const [pkgRes, deductions] = await Promise.all([
          coachApi.get(`/api/coach/clients/${memberId}/packages`),
          getCoachDeductions(coachApi, memberId).catch(() => [] as DeductionHistoryItemDto[]),
        ]);
        const raw = pkgRes.data.data?.packages;
        const member = pkgRes.data.data?.member;
        if (member?.name) setMemberName(member.name);
        if (member?.phoneNumber) setPhone(member.phoneNumber);
        setPackages(Array.isArray(raw) ? (raw as MemberPackageData[]) : []);
        setHistory(deductions);
      } catch {
        toast.error("Failed to load packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [memberId, coachApi]);

  const handlePackageUpdated = (updated: MemberPackageData) => {
    setPackages((prev) =>
      prev.map((p) => (p.pkgStartDate === updated.pkgStartDate ? { ...p, ...updated } : p))
    );
    getCoachDeductions(coachApi, memberId)
      .then(setHistory)
      .catch(() => undefined);
  };

  const active = packages.filter((p) => !p.isExpired);
  const past = packages.filter((p) => p.isExpired);
  const tel = telHref(phone);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/coach/clients")}
          aria-label="Back to client list"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold">{memberName}</h2>
          {tel ? (
            <a href={tel} className="text-xs text-muted-foreground hover:underline">
              {phone}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">{phone}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : packages.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          This member has never had a PT package with you.
        </p>
      ) : (
        <>
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((pkg) => (
                <PackageCard
                  key={`${pkg.pkgId}-${pkg.pkgStartDate}`}
                  pkg={pkg}
                  onDeduct={() => setDeductTarget(pkg)}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Past packages ({past.length})
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((pkg) => (
                  <PackageCard key={`${pkg.pkgId}-${pkg.pkgStartDate}`} pkg={pkg} />
                ))}
              </div>
            </details>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold">Deduction history</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deductions yet.</p>
            ) : (
              <div className="divide-y overflow-hidden rounded-lg border">
                {history.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="text-sm">{item.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Session {format(new Date(item.sessionDate), "dd MMM yyyy")} ·{" "}
                      {item.classesRemainingAfter} left after
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {deductTarget && (
        <DeductionModal
          open
          memberId={memberId}
          memberName={memberName}
          remainingClasses={deductTarget.remainingClasses}
          memberPackageStartDate={deductTarget.pkgStartDate}
          pkgId={deductTarget.pkgId}
          pkgName={deductTarget.name}
          onClose={() => setDeductTarget(null)}
          onSuccess={handlePackageUpdated}
        />
      )}
    </div>
  );
}
