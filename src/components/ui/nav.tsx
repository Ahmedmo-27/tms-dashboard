"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { usePathname, useSearchParams } from "next/navigation";
import { getPageTitle, STAFF_HOME } from "@/lib/config/pages";

export const Nav = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const title = getPageTitle(query ? `${pathname}?${query}` : pathname);

  return (
    <Breadcrumb data-walkthrough="header-breadcrumbs" className="min-w-0">
      <BreadcrumbList className="flex-nowrap items-center min-w-0 gap-1 sm:gap-1.5">
        <BreadcrumbItem className="hidden md:flex shrink-0">
          <BreadcrumbLink href="/dashboard" className="text-xs font-medium">
            The Mind Space
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:flex shrink-0" />
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage
            className="truncate font-semibold text-xs sm:text-sm max-w-[100px] sm:max-w-[160px] md:max-w-[240px] lg:max-w-none block"
            title={title}
          >
            {title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
