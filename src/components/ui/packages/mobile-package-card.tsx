import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Package as PackageIcon,
  Calendar,
  Users,
  DollarSign,
  Eye,
  EyeClosed,
  LoaderIcon,
} from "lucide-react";
import { Package } from "./columns";
import { cn } from "@/lib/utils";
import {
  formatCategory,
  formatSessionCount,
  getCategoryColor,
} from "@/lib/utils/catalog";
import DeletePackageDialog from "../dialogs/package/delete-package";
import EditPackageDialog from "../dialogs/package/edit-package";
import { changePackageVisibility } from "@/lib/data/package";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobilePackageCardProps {
  pkg: Package;
  classes: import("../classes/columns").Class[];
  packageCategories: string[];
}

export function MobilePackageCard({ pkg, classes, packageCategories }: MobilePackageCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(pkg.hidden);

  const handleVisibilityChange = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    const newHidden = !isHidden;
    setIsHidden(newHidden);
    await changePackageVisibility(pkg._id, newHidden);
    router.refresh();
    setIsLoading(false);
  };

  const opensClasses = (pkg.opensClasses ?? []).filter((c) => c?._id);

  return (
    <Card
      className={cn(
        "w-full min-w-0 hover:shadow-md transition-shadow touch-manipulation py-0",
        isHidden && "opacity-60"
      )}
      role="article"
      aria-label={`Package ${pkg.name}`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2.5 sm:space-y-3">
          {/* Header with package name and visibility */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PackageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm sm:text-base truncate">{pkg.name}</h3>
                <Badge
                  className={cn(
                    "text-[10px] sm:text-xs font-medium mt-1 max-w-full truncate",
                    getCategoryColor(pkg.category)
                  )}
                >
                  {formatCategory(pkg.category)}
                </Badge>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleVisibilityChange}
                    disabled={isLoading}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {isLoading ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : isHidden ? (
                      <EyeClosed className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isHidden ? "Hidden from members" : "Visible to members"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Package details */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 sm:gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {formatSessionCount(pkg.numberOfSessions)} Sessions
                  </p>
                  <p className="text-[11px] sm:text-xs">Total classes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm tabular-nums">
                    {pkg.expiryPeriod} days
                  </p>
                  <p className="text-[11px] sm:text-xs">Validity period</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-base sm:text-lg tabular-nums truncate">
                    EGP {Number(pkg.price).toLocaleString()}
                  </p>
                  <p className="text-[11px] sm:text-xs">Package price</p>
                </div>
              </div>
            </div>
          </div>

          {opensClasses.length > 0 && (
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {opensClasses.map((cls) => (
                <Badge key={cls._id} variant="secondary" className="text-[10px] sm:text-xs max-w-[calc(50%-0.25rem)] truncate">
                  {cls.title}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2.5 sm:pt-3 border-t">
            <div className="flex flex-col min-[420px]:flex-row gap-2 w-full">
              <div className="flex-1 min-w-0 [&_button]:w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/packages/${pkg._id}?page=1`)}
                  className="flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4 text-primary" />
                  View Members
                </Button>
              </div>
              <div className="flex-1 min-w-0 [&_button]:w-full">
                <EditPackageDialog pkg={pkg} classes={classes} categories={packageCategories} />
              </div>
              <div className="flex-1 min-w-0 [&_button]:w-full">
                <DeletePackageDialog pkg={pkg} />
              </div>
            </div>
          </div>

          {/* Status indicator */}
          {isHidden && (
            <div className="pt-2">
              <Badge variant="secondary" className="text-xs">
                Hidden from members
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
