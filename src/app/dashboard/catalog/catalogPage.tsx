"use client";
import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Package as PackageIcon, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable as ClassesDataTable } from "@/components/ui/classes/data-table";
import { DataTable as PackagesDataTable } from "@/components/ui/packages/data-table";
import { DataTable as CoachesDataTable } from "@/components/ui/coaches/data-table";
import { createColumns as createClassColumns } from "@/components/ui/classes/columns";
import { createColumns as createPackageColumns } from "@/components/ui/packages/columns";
import { createColumns as createCoachColumns } from "@/components/ui/coaches/columns";
import { Class } from "@/components/ui/classes/columns";
import { Package } from "@/components/ui/packages/columns";
import { Coach } from "@/components/ui/coaches/columns";
import { AddClass } from "@/components/ui/dialogs/class/add-class";
import { AddPackageDialog } from "@/components/ui/dialogs/package/add-package";
import { AddCoachDialog } from "@/components/ui/dialogs/coach/add-coach";
import type { Location } from "@/lib/data/locations";
import { useBranchContext } from "@/lib/hooks/use-branch-context";

interface CatalogPageProps {
  classes: Class[];
  packages: Package[];
  coaches: Coach[];
  locations: Location[];
  classCategories: string[];
  packageCategories: string[];
}

function CatalogPageInner({
  classes,
  packages,
  coaches,
  locations,
  classCategories,
  packageCategories,
}: CatalogPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") ?? "classes";
  const { isViewingAllBranches } = useBranchContext();

  const classColumns = createClassColumns(packages, classCategories, locations);
  const packageColumns = createPackageColumns(
    classes,
    packageCategories,
    isViewingAllBranches
  );
  const coachColumns = createCoachColumns();

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/catalog?tab=${value}`);
  };

  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-2">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="coaches">Coaches</TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Classes</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage available classes
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <AddClass categories={classCategories} locations={locations} />
              </div>
            </div>

            <div className="block md:hidden">
              <ClassesDataTable
                columns={classColumns}
                data={classes}
                packages={packages}
                classCategories={classCategories}
                locations={locations}
              />
            </div>
            <Card className="hidden md:block">
              <CardContent className="pt-6">
                <ClassesDataTable
                  columns={classColumns}
                  data={classes}
                  packages={packages}
                  classCategories={classCategories}
                  locations={locations}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <PackageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Packages</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage available packages
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <AddPackageDialog
                  classes={classes}
                  categories={packageCategories}
                />
              </div>
            </div>

            <div className="block md:hidden">
              <PackagesDataTable
                columns={packageColumns}
                data={packages}
                classes={classes}
                packageCategories={packageCategories}
              />
            </div>
            <Card className="hidden md:block">
              <CardContent className="pt-6">
                <PackagesDataTable
                  columns={packageColumns}
                  data={packages}
                  classes={classes}
                  packageCategories={packageCategories}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Coaches Tab */}
        <TabsContent value="coaches">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Coaches</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage available coaches
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto">
                <AddCoachDialog />
              </div>
            </div>

            <div className="block md:hidden">
              <CoachesDataTable columns={coachColumns} data={coaches} />
            </div>
            <Card className="hidden md:block">
              <CardContent className="pt-6">
                <CoachesDataTable columns={coachColumns} data={coaches} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CatalogPage(props: CatalogPageProps) {
  return (
    <Suspense>
      <CatalogPageInner {...props} />
    </Suspense>
  );
}
