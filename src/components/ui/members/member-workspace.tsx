"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Copy, Mail, Phone, Package } from "lucide-react";
import { Member } from "@/components/ui/members/columns";
import { Package as CatalogPackage } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import Packages from "@/components/ui/cards/packages";
import Bookings from "@/components/ui/cards/bookings";
import PTAttendance from "@/components/ui/cards/ptAttendance";
import SubPackage from "@/components/ui/dialogs/member package/sub-package";
import AddClasses from "@/components/ui/dialogs/member package/add-classes";
import BookClass from "@/components/ui/dialogs/member-bookings/book-class";
import BookDropIn from "@/components/ui/dialogs/member-bookings/book-drop-in";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MemberWorkspace({
  member,
  packages,
  scheduledClasses,
}: {
  member: Member;
  packages: CatalogPackage[];
  scheduledClasses: ScheduledClass[];
}) {
  const [tab, setTab] = useState("packages");
  const activePackage =
    member.packages?.find((pkg) => pkg.status?.toUpperCase() === "ACTIVE") ??
    member.packages?.[0];

  const copyPhone = () => {
    navigator.clipboard.writeText(member.phone);
    toast.success("Phone copied");
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-xl font-semibold sm:text-2xl">
              {member.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={copyPhone}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="font-mono">{member.phone}</span>
                <Copy className="h-3 w-3" />
              </button>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {member.email || "No email"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                {member.activePkgs} active
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SubPackage uid={member.id} packages={packages} />
            <BookClass
              uid={member.id}
              scheduledClasses={scheduledClasses}
              member={member}
              catalogPackages={packages}
            />
            <BookDropIn uid={member.id} memberName={member.name} />
            {activePackage && (
              <AddClasses uid={member.id} pkg={activePackage} variant="button" />
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="attendance">PT attendance</TabsTrigger>
          </TabsList>
          <TabsContent value="packages" className="mt-4">
            <Packages
              memberPackages={member.packages || []}
              uid={member.id}
              packages={packages}
              hideHeader
            />
          </TabsContent>
          <TabsContent value="bookings" className="mt-4">
            <Bookings
              bookings={member.bookings || []}
              scheduledClasses={scheduledClasses}
              uid={member.id}
              memberName={member.name}
              member={member}
              catalogPackages={packages}
              hideHeader
            />
          </TabsContent>
          <TabsContent value="attendance" className="mt-4">
            <PTAttendance attendance={member.ptAttendance || []} hideHeader />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
