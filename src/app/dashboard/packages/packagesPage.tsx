"use client";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Package as PackageIcon } from "lucide-react";
import { DataTable } from "@/components/ui/packages/data-table";
import { Package, columns } from "../../../components/ui/packages/columns";
import { AddPackageDialog } from "@/components/ui/dialogs/package/add-package";
import { Class } from "@/components/ui/classes/columns";

export default function PackagesPage({ packages, classes }: { packages: Package[]; classes: Class[] }) {

  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
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
          <AddPackageDialog classes={classes}/>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile: No card wrapper for better spacing */}
        <div className="block md:hidden">
          <DataTable columns={columns} data={packages} classes={classes} />
        </div>

        {/* Desktop: Card wrapper */}
        <Card className="hidden md:block">
          <CardHeader>
            <div className="flex items-center gap-4"></div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={packages} classes={classes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
