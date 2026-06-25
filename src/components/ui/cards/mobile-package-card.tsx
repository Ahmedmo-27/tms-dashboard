import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Calendar, Package, MoreHorizontal, Clock } from "lucide-react";
import { MemberPackage } from "../members/columns";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import AddClasses from "../dialogs/member package/add-classes";
import ExtendPackage from "../dialogs/member package/extend-package";
import CancelPackageDialog from "../dialogs/member package/cancel-package";

interface MobilePackageCardProps {
  pkg: MemberPackage;
  uid: string;
}

export function MobilePackageCard({ pkg, uid }: MobilePackageCardProps) {
  const getStatusColor = (status: string) => {
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
              <h3 className="font-semibold text-sm truncate">
                {pkg.name}
              </h3>
            </div>
            <DropdownMenu>
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
                <AddClasses uid={uid} pkg={pkg} />
                <ExtendPackage uid={uid} pkg={pkg} />
                <DropdownMenuSeparator />
                <CancelPackageDialog uid={uid} pkg={pkg} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status and classes left */}
          <div className="flex items-center justify-between">
            <Badge 
              className={cn(
                "text-xs font-medium",
                getStatusColor(pkg.status)
              )}
            >
              {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
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
      </CardContent>
    </Card>
  );
}
