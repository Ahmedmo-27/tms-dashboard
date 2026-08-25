import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import MembersContainer from "@/components/ui/members/members-container";
import { getPackages } from "@/lib/data/package";
import { NetworkError, NotFoundError, UnauthorizedError } from "@/core/api-error";
import NetworkErrorPage from "@/components/ui/error-pages/network-error-fullpage";
import UnauthorizedPage from "@/components/ui/error-pages/UnauthorizedPage";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;

  if (!page) {
    redirect(`/dashboard/packages/${id}?page=1`);
  }

  let targetPackageName = "";

  try {
    const packages = await getPackages();
    const pkg = packages.find((p) => p._id === id);
    if (pkg) {
      targetPackageName = pkg.name;
    }
  } catch (error) {
    if (error instanceof NetworkError) {
      return (
        <NetworkErrorPage
          title="Package Info Unavailable"
          description="Unable to load package details due to network issues."
          showBackButton={true}
        />
      );
    }
    if (error instanceof UnauthorizedError) {
      return <UnauthorizedPage />;
    }
  }

  return (
    <div className="flex min-h-full flex-col p-4 sm:p-6 gap-4 sm:gap-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 px-2">
          <Link href="/dashboard/catalog?tab=packages">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packages
          </Link>
        </Button>
      </div>
      <MembersContainer pkgId={id} packageName={targetPackageName} />
    </div>
  );
}
