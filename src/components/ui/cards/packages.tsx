"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { MemberPackage, AdjustmentRecord } from "../members/columns";
import { Package } from "../packages/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreHorizontal, ChevronDown, ChevronUp, Snowflake, Play } from "lucide-react";
import AddClasses from "@/components/ui/dialogs/member package/add-classes";
import ExtendPackage from "@/components/ui/dialogs/member package/extend-package";
import SubPackage from "@/components/ui/dialogs/member package/sub-package";
import CancelPackageDialog from "@/components/ui/dialogs/member package/cancel-package";
import { FreezePackageDialog } from "@/components/ui/dialogs/freeze/freeze-package-dialog";
import { adminUnfreezePackageAction } from "@/lib/actions/freeze-actions";
import toast from "react-hot-toast";
import { getActionErrorMessage } from "@/lib/utils/api-error-message";
import { format } from "date-fns";
import { MobilePackageCard } from "./mobile-package-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, Fragment } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SOURCE_LABELS: Record<AdjustmentRecord["source"], string> = {
  BOOKING: "Booking",
  PT_ATTENDANCE: "PT Attendance",
  ADMIN: "Admin",
  MEMBER_CANCELLATION: "Member Cancel",
  FRONTDESK_CANCELLATION: "FD Cancel",
};

