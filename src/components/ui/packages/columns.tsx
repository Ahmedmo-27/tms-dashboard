import { ColumnDef } from "@tanstack/react-table";
import DeletePackageDialog from "../dialogs/package/delete-package";
import EditPackageDialog from "../dialogs/package/edit-package";
import { Eye, EyeClosed, LoaderIcon, Users } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { changePackageVisibility } from "@/lib/data/package";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Class } from "../classes/columns";
import { Coach } from "../coaches/columns";
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

export type PackageCoach = {
  _id: string;
  coachName?: string;
  name?: string;
  phoneNumber?: string;
};

export type Package = {
  _id: string;
  name: string;
  numberOfSessions: string;
  expiryPeriod: string;
  renewalPeriod?: string;
  category: string;
  price: string | number;
  hidden?: boolean;
  isDeprecated?: boolean;
  locationId?: string | { _id?: string; branchName?: string; location?: string };
  coachId?: string | PackageCoach | null;
  opensClasses: { _id: string; title: string }[];
  classRestrictions?: { cid: string; limit: number }[];
  branchLabel?: string;
};

function PackageVisibilityCell({ pkg }: { pkg: Package }) {
  const router = useRouter();
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
}

function PackageClassesCell({ pkg }: { pkg: Package }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const opens = (pkg.opensClasses ?? []).filter((c) => c != null);
  if (opens.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = isExpanded ? opens : opens.slice(0, 2);
  const remaining = opens.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1 max-w-[160px] xl:max-w-[220px]">
      {visible.map((c) => (
        <Badge
          key={c._id}
          variant="secondary"
          className="text-[10px] lg:text-xs truncate max-w-full"
        >
          {c.title}
        </Badge>
      ))}
      {(remaining > 0 || isExpanded) && (
        <Badge
          asChild
          variant="outline"
          className="text-[10px] lg:text-xs cursor-pointer hover:bg-accent"
        >
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? "Show less" : `+${remaining}`}
          </button>
        </Badge>
      )}
    </div>
  );
}

export function createColumns(
  classes: Class[],
  packageCategories: string[],
  showBranch = false,
  coaches: Coach[] = []
): ColumnDef<Package>[] {
  return [
    ...createBranchColumn<Package>(showBranch, (pkg) =>
      getPackageBranchLabel(pkg.locationId, pkg.branchLabel)
    ),
    {
      accessorKey: "name",
      header: "Name",
      size: 180,
      cell: ({ row }) => {
        const coachName =
          typeof row.original.coachId === "object" && row.original.coachId !== null
            ? row.original.coachId.coachName || row.original.coachId.name
            : typeof row.original.coachId === "string"
            ? coaches.find((c) => c._id === row.original.coachId)?.coachName
            : undefined;

        return (
          <div className="min-w-[100px] max-w-[180px] lg:max-w-[220px]">
            <p className="font-medium truncate">{row.original.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {coachName && (
                <Badge variant="outline" className="text-[10px]">
                  Coach: {coachName}
                </Badge>
              )}
              {row.original.hidden && (
                <Badge variant="secondary" className="text-[10px]">
                  Hidden
                </Badge>
              )}
              {row.original.isDeprecated && (
                <Badge variant="destructive" className="text-[10px] bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
                  Deleted (w/ active members)
                </Badge>
              )}
            </div>
          </div>
        );
      },
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
      cell: ({ row }) => <PackageClassesCell pkg={row.original} />,
    },
    {
      id: "visibility",
      header: () => <span className="sr-only">Visibility</span>,
      size: 48,
      cell: ({ row }) => <PackageVisibilityCell pkg={row.original} />,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      size: 120,
      cell: ({ row }) => {
        const pkg = row.original;
        return (
          <div className="flex gap-1.5 lg:gap-2 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/dashboard/packages/${pkg._id}?page=1`}>
                      <Users className="h-4 w-4 text-primary" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View active members</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <EditPackageDialog
              pkg={pkg}
              classes={classes}
              categories={packageCategories}
              coaches={coaches}
            />
            <DeletePackageDialog pkg={pkg} />
          </div>
        );
      },
    },
  ];
}
