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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FUNCTIONAL_TRAINING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "STUDIO":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "SWIMMING":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
      case "PERSONAL_TRAINING":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatCategoryName = (category: string) => {
    return category
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatClasses = (classes: string) => {
    return classes == "1000" ? "Unlimited" : classes;
  };

  return (
    <Card
      className={cn(
        "w-full hover:shadow-md transition-shadow touch-manipulation",
        isHidden && "opacity-60"
      )}
      role="article"
      aria-label={`Package ${pkg.name}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with package name and visibility */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <PackageIcon className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate">{pkg.name}</h3>
                <Badge
                  className={cn(
                    "text-xs font-medium mt-1",
                    getCategoryColor(pkg.category)
                  )}
                >
                  {formatCategoryName(pkg.category)}
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
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {formatClasses(pkg.numberOfSessions)} Sessions
                  </p>
                  <p className="text-xs">Total classes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {pkg.expiryPeriod}
                  </p>
                  <p className="text-xs">Validity period</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-lg">
                    EGP{pkg.price}
                  </p>
                  <p className="text-xs">Package price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t">
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <EditPackageDialog pkg={pkg} classes={classes} categories={packageCategories} />
              </div>
              <div className="flex-1">
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
