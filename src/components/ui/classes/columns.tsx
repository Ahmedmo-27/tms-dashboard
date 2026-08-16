import { ColumnDef } from "@tanstack/react-table";
import EditClassDialog from "../dialogs/class/edit-class";
import DeleteClassDialog from "../dialogs/class/delete-class";
import ManagePackagesDialog from "../dialogs/class/manage-packages";
import { Package } from "../packages/columns";
import { Badge } from "../badge";
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
  showLocation = false
): ColumnDef<Class>[] {
  const locationMap = new Map(
    locations.map((location) => [location._id, location.branchName || location.location])
  );

  const formatPrice = (price: string | number) => {
    const normalized = String(price ?? "").trim();
    if (normalized === "0" || normalized === "0.00" || Number(normalized) === 0) {
      return "Free";
    }
    return normalized;
  };

  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "text-xs font-medium",
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
      cell: ({ row }) => {
        const price = formatPrice(row.original.price);
        return (
          <span
            className={cn(
              "tabular-nums",
              price === "Free" && "text-green-600 dark:text-green-400 font-medium"
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
            cell: ({ row }: { row: { original: Class } }) => {
              const label =
                formatLocations(row.original.locations, locationMap) ||
                "No location";
              return (
                <span className="text-muted-foreground max-w-[200px] truncate block">
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
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex gap-1.5 justify-end">
            <ManagePackagesDialog cls={cls} packages={packages} />
            <EditClassDialog
              cls={cls}
              categories={classCategories}
              locations={locations}
            />
            <DeleteClassDialog cls={cls} />
          </div>
        );
      },
    },
  ];
}
