"use client";

import PendingMembersContainer from "@/components/ui/member-requests/pending-members-container";
import NewPackagesContainer from "@/components/ui/non-user-packages/new-packages-container";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-full flex-col gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
      <div className="hidden md:flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">
              Member Requests And New Packages
            </h1>
            <p className="text-sm text-muted-foreground">
              Review pending member requests and packages for non app users
            </p>
          </div>
        </div>
      </div>

      <Separator className="hidden sm:block" />

      {/* Main Content */}
      <div className="flex-1 space-y-10">
        <PendingMembersContainer />
        <NewPackagesContainer />
      </div>
    </div>
  );
}
