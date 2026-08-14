"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Package } from "./columns";
import { DataTable } from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Input } from "../input";
import { Badge } from "../badge";
import { Button } from "../button";
import {
  Search,
  Package as PackageIcon,
  Eye,
  EyeOff,
  Layers,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCategory } from "@/lib/utils/catalog";
import { Class } from "../classes/columns";

interface PackagesContainerProps {
  packages: Package[];
  classes: Class[];
  packageCategories: string[];
  columns: ColumnDef<Package>[];
}

export function PackagesContainer({
  packages,
  classes,
  packageCategories,
  columns,
}: PackagesContainerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "visible" | "hidden"
  >("all");

  const stats = useMemo(
    () => ({
      total: packages.length,
      visible: packages.filter((p) => !p.hidden).length,
      hidden: packages.filter((p) => p.hidden).length,
      categories: new Set(packages.map((p) => p.category)).size,
    }),
    [packages]
  );

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        pkg.name.toLowerCase().includes(searchLower) ||
        formatCategory(pkg.category).toLowerCase().includes(searchLower) ||
        pkg.price.includes(searchTerm);

      const matchesCategory =
        !categoryFilter || pkg.category === categoryFilter;

      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && !pkg.hidden) ||
        (visibilityFilter === "hidden" && !!pkg.hidden);

      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [packages, searchTerm, categoryFilter, visibilityFilter]);

  const hasActiveFilters =
    searchTerm !== "" ||
    categoryFilter !== null ||
    visibilityFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter(null);
    setVisibilityFilter("all");
  };

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 min-w-0">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-4">
        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Total Packages
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.total}
                </p>
              </div>
              <PackageIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Visible
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.visible}
                </p>
              </div>
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600 shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                  Hidden
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold tabular-nums">
                  {stats.hidden}
                </p>
              </div>
              <EyeOff className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-muted-foreground shrink-0" />
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
      </div>

      <Card className="min-w-0 overflow-hidden py-0">
        <CardHeader className="border-b px-3 py-4 sm:px-4 md:px-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg">
                  Package Catalog
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  {filteredPackages.length} of {packages.length} packages
                  {hasActiveFilters && " (filtered)"}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
                <div className="relative w-full sm:min-w-[200px] md:w-[240px] lg:w-[280px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search packages..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-8 text-sm sm:h-10"
                  />
                </div>

                <div className="flex w-full rounded-lg border p-0.5 bg-muted/40 sm:w-auto">
                  {(
                    [
                      { value: "all", label: "All" },
                      { value: "visible", label: "Visible" },
                      { value: "hidden", label: "Hidden" },
                    ] as const
                  ).map(({ value, label }) => (
                    <Button
                      key={value}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 flex-1 px-2 text-[11px] font-medium rounded-md sm:flex-none sm:px-2.5 sm:text-xs",
                        visibilityFilter === value &&
                          "bg-background shadow-sm text-foreground"
                      )}
                      onClick={() => setVisibilityFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {packageCategories.length > 0 && (
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
                {packageCategories.map((cat) => (
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
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground sm:h-6 sm:text-xs"
                    onClick={clearFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-2 py-3 sm:px-4 sm:py-4 md:px-6 md:pt-4">
          {filteredPackages.length === 0 && packages.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No packages found
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
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center px-4">
              <PackageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40" />
              <h3 className="mt-3 sm:mt-4 text-sm sm:text-base font-semibold">
                No packages yet
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Create a package to get started
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredPackages}
              classes={classes}
              packageCategories={packageCategories}
              embedded
              hideSearch
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
