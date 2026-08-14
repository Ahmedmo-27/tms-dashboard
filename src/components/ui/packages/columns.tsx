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
import { formatCategory, formatSessionCount, getCategoryColor } from "@/lib/utils/catalog";
import { createBranchColumn } from "../branch-column";
import { cn } from "@/lib/utils";
import { getPackageBranchLabel } from "@/lib/utils/location-label";
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
  renewalPeriod?: string;
  category: string;
  price: string;
  hidden?: boolean;
  locationId?: string | { _id?: string; branchName?: string; location?: string };
  opensClasses: { _id: string; title: string }[];
  classRestrictions?: { cid: string; limit: number }[];
  branchLabel?: string;
};

export function createColumns(
  classes: Class[],
  packageCategories: string[],
  showBranch = false
): ColumnDef<Package>[] {
  return [
    ...createBranchColumn<Package>(showBranch, (pkg) =>
      getPackageBranchLabel(pkg.locationId, pkg.branchLabel)
    ),
    {
      accessorKey: "name",
      header: "Name",
      size: 180,
      cell: ({ row }) => (
        <div className="min-w-[100px] max-w-[180px] lg:max-w-[220px]">
          <p className="font-medium truncate">{row.original.name}</p>
          {row.original.hidden && (
            <Badge variant="secondary" className="mt-1 text-[10px]">
              Hidden
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "numberOfSessions",
      header: "Sessions",
      size: 80,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatSessionCount(row.original.numberOfSessions)}
        </span>
      ),
    },
    {
      accessorKey: "expiryPeriod",
      header: "Expiry",
      size: 72,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.original.expiryPeriod}d
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      size: 100,
      cell: ({ row }) => (
        <span className="font-medium tabular-nums whitespace-nowrap">
          EGP {Number(row.original.price).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      size: 120,
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] lg:text-xs font-medium max-w-[110px] lg:max-w-none truncate",
            getCategoryColor(row.original.category)
          )}
        >
          {formatCategory(row.original.category)}
        </Badge>
      ),
    },
    {
      id: "opensClasses",
      header: "Classes",
      size: 160,
      cell: ({ row }) => {
        const opens = row.original.opensClasses;
        if (!opens || opens.length === 0) {
          return <span className="text-muted-foreground">—</span>;
        }
        const visible = opens.filter((c) => c != null).slice(0, 2);
        const remaining = opens.length - visible.length;
        return (
          <div className="flex flex-wrap gap-1 max-w-[160px] xl:max-w-[220px]">
            {visible.map((c) => (
              <Badge key={c._id} variant="secondary" className="text-[10px] lg:text-xs truncate max-w-full">
                {c.title}
              </Badge>
            ))}
            {remaining > 0 && (
              <Badge variant="outline" className="text-[10px] lg:text-xs">
                +{remaining}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "visibility",
      header: () => <span className="sr-only">Visibility</span>,
      size: 48,
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
                  size="icon"
                  className="h-8 w-8"
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
      header: () => <span className="sr-only">Actions</span>,
      size: 120,
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex gap-1.5 lg:gap-2 shrink-0">
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
