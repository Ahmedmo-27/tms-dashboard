"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Copy,
  Mail,
  Phone,
  Package,
  CreditCard,
  Pencil,
  ChevronDown,
  PackagePlus,
  CalendarPlus,
  Plus,
  Calendar,
  Dumbbell,
  UserCheck,
  SlidersHorizontal,
  History,
  AlertTriangle,
} from "lucide-react";
import { Member } from "@/components/ui/members/columns";
import { Package as CatalogPackage } from "@/components/ui/packages/columns";
import { ScheduledClass } from "@/components/ui/schedule/columns";
import Packages from "@/components/ui/cards/packages";
import Bookings from "@/components/ui/cards/bookings";
import PTAttendance from "@/components/ui/cards/ptAttendance";
import Deductions from "@/components/ui/cards/deductions";
import SubPackage from "@/components/ui/dialogs/member package/sub-package";
import AddClasses from "@/components/ui/dialogs/member package/add-classes";
import RecordPastSessionsDialog from "@/components/ui/dialogs/member package/record-past-sessions-dialog";
import BookClass from "@/components/ui/dialogs/member-bookings/book-class";
import { OpenGymDropInDialog } from "@/components/ui/dialogs/open-gym/open-gym-drop-in-dialog";
import { PtDropInDialog } from "@/components/ui/dialogs/pt/pt-drop-in-dialog";
import { PtSettleDialog } from "@/components/ui/dialogs/pt/pt-settle-dialog";
import { EditMemberDialog } from "@/components/ui/dialogs/members/edit-member-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [subPackageOpen, setSubPackageOpen] = useState(false);
  const [addClassesOpen, setAddClassesOpen] = useState(false);
  const [recordPastOpen, setRecordPastOpen] = useState(false);
  const [bookClassOpen, setBookClassOpen] = useState(false);
  const [openGymDropInOpen, setOpenGymDropInOpen] = useState(false);
  const [ptDropInOpen, setPtDropInOpen] = useState(false);

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
              <span className="inline-flex items-center gap-1.5 font-mono">
                <CreditCard className="h-3.5 w-3.5" />
                {member.nationalId ? `ID: ${member.nationalId}` : "No National ID"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                {member.activePkgs} active
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EditMemberDialog
              member={member}
              trigger={
                <Button variant="outline" size="sm" className="h-9 gap-1.5 cursor-pointer">
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Edit Member</span>
                </Button>
              }
            />

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 cursor-pointer">
                  <PackagePlus className="h-4 w-4" />
                  <span>Packages</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={() => setSubPackageOpen(true)}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Add Package</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setAddClassesOpen(true)}
                  disabled={!activePackage}
                  className="cursor-pointer"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <span>Adjust Classes</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setRecordPastOpen(true)}
                  disabled={!activePackage}
                  className="cursor-pointer"
                >
                  <History className="mr-2 h-4 w-4" />
                  <span>Record Past Sessions</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5 cursor-pointer">
                  <CalendarPlus className="h-4 w-4" />
                  <span>Bookings</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onSelect={() => setBookClassOpen(true)}
                  className="cursor-pointer"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Book a class</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1">
                  Drop-in Sessions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() => setOpenGymDropInOpen(true)}
                  className="cursor-pointer"
                >
                  <Dumbbell className="mr-2 h-4 w-4" />
                  <span>Open gym drop-in</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setPtDropInOpen(true)}
                  className="cursor-pointer"
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  <span>PT drop-in</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialogs */}
            <SubPackage
              uid={member.id}
              packages={packages}
              hideTrigger
              open={subPackageOpen}
              onOpenChange={setSubPackageOpen}
            />

            {activePackage && (
              <AddClasses
                uid={member.id}
                pkg={activePackage}
                variant="none"
                open={addClassesOpen}
                onOpenChange={setAddClassesOpen}
              />
            )}

            {activePackage && (
              <RecordPastSessionsDialog
                uid={member.id}
                packages={member.packages || []}
                defaultPkg={activePackage}
                open={recordPastOpen}
                onOpenChange={setRecordPastOpen}
              />
            )}

            <BookClass
              uid={member.id}
              scheduledClasses={scheduledClasses}
              member={member}
              catalogPackages={packages}
              hideTrigger
              open={bookClassOpen}
              onOpenChange={setBookClassOpen}
            />

            <OpenGymDropInDialog
              uid={member.id}
              memberName={member.name}
              hideTrigger
              open={openGymDropInOpen}
              onOpenChange={setOpenGymDropInOpen}
            />

            <PtDropInDialog
              uid={member.id}
              memberName={member.name}
              hideTrigger
              open={ptDropInOpen}
              onOpenChange={setPtDropInOpen}
            />
          </div>
        </div>
      </div>

      {/* Owed PT Sessions Banner */}
      {member.owedPtSessions && member.owedPtSessions.length > 0 && (
        <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">
                This member has {member.owedPtSessions.length} unpaid PT session
                {member.owedPtSessions.length > 1 ? "s" : ""} (Will Pay)
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Attended with Coach{" "}
                {Array.from(new Set(member.owedPtSessions.map((s) => s.coachName || "PT"))).join(", ")}.
                Can be settled now or will be deducted if a package with the same trainer is purchased.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {member.owedPtSessions.map((session) => (
              <PtSettleDialog
                key={session._id}
                sessionId={session._id}
                clientName={member.name}
                phoneNumber={member.phone}
                coachName={session.coachName}
                coachId={session.coachId}
                initialAmount={session.amount}
                attendanceDate={session.attendanceDate}
                uid={member.id}
                memberPackages={member.packages}
                trigger={
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    Settle with Coach {session.coachName || "PT"}
                  </Button>
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="deductions">Deductions</TabsTrigger>
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
          <TabsContent value="deductions" className="mt-4">
            <Deductions
              memberPackages={member.packages || []}
              deductions={member.deductions}
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
