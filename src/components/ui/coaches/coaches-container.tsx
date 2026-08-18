"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Coach } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Input } from "../input";
import { Button } from "../button";
import { Search, UserCheck, Phone, X } from "lucide-react";
import { digitsOnlyPhone, isValidContactPhone } from "@/lib/utils/phone";

interface CoachesContainerProps {
  coaches: Coach[];
  columns: ColumnDef<Coach>[];
}

export function CoachesContainer({ coaches, columns }: CoachesContainerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const stats = useMemo(
    () => ({
      total: coaches.length,
      contactable: coaches.filter((c) => isValidContactPhone(c.phoneNumber))
        .length,
    }),
    [coaches]
  );

  const filteredCoaches = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");

    return coaches.filter((coach) => {
      if (searchTerm === "") return true;

      const matchesName = coach.coachName.toLowerCase().includes(searchLower);
      const matchesPhone =
        coach.phoneNumber.toLowerCase().includes(searchLower) ||
        (digits.length > 0 &&
          digitsOnlyPhone(coach.phoneNumber).includes(digits));

      return matchesName || matchesPhone;
    });
  }, [coaches, searchTerm]);

  const hasActiveFilters = searchTerm !== "";

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:max-w-2xl md:grid-cols-2">
        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Total Coaches
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.total}
                </p>
              </div>
              <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  With Phone
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.contactable}
                </p>
              </div>
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden py-0">
        <CardHeader className="border-b px-3 py-4 sm:px-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base lg:text-lg">
                Coach Directory
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                {filteredCoaches.length} of {coaches.length} coaches
                {hasActiveFilters && " (filtered)"}
              </p>
            </div>

            <div className="relative w-full sm:min-w-[200px] md:w-[240px] lg:w-[280px] lg:shrink-0">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8 text-sm sm:h-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:pt-4">
          {filteredCoaches.length === 0 && coaches.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No coaches found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Try adjusting your search
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 sm:mt-4"
                onClick={() => setSearchTerm("")}
              >
                Clear search
              </Button>
            </div>
          ) : coaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No coaches yet
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Add a coach to get started
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCoaches}
              embedded
              hideSearch
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
