"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMembers } from "@/lib/data/member";
import { Member, MemberPackage } from "@/components/ui/members/columns";
import { adminFreezePackageAction } from "@/lib/actions/freeze-actions";
import { Snowflake, Search, Loader2, Check, User, Package as PackageIcon } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";

export function AdminFreezeMemberDialog({
  onSuccess,
  trigger,
}: {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<MemberPackage | null>(null);

  const [durationDays, setDurationDays] = useState<number>(7);
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks">("days");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search members on typing
  const searchMembersList = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await getMembers(query.trim(), 1, 10);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Failed to search members", err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch) {
      searchMembersList(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, searchMembersList]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    const activePkgs = member.packages?.filter((p) => p.status === "ACTIVE") || [];
    setSelectedPkg(activePkgs[0] || null);
    setSearchResults([]);
  };

  const handleResetMember = () => {
    setSelectedMember(null);
    setSelectedPkg(null);
    setSearchQuery("");
  };

  const calculatedDays = durationUnit === "weeks" ? durationDays * 7 : durationDays;
  const previewFreezeEnd = addDays(new Date(), calculatedDays);

  const handleFreeze = async () => {
    if (!selectedMember || !selectedPkg) {
      toast.error("Please select a member and package");
      return;
    }

    if (calculatedDays < 1) {
      toast.error("Please specify a valid duration (at least 1 day)");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.set("uid", selectedMember.id);
      formData.set("pkgId", selectedPkg._id);
      formData.set("pkgStartDate", selectedPkg.pkgStartDate);
      formData.set("durationDays", String(calculatedDays));
      if (reason.trim()) {
        formData.set("reason", reason.trim());
      }

      const res = await adminFreezePackageAction(null, formData);

      if (res.success) {
        toast.success(`Package "${selectedPkg.name}" frozen for ${calculatedDays} days!`);
        setOpen(false);
        handleResetMember();
        onSuccess?.();
      } else {
        const errorMsg =
          (res.errors as { message?: string; clientMessage?: string })?.message ||
          (res.errors as { message?: string; clientMessage?: string })?.clientMessage ||
          "Failed to freeze package";
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const activePackages = selectedMember?.packages?.filter((p) => p.status === "ACTIVE") || [];

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) handleResetMember();
      }}
    >
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="gap-2 bg-sky-600 hover:bg-sky-700 text-white">
            <Snowflake className="h-4 w-4" />
            Freeze a Package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-sky-500" />
            Freeze Member Package
          </DialogTitle>
          <DialogDescription>
            Search for a member, choose an active package, and apply a freeze period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1: Member Selection */}
          {!selectedMember ? (
            <div className="space-y-2">
              <Label>Search Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type name or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Search dropdown list */}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md divide-y">
                  {searchResults.map((m) => {
                    const activeCount = m.packages?.filter((p) => p.status === "ACTIVE").length || 0;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMember(m)}
                        className="p-2.5 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {m.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-none">{m.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{m.phone || m.email}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          {activeCount} active pkg{activeCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No members found matching "{searchQuery}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected Member Header */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
                <div className="flex items-center gap-2.5">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{selectedMember.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMember.phone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleResetMember} className="text-xs h-7">
                  Change Member
                </Button>
              </div>

              {/* Package Selection */}
              {activePackages.length === 0 ? (
                <div className="p-4 text-center rounded-md border border-dashed text-sm text-muted-foreground">
                  This member does not have any active packages to freeze.
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>Select Active Package</Label>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {activePackages.map((pkg) => {
                        const isSelected = selectedPkg?._id === pkg._id && selectedPkg?.pkgStartDate === pkg.pkgStartDate;
                        return (
                          <div
                            key={`${pkg._id}-${pkg.pkgStartDate}`}
                            onClick={() => setSelectedPkg(pkg)}
                            className={`p-2.5 rounded-md border text-sm cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected
                                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <PackageIcon className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{pkg.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  Valid until {format(new Date(pkg.pkgEndDate), "dd MMM yyyy")}
                                </p>
                              </div>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-sky-600" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Freeze Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="freezeDurationAdmin">Freeze Duration</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="freezeDurationAdmin"
                        type="number"
                        min={1}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="flex-1"
                      />
                      <select
                        value={durationUnit}
                        onChange={(e) => {
                          const newUnit = e.target.value as "days" | "weeks";
                          if (newUnit === "weeks" && durationUnit === "days") {
                            setDurationDays(Math.max(1, Math.round(durationDays / 7)));
                          } else if (newUnit === "days" && durationUnit === "weeks") {
                            setDurationDays(durationDays * 7);
                          }
                          setDurationUnit(newUnit);
                        }}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                      </select>
                    </div>

                    {/* Quick Duration Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        { label: "1 Week", days: 7 },
                        { label: "2 Weeks", days: 14 },
                        { label: "3 Weeks", days: 21 },
                        { label: "6 Weeks", days: 42 },
                      ].map((item) => (
                        <Button
                          key={item.days}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => {
                            setDurationUnit("days");
                            setDurationDays(item.days);
                          }}
                        >
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Date Preview */}
                  <div className="rounded-md bg-muted/60 p-2.5 text-xs space-y-1 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Freeze Starts:</span>
                      <span className="font-medium text-foreground">Today ({format(new Date(), "dd MMM yyyy")})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Freeze Ends:</span>
                      <span className="font-medium text-foreground">{format(previewFreezeEnd, "dd MMM yyyy")}</span>
                    </div>
                    {selectedPkg && (
                      <div className="flex justify-between text-sky-600 dark:text-sky-400 font-medium pt-1 border-t border-muted">
                        <span>New Package Expiry:</span>
                        <span>
                          {format(addDays(new Date(selectedPkg.pkgEndDate), calculatedDays), "dd MMM yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <Label htmlFor="adminReason">Reason / Admin Note (Optional)</Label>
                    <Textarea
                      id="adminReason"
                      placeholder="e.g. Member requested at frontdesk, injury, vacation..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              handleResetMember();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-sky-600 hover:bg-sky-700 text-white"
            onClick={handleFreeze}
            disabled={submitting || !selectedMember || !selectedPkg || activePackages.length === 0}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Freeze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
