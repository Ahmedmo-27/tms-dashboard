import { Card, CardContent } from "../card";
import { Badge } from "../badge";
import {
  Dumbbell,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Class, formatLocations } from "./columns";
import { Package } from "../packages/columns";
import { cn } from "@/lib/utils";
import EditClassDialog from "../dialogs/class/edit-class";
import DeleteClassDialog from "../dialogs/class/delete-class";
import ManagePackagesDialog from "../dialogs/class/manage-packages";
import { formatCategory } from "@/lib/utils/catalog";
import type { Location } from "@/lib/data/locations";

interface MobileClassCardProps {
  cls: Class;
  packages: Package[];
  classCategories?: string[];
  locations?: Location[];
}

export function MobileClassCard({
  cls,
  packages,
  classCategories = [],
  locations = [],
}: MobileClassCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FUNCTIONAL_TRAINING":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "STUDIO":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "WORKSPACE":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatPrice = (price: string) => {
    if (price === "0" || price === "0.00") return "Free";
    return price;
  };

  const locationMap = new Map(
    locations.map((location) => [location._id, location.branchName || location.location])
  );
  const locationLabel = formatLocations(cls.locations, locationMap) || "No location";

  return (
    <Card
      className="w-full hover:shadow-md transition-shadow touch-manipulation"
      role="article"
      aria-label={`Class ${cls.title}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with class title and category */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Dumbbell className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base truncate">
                  {cls.title}
                </h3>
                <Badge
                  className={cn(
                    "text-xs font-medium mt-1",
                    getCategoryColor(cls.category)
                  )}
                >
                  {formatCategory(cls.category)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Class details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">
                    {locationLabel}
                  </p>
                  <p className="text-xs">Location</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-lg">
                    {formatPrice(cls.price)}
                  </p>
                  <p className="text-xs">Price</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t">
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <ManagePackagesDialog cls={cls} packages={packages} />
              </div>
              <div className="flex-1">
                <EditClassDialog
                  cls={cls}
                  categories={classCategories}
                  locations={locations}
                />
              </div>
              <div className="flex-1">
                <DeleteClassDialog cls={cls} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
