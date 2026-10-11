"use client";
import React, {
  Suspense,
  useMemo,
  useState,
  useTransition,
  useEffect,
  useRef,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import {
  Dumbbell,
  Package as PackageIcon,
  UserCheck,
  Loader2,
} from "lucide-react";
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
import { PtPricingDialog } from "@/components/ui/dialogs/pt/pt-pricing-dialog";
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

function CatalogTabLoader({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex min-h-[380px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/70 bg-card/40 p-8 text-center animate-in fade-in-50 duration-200">
      <div className="relative flex items-center justify-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
          <Icon className="h-7 w-7 animate-pulse text-primary" />
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border shadow-xs">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground capitalize">
          Loading {label}...
        </p>
        <p className="text-xs text-muted-foreground">
          Fetching catalog data, pricing, and branch availability
        </p>
      </div>
    </div>
  );
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
  const [isPending, startTransition] = useTransition();
  const urlTab = searchParams.get("tab") ?? "classes";
  const [activeTab, setActiveTab] = useState(urlTab);
  const [isChangingTab, setIsChangingTab] = useState(false);
  const minTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [minTimeElapsed, setMinTimeElapsed] = useState(true);
  const { isViewingAllBranches } = useBranchContext();

  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  useEffect(() => {
    if (!isPending && minTimeElapsed) {
      setIsChangingTab(false);
    }
  }, [isPending, minTimeElapsed]);

  useEffect(() => {
    return () => {
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, []);

  const isLoading = isChangingTab || isPending || !minTimeElapsed;

  const classColumns = useMemo(
    () =>
      createClassColumns(
        packages,
        classCategories,
        locations,
        isViewingAllBranches
      ),
    [packages, classCategories, locations, isViewingAllBranches]
  );
  const packageColumns = useMemo(
    () =>
      createPackageColumns(
        classes,
        packageCategories,
        isViewingAllBranches,
        coaches
      ),
    [classes, packageCategories, isViewingAllBranches, coaches]
  );
  const coachColumns = useMemo(() => createCoachColumns(), []);

  const handleTabChange = (value: string) => {
    if (value === activeTab && !isLoading) return;
    setActiveTab(value);
    setIsChangingTab(true);
    setMinTimeElapsed(false);

    if (minTimerRef.current) clearTimeout(minTimerRef.current);
    minTimerRef.current = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 300);

    startTransition(() => {
      router.push(`/dashboard/catalog?tab=${value}`, { scroll: false });
    });
  };

  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-3 sm:p-6 lg:p-8 min-w-0 max-w-full overflow-x-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="min-w-0"
      >
        <TabsList
          className="mb-2 w-full sm:w-auto h-auto flex-wrap sm:flex-nowrap"
          data-walkthrough="catalog-tabs"
        >
          <TabsTrigger
            value="classes"
            className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5"
          >
            <span>Classes</span>
            {isLoading && activeTab === "classes" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="packages"
            className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5"
          >
            <span>Packages</span>
            {isLoading && activeTab === "packages" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            )}
          </TabsTrigger>
          <TabsTrigger
            value="coaches"
            className="flex-1 sm:flex-none text-xs sm:text-sm px-2.5 sm:px-3 gap-1.5"
          >
            <span>Coaches</span>
            {isLoading && activeTab === "coaches" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            )}
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
              <div
                className="w-full md:w-auto md:shrink-0"
                data-walkthrough="catalog-add-btn"
              >
                <AddClass categories={classCategories} locations={locations} />
              </div>
            </div>

            <Separator />

            {isLoading && activeTab === "classes" ? (
              <CatalogTabLoader icon={Dumbbell} label="classes" />
            ) : (
              <ClassesContainer
                classes={classes}
                packages={packages}
                classCategories={classCategories}
                locations={locations}
                columns={classColumns}
              />
            )}
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
                <PtPricingDialog triggerLabel="PT pricing" />
                <AddPackageDialog
                  classes={classes}
                  categories={packageCategories}
                  coaches={coaches}
                />
              </div>
            </div>

            <Separator />

            {isLoading && activeTab === "packages" ? (
              <CatalogTabLoader icon={PackageIcon} label="packages" />
            ) : (
              <PackagesContainer
                packages={packages}
                classes={classes}
                packageCategories={packageCategories}
                columns={packageColumns}
                coaches={coaches}
              />
            )}
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

            {isLoading && activeTab === "coaches" ? (
              <CatalogTabLoader icon={UserCheck} label="coaches" />
            ) : (
              <CoachesContainer coaches={coaches} columns={coachColumns} />
            )}
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
