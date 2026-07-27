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
        className={className ?? "w-[220px]"}
        loading={isPending}
        aria-busy={isPending}
      >
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        {!requireSelection && (
          <SelectItem value="all">All</SelectItem>
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
