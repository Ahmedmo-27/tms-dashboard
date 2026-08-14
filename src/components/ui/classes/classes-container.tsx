"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Class } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Input } from "../input";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Search,
  Dumbbell,
  Layers,
  MapPin,
  Gift,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/lib/utils/catalog";
import { Package } from "../packages/columns";
import type { Location } from "@/lib/data/locations";

interface ClassesContainerProps {
  classes: Class[];
  packages: Package[];
  classCategories: string[];
  locations: Location[];
  columns: ColumnDef<Class>[];
}

function isFreePrice(price: string): boolean {
  return price === "0" || price === "0.00";
}

export function ClassesContainer({
  classes,
  packages,
  classCategories,
  locations,
  columns,
}: ClassesContainerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  const stats = useMemo(() => {
    const uniqueLocations = new Set<string>();
    classes.forEach((cls) => {
      cls.locations?.forEach((loc) => {
        const id = typeof loc === "string" ? loc : loc._id;
        if (id) uniqueLocations.add(id);
      });
    });

    return {
      total: classes.length,
      categories: new Set(classes.map((c) => c.category)).size,
      locations: uniqueLocations.size,
      free: classes.filter((c) => isFreePrice(c.price)).length,
    };
  }, [classes]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const searchLower = searchTerm.toLowerCase();
      const locationMap = new Map(
        locations.map((l) => [l._id, l.branchName || l.location])
      );

      const locationLabels = (cls.locations ?? [])
        .map((loc) => {
          if (typeof loc === "string") return locationMap.get(loc) ?? loc;
          return loc.branchName || loc.location || loc._id;
        })
        .join(" ");

      const matchesSearch =
        searchTerm === "" ||
        cls.title.toLowerCase().includes(searchLower) ||
        formatCategory(cls.category).toLowerCase().includes(searchLower) ||
        cls.price.includes(searchTerm) ||
        locationLabels.toLowerCase().includes(searchLower);

      const matchesCategory =
        !categoryFilter || cls.category === categoryFilter;

      const matchesLocation =
        !locationFilter ||
        (cls.locations ?? []).some((loc) => {
          const id = typeof loc === "string" ? loc : loc._id;
          return id === locationFilter;
        });

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [classes, searchTerm, categoryFilter, locationFilter, locations]);

  const hasActiveFilters =
    searchTerm !== "" || categoryFilter !== null || locationFilter !== null;

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter(null);
    setLocationFilter(null);
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-4">
        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Total Classes
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.total}
                </p>
              </div>
              <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Categories
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.categories}
                </p>
              </div>
              <Layers className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Locations
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.locations}
                </p>
              </div>
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Free Classes
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.free}
                </p>
              </div>
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-amber-600 shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden py-0">
        <CardHeader className="border-b px-3 py-4 sm:px-4 md:px-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg">
                  Class Catalog
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  {filteredClasses.length} of {classes.length} classes
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>

              <div className="relative w-full sm:min-w-[200px] md:w-[240px] lg:w-[280px] lg:shrink-0">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 text-sm sm:h-10"
                />
              </div>
            </div>

            {classCategories.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="w-full text-[11px] font-medium text-muted-foreground sm:w-auto sm:text-xs">
                  Category:
                </span>
                <Badge
                  variant={categoryFilter === null ? "default" : "outline"}
                  className="cursor-pointer text-[11px] sm:text-xs"
                  onClick={() => setCategoryFilter(null)}
                >
                  All
                </Badge>
                {classCategories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={categoryFilter === cat ? "default" : "outline"}
                    className="cursor-pointer text-[11px] sm:text-xs max-w-[140px] truncate sm:max-w-none"
                    onClick={() =>
                      setCategoryFilter(categoryFilter === cat ? null : cat)
                    }
                  >
                    {formatCategory(cat)}
                  </Badge>
                ))}
              </div>
            )}

            {locations.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="w-full text-[11px] font-medium text-muted-foreground sm:w-auto sm:text-xs">
                  Location:
                </span>
                <Badge
                  variant={locationFilter === null ? "default" : "outline"}
                  className="cursor-pointer text-[11px] sm:text-xs"
                  onClick={() => setLocationFilter(null)}
                >
                  All
                </Badge>
                {locations.map((loc) => (
                  <Badge
                    key={loc._id}
                    variant={locationFilter === loc._id ? "default" : "outline"}
                    className="cursor-pointer text-[11px] sm:text-xs max-w-[140px] truncate sm:max-w-none"
                    onClick={() =>
                      setLocationFilter(
                        locationFilter === loc._id ? null : loc._id
                      )
                    }
                  >
                    {loc.branchName || loc.location}
                  </Badge>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground sm:h-6 sm:text-xs"
                  onClick={clearFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:pt-4">
          {filteredClasses.length === 0 && classes.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No classes found
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 sm:mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <Dumbbell className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No classes yet
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Create a class to get started
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredClasses}
              packages={packages}
              classCategories={classCategories}
              locations={locations}
              embedded
              hideSearch
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
