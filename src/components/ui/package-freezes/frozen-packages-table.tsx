"use client";

import { FrozenPackageItem } from "@/lib/data/freeze";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, isAfter } from "date-fns";
import { UnfreezePackageDialog } from "../dialogs/freeze/unfreeze-package-dialog";
import { Snowflake, Calendar, User, Phone, MapPin, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FrozenPackagesTable({
  packages,
  onRefresh,
}: {
  packages: FrozenPackageItem[];
  onRefresh?: () => void;
}) {
  if (packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground border rounded-lg bg-card">
        <Snowflake className="h-12 w-12 text-sky-400/40 mb-3" />
        <p className="font-semibold text-lg">No Frozen Packages Found</p>
        <p className="text-sm max-w-sm mt-1">
          There are currently no active frozen packages matching your filters.
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="rounded-md border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[190px]">Member</TableHead>
            <TableHead className="min-w-[150px]">Package</TableHead>
            <TableHead className="min-w-[120px]">Branch</TableHead>
            <TableHead className="min-w-[170px]">Freeze Period</TableHead>
            <TableHead className="min-w-[140px]">Remaining Freeze</TableHead>
            <TableHead className="min-w-[140px]">Package Expiry</TableHead>
            <TableHead className="min-w-[140px]">Freeze Details</TableHead>
            <TableHead className="text-right min-w-[130px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg, idx) => {
            const memberId = pkg.member?._id ?? "";
            const memberName = pkg.member?.name ?? "Unknown";
            const memberPhone = pkg.member?.phoneNumber ?? "—";
            const branchName = pkg.locationId?.branchName ?? "All Branches";

            const freezeStart = pkg.freezeInfo?.freezeStartDate
              ? new Date(pkg.freezeInfo.freezeStartDate)
              : null;
            const freezeEnd = pkg.freezeInfo?.freezeEndDate
              ? new Date(pkg.freezeInfo.freezeEndDate)
              : null;

            const remainingDays = freezeEnd
              ? Math.max(0, differenceInDays(freezeEnd, now))
              : 0;

            const latestHistory = pkg.freezeInfo?.freezeHistory?.[pkg.freezeInfo.freezeHistory.length - 1];
            const freezeType = latestHistory?.type || "STANDARD";
            const freezeReason = latestHistory?.reason;

            return (
              <TableRow key={`${memberId}-${pkg.pkgId}-${idx}`} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex flex-col">
                    {memberId ? (
                      <Link
                        href={`/dashboard/our-members/${memberId}`}
                        className="font-medium hover:underline text-primary flex items-center gap-1.5"
                      >
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span>{memberName}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Link>
                    ) : (
                      <span className="font-medium">{memberName}</span>
                    )}
                    {memberPhone !== "—" && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 shrink-0" />
                        {memberPhone}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{pkg.pkgName}</span>
                    <span className="text-xs text-muted-foreground">
                      {pkg.remainingClasses} class{pkg.remainingClasses === 1 ? "" : "es"} remaining
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{branchName}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col text-xs gap-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3 text-sky-500" />
                      {freezeStart ? format(freezeStart, "dd MMM yyyy") : "—"}
                    </span>
                    <span className="text-muted-foreground pl-4">
                      to {freezeEnd ? format(freezeEnd, "dd MMM yyyy") : "—"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Badge
                      variant="outline"
                      className="w-fit bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-xs font-semibold"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {remainingDays} day{remainingDays === 1 ? "" : "s"} left
                    </Badge>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-xs font-medium">
                    {pkg.pkgEndDate ? format(new Date(pkg.pkgEndDate), "dd MMM yyyy") : "—"}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col text-xs gap-0.5">
                    <Badge
                      variant="secondary"
                      className="w-fit text-[11px] uppercase tracking-wider"
                    >
                      {freezeType}
                    </Badge>
                    {freezeReason && (
                      <span className="text-[11px] text-muted-foreground italic truncate max-w-[150px]" title={freezeReason}>
                        "{freezeReason}"
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <div data-walkthrough="unfreeze-action-btn" className="inline-block">
                    <UnfreezePackageDialog
                      memberId={memberId}
                      memberName={memberName}
                      pkgId={pkg.pkgId}
                      pkgName={pkg.pkgName}
                      pkgStartDate={pkg.pkgStartDate}
                      freezeEndDate={pkg.freezeInfo?.freezeEndDate}
                      onSuccess={onRefresh}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
