import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Calendar, Package, MoreHorizontal, Clock, Snowflake, Play } from "lucide-react";
import { useState } from "react";
import { MemberPackage } from "../members/columns";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import AddClasses from "../dialogs/member package/add-classes";
import ExtendPackage from "../dialogs/member package/extend-package";
import CancelPackageDialog from "../dialogs/member package/cancel-package";
import { FreezePackageDialog } from "../dialogs/freeze/freeze-package-dialog";
import { adminUnfreezePackageAction } from "@/lib/actions/freeze-actions";
import toast from "react-hot-toast";

interface MobilePackageCardProps {
  pkg: MemberPackage;
  uid: string;
}

export function MobilePackageCard({ pkg, uid }: MobilePackageCardProps) {
  const [isNameExpanded, setIsNameExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState<
    "adjust" | "extend" | "freeze" | "cancel" | null
  >(null);
  const isFrozen = pkg.status === "FROZEN" || Boolean(pkg.freezeInfo?.isFrozen);

  const handleUnfreeze = async () => {
    try {
      const res = await adminUnfreezePackageAction(uid, pkg._id, pkg.pkgStartDate);
      if (res.success) {
        toast.success("Package unfrozen successfully!");
      } else {
        toast.error((res.errors as { message?: string })?.message || "Failed to unfreeze package");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to unfreeze package");
    }
  };

  const getStatusColor = (status: string) => {
    if (isFrozen) {
      return "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-300";
    }
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "EXPIRED":
      case "DELETED":
      case "COMPLETED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getClassesLeftColor = (remaining: number) => {
    if (remaining === 0) return "text-red-500";
    if (remaining <= 2) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <Card className="w-full hover:shadow-md transition-shadow touch-manipulation">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with package name and actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Package className="h-4 w-4 text-primary flex-shrink-0" />
              <button
                type="button"
                className={cn(
                  "font-semibold text-sm text-left cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                  isNameExpanded ? "whitespace-normal break-words" : "truncate"
                )}
                onClick={() => setIsNameExpanded((prev) => !prev)}
                aria-expanded={isNameExpanded}
              >
                {pkg.name}
              </button>
            </div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 touch-manipulation"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => setActiveModal("adjust")}
                  className="cursor-pointer"
                >
                  Adjust classes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setActiveModal("extend")}
                  className="cursor-pointer"
                >
                  Change package end date
                </DropdownMenuItem>
                {!isFrozen && pkg.status === "ACTIVE" && (
                  <DropdownMenuItem
                    onSelect={() => setActiveModal("freeze")}
                    className="cursor-pointer text-sky-600 focus:text-sky-700"
                  >
                    <Snowflake className="h-4 w-4 mr-2" />
                    Freeze package
                  </DropdownMenuItem>
                )}
                {isFrozen && (
                  <DropdownMenuItem
                    onSelect={handleUnfreeze}
                    className="cursor-pointer text-green-600 focus:text-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Unfreeze package
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setActiveModal("cancel")}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  Cancel Package
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status and classes left */}
          <div className="flex items-center justify-between">
            <Badge 
              className={cn(
                "text-xs font-medium gap-1",
                getStatusColor(pkg.status)
              )}
            >
              {isFrozen && <Snowflake className="h-3 w-3" />}
              {isFrozen ? "Frozen" : pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
            </Badge>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={cn(
                "text-sm font-medium",
                getClassesLeftColor(pkg.remainingClasses)
              )}>
                {pkg.remainingClasses} left
              </span>
            </div>
          </div>

          {/* Date information */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            {pkg.pkgStartDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs">Started:</span>
                <span className="font-medium">
                  {format(new Date(pkg.pkgStartDate), "dd MMM yyyy")}
                </span>
              </div>
            )}
            {pkg.pkgEndDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="text-xs">Expires:</span>
                <span className="font-medium">
                  {format(new Date(pkg.pkgEndDate), "dd MMM yyyy")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs rendered outside dropdown */}
        {activeModal === "adjust" && (
          <AddClasses
            pkg={pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal === "extend" && (
          <ExtendPackage
            pkg={pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal === "freeze" && (
          <FreezePackageDialog
            pkg={pkg}
            uid={uid}
            open={true}
            onOpenChange={(open) => {
              if (!open) setActiveModal(null);
            }}
          />
        )}
        {activeModal === "cancel" && (
          <CancelPackageDialog
            pkg={pkg}
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
