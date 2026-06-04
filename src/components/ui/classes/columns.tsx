import { ColumnDef } from "@tanstack/react-table";
import EditClassDialog from "../dialogs/class/edit-class";
import DeleteClassDialog from "../dialogs/class/delete-class";
import ManagePackagesDialog from "../dialogs/class/manage-packages";
import { Package } from "../packages/columns";
import { formatCategory } from "@/lib/utils/catalog";
import type { Location } from "@/lib/data/locations";

export type ClassLocation = string | Location;

export type Class = {
  _id: string;
  title: string;
  category: string;
  price: string;
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
  locations: Location[] = []
): ColumnDef<Class>[] {
  const locationMap = new Map(
    locations.map((location) => [location._id, location.branchName || location.location])
  );

  return [
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => formatCategory(row.original.category),
    },
    {
      accessorKey: "price",
      header: "Price",
    },
    {
      accessorKey: "locations",
      header: "Location",
      cell: ({ row }) => formatLocations(row.original.locations, locationMap) || "No location",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const cls = row.original;
        return (
          <div className="flex gap-2">
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
