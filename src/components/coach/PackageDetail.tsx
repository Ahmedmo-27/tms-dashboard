"use client";

import { useEffect, useState } from "react";
import { useCoachApi } from "@/hooks/useCoachApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { DeductionModal } from "@/components/coach/DeductionModal";
import type { ClientDto } from "@/types/coach.types";
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
  client: ClientDto;
  openDeductOnMount?: boolean;
  onBack: () => void;
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
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
        Expired
      </Badge>
    );
  }
  if (daysUntilExpiry <= 14) {
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
        Expiring soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
      Active
    </Badge>
  );
}

export function PackageDetail({
  client,
  openDeductOnMount = false,
  onBack,
}: PackageDetailProps) {
  const coachApi = useCoachApi();
  const [packages, setPackages] = useState<MemberPackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deductTarget, setDeductTarget] = useState<{
    memberId: string;
    memberPackageStartDate: string;
    pkgId: string;
  } | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const res = await coachApi.get(
          `/api/coach/clients/${client.memberId}/packages`
        );
        const raw = res.data.data?.packages;
        const data = Array.isArray(raw) ? (raw as MemberPackageData[]).filter(p => !p.isExpired) : [];
        setPackages(data);

        // If opened from "Deduct Class" nav, auto-open modal on first package
        if (openDeductOnMount && data.length > 0) {
          const first = data[0];
          setDeductTarget({
            memberId: client.memberId,
            memberPackageStartDate: first.pkgStartDate,
            pkgId: first.pkgId,
          });
        }
      } catch {
        toast.error("Failed to load packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [client.memberId, coachApi, openDeductOnMount]);

  const handlePackageUpdated = (updated: MemberPackageData) => {
    setPackages((prev) =>
      prev.map((p) =>
        p.pkgStartDate === updated.pkgStartDate ? updated : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Back button + heading */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold">{client.name}</h2>
          <p className="text-xs text-muted-foreground">{client.phoneNumber}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !Array.isArray(packages) || packages.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No packages found for this member.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const label = pkg.name ?? `Package ${pkg.pkgId}`;
            const endDate = format(new Date(pkg.pkgEndDate), "dd MMM yyyy");
            const progressValue =
              pkg.totalClasses && pkg.totalClasses > 0
                ? Math.round(
                    (pkg.remainingClasses / pkg.totalClasses) * 100
                  )
                : null;

            return (
              <div
                key={`${pkg.pkgId}-${pkg.pkgStartDate}`}
                className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm leading-tight truncate">
                    {label}
                  </p>
                  <StatusBadge
                    isExpired={pkg.isExpired}
                    daysUntilExpiry={pkg.daysUntilExpiry}
                  />
                </div>

                {/* Classes progress */}
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

                {/* Expiry */}
                <p className="text-xs text-muted-foreground">
                  Expires:{" "}
                  <span className="text-foreground font-medium">{endDate}</span>
                </p>

                {/* Deduct button */}
                {pkg.isPtPackage && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-auto w-full"
                    disabled={pkg.isExpired || pkg.remainingClasses === 0}
                    onClick={() =>
                      setDeductTarget({
                        memberId: client.memberId,
                        memberPackageStartDate: pkg.pkgStartDate,
                        pkgId: pkg.pkgId,
                      })
                    }
                  >
                    Deduct class
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Deduction modal */}
      {deductTarget && (
        <DeductionModal
          open
          memberId={deductTarget.memberId}
          memberPackageStartDate={deductTarget.memberPackageStartDate}
          pkgId={deductTarget.pkgId}
          onClose={() => setDeductTarget(null)}
          onSuccess={handlePackageUpdated}
        />
      )}
    </div>
  );
}
