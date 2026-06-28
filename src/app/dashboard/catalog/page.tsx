export const dynamic = "force-dynamic";
import React from "react";
import CatalogPage from "./catalogPage";
import { getClasses } from "@/lib/data/class";
import { getPackages } from "@/lib/data/package";
import { getCoaches } from "@/lib/data/coaches";
import { getLocations } from "@/lib/data/locations";
import { Class } from "@/components/ui/classes/columns";
import { Package } from "@/components/ui/packages/columns";
import { Coach } from "@/components/ui/coaches/columns";
import type { Location } from "@/lib/data/locations";
import { NetworkError, NotFoundError, UnauthorizedError } from "@/core/api-error";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";
import { deriveUniqueCategories } from "@/lib/utils/catalog";

export default async function Page({
  searchParams,
}: {
  searchParams: { locationId?: string };
}) {
  const params = await searchParams;
  const locationId = params.locationId;

  let classes: Class[] = [];
  let packages: Package[] = [];
  let coaches: Coach[] = [];
  let locations: Location[] = [];

  try {
    [classes, packages, coaches, locations] = await Promise.all([
      getClasses(locationId).catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getPackages().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getCoaches().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
      getLocations().catch((e) => {
        if (e instanceof NotFoundError) return [];
        throw e;
      }),
    ]);
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Catalog Data Unavailable"
          description="Unable to load catalog information due to network issues."
          showBackButton={false}
        />
      );
    }
    if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
  }

  const classCategories = deriveUniqueCategories(classes);
  const packageCategories = deriveUniqueCategories(packages);

  return (
    <CatalogPage
      classes={classes}
      packages={packages}
      coaches={coaches}
      locations={locations}
      classCategories={classCategories}
      packageCategories={packageCategories}
    />
  );
}
