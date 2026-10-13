import { ColumnDef } from "@tanstack/react-table";
import EditClassDialog from "../dialogs/class/edit-class";
import DeleteClassDialog from "../dialogs/class/delete-class";
import ManagePackagesDialog from "../dialogs/class/manage-packages";
import { Package } from "../packages/columns";
import { Badge } from "../badge";
import { Button } from "../button";
import { Edit, Layers, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCategory, getCategoryColor } from "@/lib/utils/catalog";
import { cn } from "@/lib/utils";
import type { Location } from "@/lib/data/locations";

export type ClassLocation = string | Location;

export type Class = {
  _id: string;
  title: string;
  category: string;
  price: string | number;
  locations: ClassLocation[];
};

const getLocationLabel = (
  location: ClassLocation,
  locationMap: Map<string, string>
): string => {
  if (!location) return "";
  if (typeof location === "string") {
    return locationMap.get(location) ?? location;
  }
  return location.branchName || location.location || location._id;
};

export const formatLocations = (
  locations: ClassLocation[] | undefined,
  locationMap: Map<string, string>
): string => {
  if (!locations || locations.length === 0) return "";
  const labels = locations
    .map((location) => getLocationLabel(location, locationMap))
    .filter((label) => label.length > 0);
  return labels.join(", ");
};

export function createColumns(
  packages: Package[],
  classCategories: string[],
  locations: Location[] = [],
  showLocation = false,
  onManagePackages?: (cls: Class) => void,
  onEdit?: (cls: Class) => void,
  onDelete?: (cls: Class) => void
): ColumnDef<Class>[] {
  const locationMap = new Map(
    locations.map((location) => [location._id, location.branchName || location.location])
  );

  const formatPrice = (price: string | number) => {
    const normalized = String(price ?? "").trim();
    if (normalized === "0" || normalized === "0.00" || Number(normalized) === 0) {
      return "Free";
    }
    const num = Number(normalized);
    if (!isNaN(num)) {
      return `EGP ${num.toLocaleString()}`;
    }
    return normalized;
  };

  return [
    {
      accessorKey: "title",
      header: "Title",
      size: 220,
      cell: ({ row }) => (
        <span className="font-medium text-foreground block max-w-[200px] xl:max-w-[280px] truncate">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      size: 140,
      cell: ({ row }) => (
        <Badge
          className={cn(
            "text-xs font-medium whitespace-nowrap",
            getCategoryColor(row.original.category)
          )}
        >
          {formatCategory(row.original.category)}
        </Badge>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      size: 110,
      cell: ({ row }) => {
        const price = formatPrice(row.original.price);
        return (
          <span
            className={cn(
              "tabular-nums whitespace-nowrap font-medium",
              price === "Free"
                ? "text-green-600 dark:text-green-400"
                : "text-foreground"
            )}
          >
            {price}
          </span>
        );
      },
    },
    ...(showLocation
      ? [
          {
            accessorKey: "locations",
            header: "Location",
            size: 160,
            cell: ({ row }: { row: { original: Class } }) => {
              const label =
                formatLocations(row.original.locations, locationMap) ||
                "No location";
              return (
                <span className="text-muted-foreground text-xs sm:text-sm max-w-[160px] xl:max-w-[200px] truncate block">
                  {label}
                </span>
              );
            },
          } satisfies ColumnDef<Class>,
        ]
      : []),
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 145,
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex items-center justify-end gap-2 shrink-0">
            {onManagePackages ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9.5 w-9.5 cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onManagePackages(cls);
                    }}
                  >
                    <Layers className="size-4.5" />
                    <span className="sr-only">Manage Packages</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Manage Packages</TooltipContent>
              </Tooltip>
            ) : (
              <ManagePackagesDialog
                key={`manage-${cls._id}`}
                cls={cls}
                packages={packages}
                compact
                buttonClassName="h-9.5 w-9.5"
              />
            )}
            {onEdit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9.5 w-9.5 cursor-pointer shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cls);
                    }}
                  >
                    <Edit className="size-4.5" />
                    <span className="sr-only">Edit Class</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Class</TooltipContent>
              </Tooltip>
            ) : (
              <EditClassDialog
                key={`edit-${cls._id}`}
                cls={cls}
                categories={classCategories}
                locations={locations}
                compact
                buttonClassName="h-9.5 w-9.5"
              />
            )}
            {onDelete ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9.5 w-9.5 cursor-pointer shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(cls);
                    }}
                  >
                    <Trash className="size-4.5" />
                    <span className="sr-only">Delete Class</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Class</TooltipContent>
              </Tooltip>
            ) : (
              <DeleteClassDialog
                key={`delete-${cls._id}`}
                cls={cls}
                compact
                buttonClassName="h-9.5 w-9.5"
              />
            )}
          </div>
        );
      },
    },
  ];
}
