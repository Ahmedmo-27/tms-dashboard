"use client";
import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, Package as PackageIcon, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassesContainer } from "@/components/ui/classes/classes-container";
import { PackagesContainer } from "@/components/ui/packages/packages-container";
import { CoachesContainer } from "@/components/ui/coaches/coaches-container";
import { createColumns as createClassColumns } from "@/components/ui/classes/columns";
import { createColumns as createPackageColumns } from "@/components/ui/packages/columns";
import { createColumns as createCoachColumns } from "@/components/ui/coaches/columns";
import { Class } from "@/components/ui/classes/columns";
import { Package } from "@/components/ui/packages/columns";
import { Coach } from "@/components/ui/coaches/columns";
import { AddClass } from "@/components/ui/dialogs/class/add-class";
import { AddPackageDialog } from "@/components/ui/dialogs/package/add-package";
import { OpenGymPricingDialog } from "@/components/ui/dialogs/open-gym/open-gym-pricing-dialog";
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

  const classColumns = createClassColumns(
    packages,
    classCategories,
    locations,
    isViewingAllBranches
  );
  const packageColumns = createPackageColumns(
    classes,
    packageCategories,
    isViewingAllBranches,
    coaches
  );
  const coachColumns = createCoachColumns();

  const handleTabChange = (value: string) => {
    router.push(`/dashboard/catalog?tab=${value}`);
  };

  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="min-w-0">
        <TabsList className="mb-2 w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap" data-walkthrough="catalog-tabs">
          <TabsTrigger value="classes" className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3">
            Classes
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3">
            Packages
          </TabsTrigger>
          <TabsTrigger value="coaches" className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3">
            Coaches
          </TabsTrigger>
        </TabsList>

        {/* Classes Tab */}
        <TabsContent value="classes" className="min-w-0">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Classes
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    Manage class offerings, pricing, and locations
                  </p>
                </div>
              </div>
              <div className="w-full md:w-auto md:shrink-0" data-walkthrough="catalog-add-btn">
                <AddClass categories={classCategories} locations={locations} />
              </div>
            </div>

            <Separator />

            <ClassesContainer
              classes={classes}
              packages={packages}
              classCategories={classCategories}
              locations={locations}
              columns={classColumns}
            />
          </div>
        </TabsContent>

        {/* Packages Tab */}
        <TabsContent value="packages" className="min-w-0">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <PackageIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Packages
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    Manage membership packages, pricing, and visibility
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full md:w-auto md:flex md:flex-row [&>div]:min-w-0 [&_button]:w-full md:[&_button]:w-auto">
                <OpenGymPricingDialog packages={packages} classes={classes} />
                <AddPackageDialog
                  classes={classes}
                  categories={packageCategories}
                  coaches={coaches}
                />
              </div>
            </div>

            <Separator />

            <PackagesContainer
              packages={packages}
              classes={classes}
              packageCategories={packageCategories}
              columns={packageColumns}
              coaches={coaches}
            />
          </div>
        </TabsContent>
        {/* Coaches Tab */}
        <TabsContent value="coaches" className="min-w-0">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 min-w-0">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Coaches
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
                    Manage coach profiles and contact details
                  </p>
                </div>
              </div>
              <div className="w-full md:w-auto md:shrink-0">
                <AddCoachDialog />
              </div>
            </div>

            <Separator />

            <CoachesContainer coaches={coaches} columns={coachColumns} />
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
