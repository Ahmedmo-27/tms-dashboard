"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/lib/hooks";
import { isManagementRole } from "@/lib/config/roles";
import type { Location } from "@/lib/data/locations";

type BranchLocationFilterProps = {
  locations: Location[];
  className?: string;
  /** When true, hides "All branches" — management must pick a branch to act. */
  requireSelection?: boolean;
};

export function BranchLocationFilter({
  locations,
  className,
  requireSelection = false,
}: BranchLocationFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role as string | undefined;
  const [isPending, startTransition] = useTransition();

  if (!isManagementRole(role) || locations.length <= 1) {
    return null;
  }

  const current = searchParams.get("locationId") ?? "all";

  const onChange = (value: string) => {
    if (value === current) return;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("locationId");
      } else {
        params.set("locationId", value);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  };

  return (
    <Select value={current} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger
        className={cn(
          "h-8 text-xs font-medium rounded-lg transition-colors",
          className ?? "w-[105px] sm:w-[135px] md:w-[165px]"
        )}
        loading={isPending}
        aria-busy={isPending}
      >
        <span className="flex items-center gap-1.5 min-w-0 truncate">
          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue placeholder="All Branches" />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {!requireSelection && (
          <SelectItem value="all">All Branches</SelectItem>
        )}
        {locations.map((location) => (
          <SelectItem key={location._id} value={location._id}>
            {location.branchName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
