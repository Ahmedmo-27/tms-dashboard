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
import { subscribeGuestPackageAction } from "@/lib/actions/member-actions";
import { tms } from "@/lib/tms-api";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

type PendingMemberHit = {
  id: string;
  name: string;
  phone: string;
};

export function AddNonMemberPackage({ packages }: { packages: Package[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pkg, setPkg] = useState<Package | null>(null);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PendingMemberHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");
  const [pendingDeduction, setPendingDeduction] = useState(false);
  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  const resetForm = () => {
    setPkg(null);
    setName("");
    setPhoneNumber("");
    setSelectedMemberId("");
    setSearchQuery("");
    setSearchResults([]);
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedPaymentDate("");
    setSelectedAmount("");
    setSelectedPaymentMethod("CASH");
    setPendingDeduction(false);
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
        const response = await tms.get("/admin/pending-members", { params });
        const users = response.data.data.users ?? [];
        setSearchResults(
          users.map((u: { _id: string; name: string; phoneNumber: string }) => ({
            id: u._id,
            name: u.name,
            phone: u.phoneNumber,
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
    const end = new Date(date);
    end.setDate(end.getDate() + Number(pkg.expiryPeriod));
    setSelectedStartDate(date);
    setSelectedEndDate(end.toISOString());
  };

  const initialState = { success: false, errors: null, data: null };
  const [state, formAction, pending] = useActionState(
    async (currentState: unknown, formData: FormData) => {
      const result = await subscribeGuestPackageAction(currentState, formData);
      if (result.success) {
        toast.success("Package added to non member");
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
      <Button
        className="min-h-[40px]"
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        Add package to non member
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add package to non member</DialogTitle>
            <DialogDescription>
              Search for a pending signup and assign a package. It will transfer
              to their member account when approved.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="phoneNumber" value={phoneNumber} />
            <input type="hidden" name="pkgId" value={pkg?._id ?? ""} />
            <input type="hidden" name="startDate" value={selectedStartDate} />
            <input type="hidden" name="endDate" value={selectedEndDate} />
            <input
              type="hidden"
              name="pendingDeduction"
              value={pendingDeduction.toString()}
            />
            <input type="hidden" name="paymentDate" value={selectedPaymentDate} />
            <input type="hidden" name="amount" value={selectedAmount} />
            <input type="hidden" name="paymentMethod" value={selectedPaymentMethod} />
            <input type="hidden" name="priceChanged" value={String(priceChanged)} />

            <div className="space-y-2" ref={searchRef}>
              <Label className="text-sm font-medium">Search non member</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Name or phone number"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedMemberId && e.target.value !== name) {
                      setSelectedMemberId("");
                      setName("");
                      setPhoneNumber("");
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
                        setSelectedMemberId(member.id);
                        setName(member.name);
                        setPhoneNumber(member.phone);
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
              {showSuggestions && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
                <p className="text-xs text-muted-foreground">
                  No pending signups found.
                </p>
              )}
            </div>

            {selectedMemberId && (
              <div className="grid grid-cols-2 gap-4 rounded-md border p-3 bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-sm font-medium">{name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="text-sm font-medium">{phoneNumber}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Package</Label>
              <Select
                onValueChange={(value) =>
                  setPkg(packages.find((p) => p._id === value) || null)
                }
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {`${p.name}: ${p.numberOfSessions} sessions • EGP${p.price}`}
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
                checked={pendingDeduction}
                onCheckedChange={() => setPendingDeduction((prev) => !prev)}
              />
              <p
                onClick={() => setPendingDeduction((prev) => !prev)}
                className="cursor-pointer text-sm"
              >
                Attended a class using this package
              </p>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  pending || !selectedMemberId || !pkg || !selectedStartDate
                }
              >
                {pending ? "Saving…" : "Add package"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