const SOURCE_COLORS: Record<AdjustmentRecord["source"], string> = {
  BOOKING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PT_ATTENDANCE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MEMBER_CANCELLATION: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  FRONTDESK_CANCELLATION: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function PackageHistoryPanel({ pkg }: { pkg: MemberPackage }) {
  const sortedHistory = [...(pkg.adjustmentHistory ?? [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const freezeHistory = [...(pkg.freezeInfo?.freezeHistory ?? [])].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <Tabs defaultValue="deductions" className="w-full">
      <TabsList className="mb-2">
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="deductions">Deductions</TabsTrigger>
        <TabsTrigger value="freezes">
          Freezes {freezeHistory.length > 0 && `(${freezeHistory.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="attendance">
        <ScrollArea className="max-h-48">
          {(pkg.attendance ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No attendance history
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Class / Session</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pkg.attendance.map((rec, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm py-2">{rec.className}</TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2">
                      {rec.attendanceDate
                        ? format(new Date(rec.attendanceDate), "dd MMM yyyy, HH:mm")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="deductions">
        <ScrollArea className="max-h-48">
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No history available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs text-right">Amt</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((rec, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground py-2 whitespace-nowrap">
                      {format(new Date(rec.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          rec.type === "ADD"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {rec.type === "ADD" ? "+Add" : "-Deduct"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          SOURCE_COLORS[rec.source]
                        )}
                      >
                        {SOURCE_LABELS[rec.source]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-right py-2">
                      {rec.amount}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2 max-w-[160px] truncate">
                      {rec.reason ?? rec.className ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </TabsContent>

      <TabsContent value="freezes">
        <ScrollArea className="max-h-48">
          {freezeHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No freeze history recorded
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Start Date</TableHead>
                  <TableHead className="text-xs">End Date</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {freezeHistory.map((rec, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground py-2 whitespace-nowrap">
                      {rec.startDate ? format(new Date(rec.startDate), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2 whitespace-nowrap">
                      {rec.endDate ? format(new Date(rec.endDate), "dd MMM yyyy") : "Active"}
                    </TableCell>
                    <TableCell className="text-xs font-medium py-2">
                      {rec.durationDays} Days
                    </TableCell>
                    <TableCell className="py-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                          rec.type === "STANDARD"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400"
                            : rec.type === "EXTRA"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {rec.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-2 max-w-[160px] truncate">
                      {rec.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}

export default function Packages({
  memberPackages,
  uid,
  packages,
  hideHeader = false,
}: {
  memberPackages: MemberPackage[];
  uid: string;
  packages: Package[];
  hideHeader?: boolean;
}) {
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [activeModal, setActiveModal] = useState<{
    type: "adjust" | "extend" | "freeze" | "cancel";
    pkg: MemberPackage;
  } | null>(null);

  const toggleExpand = (key: string) =>
    setExpandedPkg((prev) => (prev === key ? null : key));

  const toggleNameExpand = (key: string) =>
    setExpandedNames((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleUnfreeze = async (packageId: string, pkgStartDate: string) => {
    try {
      const res = await adminUnfreezePackageAction(uid, packageId, pkgStartDate);
      if (res.success) {
        toast.success("Package unfrozen successfully!");
      } else {
        toast.error(getActionErrorMessage(res, "Failed to unfreeze package"));
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to unfreeze package");
    }
  };

  return (
    <Card className="flex-1 border-0 shadow-none">
      {!hideHeader && (
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg sm:text-xl font-semibold">Packages</h3>
          <div className="flex items-center gap-2">
            <SubPackage uid={uid} packages={packages} />
          </div>
        </div>
      </CardHeader>
      )}
      <CardContent className="p-4 sm:p-6">
        {/* Mobile view */}
        <div className="block lg:hidden">
          {memberPackages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active packages found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberPackages.map((pkg, index) => {
                const key = `${pkg._id}-${pkg.pkgStartDate}`;
                return (
                  <div key={index}>
                    <MobilePackageCard pkg={pkg} uid={uid} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 text-xs text-muted-foreground"
                      onClick={() => toggleExpand(key)}
                    >
                      {expandedPkg === key ? (
                        <><ChevronUp className="h-3 w-3 mr-1" /> Hide history</>
                      ) : (
                        <><ChevronDown className="h-3 w-3 mr-1" /> Show history</>
                      )}
                    </Button>
                    {expandedPkg === key && (
                      <div className="mt-2 border rounded-lg p-3">
                        <PackageHistoryPanel pkg={pkg} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop view */}
        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Package Name</TableHead>
                <TableHead className="text-xs sm:text-sm">Start Date</TableHead>
                <TableHead className="text-xs sm:text-sm">End Date</TableHead>
                <TableHead className="text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">Classes Left</TableHead>
                <TableHead className="w-[140px] text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberPackages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No active packages found.
                  </TableCell>
                </TableRow>
              ) : (
                memberPackages.map((pkg, index) => {
                  const key = `${pkg._id}-${pkg.pkgStartDate}`;
                  const isExpanded = expandedPkg === key;
                  const isFrozen = pkg.status === "FROZEN" || Boolean(pkg.freezeInfo?.isFrozen);
                  return (
                    <Fragment key={key}>
                      <TableRow className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium text-sm py-3 px-2 sm:px-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                                  expandedNames.has(key)
                                    ? "whitespace-normal break-words max-w-[280px]"
                                    : "truncate max-w-[150px] block"
                                )}
                                onClick={() => toggleNameExpand(key)}
                                aria-expanded={expandedNames.has(key)}
                              >
                                {pkg.name}
                              </button>
                            </TooltipTrigger>
                            {!expandedNames.has(key) && (
                              <TooltipContent side="top" className="max-w-xs">
                                <p>{pkg.name}</p>
                                <p className="text-primary-foreground/70 mt-1">
                                  Click to expand
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {pkg.pkgStartDate === ""
                                ? "—"
                                : format(new Date(pkg.pkgStartDate), "dd-MM-yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">
                              {pkg.pkgEndDate === ""
                                ? "—"
                                : format(new Date(pkg.pkgEndDate), "dd-MM-yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                              isFrozen &&
                                "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-300",
                              !isFrozen && pkg.status === "ACTIVE" &&
                                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                              !isFrozen && (pkg.status === "EXPIRED" ||
                                pkg.status === "DELETED" ||
                                pkg.status === "COMPLETED") &&
                                "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                              !isFrozen && pkg.status === "Pending" &&
                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            )}
                            title={
                              isFrozen && pkg.freezeInfo?.freezeEndDate
                                ? `Frozen until ${format(new Date(pkg.freezeInfo.freezeEndDate), "dd-MM-yyyy")}`
                                : undefined
                            }
                          >
                            {isFrozen && <Snowflake className="h-3 w-3" />}
                            {isFrozen ? "Frozen" : pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-3 px-2 sm:px-4">
                          <span
                            className={cn(
                              "font-medium text-sm",
                              pkg.remainingClasses == 0
                                ? "text-red-500"
                                : pkg.remainingClasses <= 2
                                ? "text-yellow-500"
                                : "text-green-500"
                            )}
                          >
                            {pkg.remainingClasses}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-2 sm:px-4">
                          <div className="flex items-center gap-1">
                            {isFrozen ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 text-xs text-green-700 border-green-300 hover:bg-green-50 dark:border-green-800"
                                onClick={() => handleUnfreeze(pkg._id, pkg.pkgStartDate)}
                              >
                                <Play className="h-3 w-3" />
                                Unfreeze
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => setActiveModal({ type: "extend", pkg })}
                              >
                                Extend
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 cursor-pointer"
                              onClick={() => toggleExpand(key)}
                              title={isExpanded ? "Hide history" : "Show history"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 cursor-pointer touch-manipulation"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onSelect={() => setActiveModal({ type: "adjust", pkg })}
                                  className="cursor-pointer"
                                >
                                  Adjust classes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => setActiveModal({ type: "extend", pkg })}
                                  className="cursor-pointer"
                                >
                                  Change package end date
                                </DropdownMenuItem>
                                {!isFrozen && pkg.status === "ACTIVE" && (
                                  <DropdownMenuItem
                                    onSelect={() => setActiveModal({ type: "freeze", pkg })}
                                    className="cursor-pointer text-sky-600 focus:text-sky-700"
                                  >
                                    <Snowflake className="h-4 w-4 mr-2" />
                                    Freeze package
                                  </DropdownMenuItem>
                                )}
                                {isFrozen && (
                                  <DropdownMenuItem
                                    onSelect={() => handleUnfreeze(pkg._id, pkg.pkgStartDate)}
                                    className="cursor-pointer text-green-600 focus:text-green-700"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Unfreeze package
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => setActiveModal({ type: "cancel", pkg })}
                                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                  Cancel Package
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${key}-history`}>
                          <TableCell colSpan={6} className="bg-muted/30 px-4 py-3">
                            <PackageHistoryPanel pkg={pkg} />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Dialogs rendered outside dropdowns to avoid unmounting on dropdown close */}
        {activeModal?.type === "adjust" && (
          <AddClasses
            pkg={activeModal.pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal?.type === "extend" && (
          <ExtendPackage
            pkg={activeModal.pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal?.type === "freeze" && (
          <FreezePackageDialog
            pkg={activeModal.pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal?.type === "cancel" && (
          <CancelPackageDialog
            pkg={activeModal.pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
