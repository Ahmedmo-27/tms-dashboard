"use client";
import React from "react";
import MembersContainer from "@/components/ui/members/members-container";
import { Separator } from "@/components/ui/separator";
import { Users } from "lucide-react";
import { RegisterMember } from "@/components/ui/dialogs/members/register-member";

export default function Page() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:gap-8 lg:p-8">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Our Members</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View and manage your gym members
            </p>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <RegisterMember />
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="flex-1">
        <MembersContainer />
      </div>
    </div>
  );
}
