"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Package } from "@/components/ui/packages/columns";
import { subscribePackageAction } from "@/lib/actions/member-actions";
import {
  formatCatalogPackageLabel,
  getPackageEndDateFromStart,
  isOpenGymPackage,
} from "@/lib/utils/open-gym";
import { tms } from "@/lib/tms-api";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { OpenGymBranchSelect } from "@/components/ui/open-gym/branch-select";

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

type MemberSearchHit = {
  id: string;
  name: string;
  phone: string;
};

export function OpenGymSubscribeDialog({
  packages,
  triggerLabel = "Add open gym package",
}: {
  packages: Package[];
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [effectiveLocationId, setEffectiveLocationId] = useState("");
  const isViewingAllBranches = !effectiveLocationId;
  const openGymPackages = packages
    .filter((p) => isOpenGymPackage(p.category))
    .filter((p) => {
      if (!effectiveLocationId || !p.locationId) return true;
      const pkgLocationId =
        typeof p.locationId === "string"
          ? p.locationId
          : (p.locationId as { _id?: string })._id;
      return !pkgLocationId || pkgLocationId === effectiveLocationId;
    });

  const [open, setOpen] = useState(false);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [selectedUid, setSelectedUid] = useState("");
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MemberSearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");
  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  const resetForm = () => {
    setPkg(null);
    setSelectedUid("");
    setSelectedMemberName("");
    setSearchQuery("");
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedPaymentDate("");
    setSelectedAmount("");
    setSelectedPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) resetForm();
  };

  useEffect(() => {
    if (!pkg) return;
    setSelectedAmount(pkg.price.toString());
  }, [pkg]);

  useEffect(() => {
    setPriceChanged(selectedAmount !== String(pkg?.price ?? ""));
  }, [selectedAmount, pkg]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const params: Record<string, string | number> = { page: 1, limit: 10 };
        if (/^\d+$/.test(searchQuery)) {
          params.phone = searchQuery;
        } else {
          params.name = searchQuery;
        }
        const response = await tms.get("/admin/member", { params });
        const members = response.data.data.members ?? [];
        setSearchResults(
          members.map((m: any) => ({
            id: m.uid._id,
            name: m.uid.name,
            phone: m.uid.phoneNumber,
          }))
        );
        setShowSuggestions(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleStartDate = (date: string) => {
    if (!pkg) return;
    setSelectedStartDate(date);
    setSelectedEndDate(getPackageEndDateFromStart(date, pkg));
  };

  const initialState = { success: false, errors: null, data: null };
  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const result = await subscribePackageAction(currentState, formData);
      if (result.success) {
        toast.success("Open gym package added");
        handleOpenChange(false);
        router.refresh();
        return initialState;
      }
      return result;
    },
    initialState
  );

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add open gym package to member</DialogTitle>
            <DialogDescription>
              Search for a member and subscribe them to any open gym package
              you have configured for this branch.
            </DialogDescription>
          </DialogHeader>

          <OpenGymBranchSelect
            value={effectiveLocationId}
            onChange={setEffectiveLocationId}
          />

          {isViewingAllBranches && (
            <p className="text-sm text-destructive">
              Select a branch above before adding an open gym package.
            </p>
          )}

          {openGymPackages.length === 0 ? (
            <p className="text-sm text-destructive">
              No OPEN_GYM packages in catalog. Create one under Catalog →
              Packages first.
            </p>
          ) : (
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="uid" value={selectedUid} />
              <input type="hidden" name="locationId" value={effectiveLocationId ?? ""} />
              <input type="hidden" name="pkgId" value={pkg?._id ?? ""} />
              <input type="hidden" name="startDate" value={selectedStartDate} />
              <input type="hidden" name="endDate" value={selectedEndDate} />
              <input type="hidden" name="paymentDate" value={selectedPaymentDate} />
              <input type="hidden" name="amount" value={selectedAmount} />
              <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
              <input type="hidden" name="priceChanged" value={String(priceChanged)} />

              <div className="space-y-2" ref={searchRef}>
                <Label className="text-sm font-medium">Search member</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Name or phone number"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (selectedUid && e.target.value !== selectedMemberName) {
                        setSelectedUid("");
                        setSelectedMemberName("");
                      }
                    }}
                    className="pl-8"
                  />
                </div>
                {isSearching && (
                  <p className="text-xs text-muted-foreground">Searching…</p>
                )}
                {showSuggestions && searchResults.length > 0 && (
                  <div className="rounded-md border max-h-40 overflow-y-auto">
                    {searchResults.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex flex-col"
                        onClick={() => {
                          setSelectedUid(member.id);
                          setSelectedMemberName(member.name);
                          setSearchQuery(member.name);
                          setShowSuggestions(false);
                        }}
                      >
                        <span className="font-medium">{member.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {member.phone}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedUid && (
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Selected: {selectedMemberName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Open gym package</Label>
                <Select
                  onValueChange={(value) =>
                    setPkg(openGymPackages.find((p) => p._id === value) || null)
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {openGymPackages.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {formatCatalogPackageLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start date</Label>
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      selectedStartDate ? new Date(selectedStartDate) : undefined
                    }
                    handleDateChange={handleStartDate}
                    disabled={!pkg}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">End date</Label>
                  <PopoverDatePicker
                    className="w-full"
                    selectedDate={
                      selectedEndDate ? new Date(selectedEndDate) : undefined
                    }
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment method</Label>
                <Select
                  disabled={!selectedStartDate || pending}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 items-center">
                <Checkbox
                  checked={showEdits}
                  onCheckedChange={() => setShowEdits((prev) => !prev)}
                />
                <p
                  onClick={() => setShowEdits((prev) => !prev)}
                  className="cursor-pointer text-sm"
                >
                  Edit payment date or amount
                </p>
              </div>

              {showEdits && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Paid amount</Label>
                    <Input
                      type="number"
                      className="w-full mt-1"
                      value={selectedAmount}
                      onChange={(e) => setSelectedAmount(e.target.value)}
                      disabled={!pkg}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment date</Label>
                    <PopoverDatePicker
                      selectedDate={
                        selectedPaymentDate
                          ? new Date(selectedPaymentDate)
                          : undefined
                      }
                      handleDateChange={setSelectedPaymentDate}
                      className="w-full mt-1"
                      disabled={!pkg}
                    />
                  </div>
                </div>
              )}

              {state?.errors &&
                typeof state.errors === "object" &&
                "message" in state.errors && (
                  <p className="text-destructive text-sm">
                    {(state.errors as { message?: string }).message}
                  </p>
                )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    pending ||
                    !selectedUid ||
                    !pkg ||
                    !selectedStartDate ||
                    !effectiveLocationId
                  }
                >
                  {pending ? "Saving…" : "Add package"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
