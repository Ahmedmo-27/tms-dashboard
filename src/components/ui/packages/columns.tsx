import { ColumnDef } from "@tanstack/react-table";
import DeletePackageDialog from "../dialogs/package/delete-package";
import EditPackageDialog from "../dialogs/package/edit-package";
import { Eye, EyeClosed, LoaderIcon } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { changePackageVisibility } from "@/lib/data/package";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Class } from "../classes/columns";
import { formatCategory } from "@/lib/utils/catalog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type Package = {
  _id: string;
  name: string;
  numberOfSessions: string;
  expiryPeriod: string;
  category: string;
  price: string;
  hidden?: boolean;
  renewalPeriod?: string;
  locationId?: string | { _id?: string; branchName?: string; location?: string };
  opensClasses: { _id: string; title: string }[];
  classRestrictions?: { cid: string; limit: number }[];
};

export function createColumns(
  classes: Class[],
  packageCategories: string[]
): ColumnDef<Package>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "numberOfSessions",
      header: "Sessions",
    },
    {
      accessorKey: "expiryPeriod",
      header: "Expiry (days)",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `EGP ${row.original.price}`,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => formatCategory(row.original.category),
    },
    {
      id: "opensClasses",
      header: "Opens Classes",
      cell: ({ row }) => {
        const opens = row.original.opensClasses;
        if (!opens || opens.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {opens.filter((c) => c != null).map((c) => (
              <Badge key={c._id} variant="secondary" className="text-xs">
                {c.title}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "visibility",
      cell: ({ row }) => {
        const router = useRouter();
        const pkg = row.original;
        const [isLoading, setIsLoading] = useState(false);
        const [isHidden, setIsHidden] = useState(pkg.hidden);
        const handleVisibilityChange = async () => {
          setIsLoading(true);
          const newHidden = !isHidden;
          setIsHidden(newHidden);
          await changePackageVisibility(pkg._id, newHidden);
          router.refresh();
          setIsLoading(false);
        };
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={handleVisibilityChange}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoaderIcon className="animate-spin" />
                  ) : isHidden ? (
                    <EyeClosed />
                  ) : (
                    <Eye />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isHidden ? "Hidden from members" : "Visible to members"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex gap-2 w-full">
            <EditPackageDialog
              pkg={pkg}
              classes={classes}
              categories={packageCategories}
            />
            <DeletePackageDialog pkg={pkg} />
          </div>
        );
      },
    },
  ];
}
