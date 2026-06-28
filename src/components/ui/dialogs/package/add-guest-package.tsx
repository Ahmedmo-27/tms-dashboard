"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "@/components/ui/packages/columns";
import { PopoverDatePicker } from "@/components/ui/popover-date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../../checkbox";
import { subscribeGuestPackageAction } from "@/lib/actions/member-actions";
import {
  formatCatalogPackageLabel,
  getPackageEndDateFromStart,
  isOpenGymPackage,
  sortPackagesWithOpenGymFirst,
} from "@/lib/utils/open-gym";
import { ApiError } from "@/core/api-error";

const paymentMethods = [
  { value: "VISA", header: "Visa" },
  { value: "VALU", header: "Valu" },
  { value: "INSTAPAY", header: "Instapay" },
  { value: "CASH", header: "Cash" },
];

export default function addGuestPackage({
  packages,
  openGymOnly = false,
}: {
  packages: Package[];
  openGymOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pkg, setPkg] = useState<Package | null>(null);

  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("CASH");

  const [pendingDeduction, setPendingDeduction] = useState(false);
  const [showEdits, setShowEdits] = useState(false);
  const [priceChanged, setPriceChanged] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset state when modal opens
  const resetForm = () => {
    setPkg(null);
    setName("");
    setPhoneNumber("");
    setSelectedStartDate("");
    setSelectedEndDate("");
    setSelectedPaymentDate("");
    setSelectedAmount("");
    setSelectedPaymentMethod("CASH");
    setShowEdits(false);
    setPriceChanged(false);
  };

  const toggleOpen = (value: boolean) => {
    setOpen(value);
    if (!value) resetForm();
  };

  const handleStartDate = (date: string) => {
    if (!pkg) return;

    setSelectedStartDate(date);
    setSelectedEndDate(getPackageEndDateFromStart(date, pkg));
  };

  useEffect(() => {
    if (!pkg) return;
    setSelectedAmount(pkg.price.toString());
  }, [pkg]);

  useEffect(() => {
    setPriceChanged(selectedAmount !== String(pkg?.price ?? ""));
  }, [selectedAmount, pkg]);

  const initialState = { success: false, errors: null, data: null };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      try {
        const result = await subscribeGuestPackageAction(
          currentState,
          formData
        );

        if (result.success) {
          toggleOpen(false);
          return initialState;
        }
        setError(result.errors as Error);
        return {
          ...result,
        };
      } catch (error) {
        setError(error as Error);
      }
    },
    initialState
  );

  const catalogPackages = openGymOnly
    ? packages.filter((p) => isOpenGymPackage(p.category))
    : sortPackagesWithOpenGymFirst(packages);

  return (
    <div>
      <Button
        className="min-h-[40px]"
        variant="outline"
        size="sm"
        onClick={() => toggleOpen(true)}
      >
        {openGymOnly ? "Guest open gym package" : "Add Package"}
      </Button>

      <Dialog open={open} onOpenChange={toggleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {openGymOnly ? "Guest open gym package" : "Subscribe to a package"}
            </DialogTitle>
            <DialogDescription>
              {openGymOnly
                ? "Register a non-member with weekly or monthly open gym access."
                : "Select the package details below."}
            </DialogDescription>
          </DialogHeader>

          <form action={formAction}>
            {/* Hidden fields */}
            <input type="hidden" name="name" value={name} />
            <input type="hidden" name="phoneNumber" value={phoneNumber} />
            <input type="hidden" name="pkgId" value={pkg?._id ?? ""} />
            <input type="hidden" name="startDate" value={selectedStartDate} />
            <input type="hidden" name="endDate" value={selectedEndDate} />
            <input type="hidden" name="pendingDeduction" value={pendingDeduction.toString()} />

            <input
              type="hidden"
              name="paymentDate"
              value={selectedPaymentDate}
            />
            <input type="hidden" name="amount" value={selectedAmount} />
            <input
              type="hidden"
              name="paymentMethod"
              value={selectedPaymentMethod}
            />
            <input
              type="hidden"
              name="priceChanged"
              value={String(priceChanged)}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Column 1 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  type="text"
                  className="w-full mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {error &&
                  typeof error === "object" &&
                  !(error instanceof ApiError) &&
                  "name" in error && (
                    <p className="text-destructive text-xs">
                      {(error as any).name}
                    </p>
                  )}
              </div>

              {/* Column 2 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input
                  type="number"
                  className="w-full mt-1"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                {error &&
                  typeof error === "object" &&
                  !(error instanceof ApiError) &&
                  "phoneNumber" in error && (
                    <p className="text-destructive text-xs">
                      {(error as any).phoneNumber}
                    </p>
                  )}
              </div>
            </div>

            {/* Package */}
            <div className="space-y-2 mt-2">
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
                  {catalogPackages.map((pkg) => (
                    <SelectItem
                      key={pkg._id}
                      value={pkg._id}
                      className="hover:bg-accent"
                    >
                      {formatCatalogPackageLabel(pkg)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
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
                <Label className="text-sm font-medium">End Date</Label>
                <PopoverDatePicker
                  className="w-full"
                  selectedDate={
                    selectedEndDate ? new Date(selectedEndDate) : undefined
                  }
                  disabled
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium">Payment Method</Label>
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

            <div className="flex gap-2 items-center mt-4">
              <Checkbox
                name="pendingDeduction"
                checked={pendingDeduction}
                onCheckedChange={() => setPendingDeduction((prev) => !prev)}
              />
              <p
                onClick={() => setPendingDeduction((prev) => !prev)}
                className="cursor-pointer"
              >
                Attended a class using this package
              </p>
            </div>

            {/* Edit payment details */}
            <div className="flex gap-2 items-center mt-4">
              <Checkbox
                name="showEdits"
                checked={showEdits}
                onCheckedChange={() => setShowEdits((prev) => !prev)}
              />
              <p
                onClick={() => setShowEdits((prev) => !prev)}
                className="cursor-pointer"
              >
                Edit payment date or amount
              </p>
            </div>

            {showEdits && (
              <div className="mt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Paid Amount</Label>
                  <Input
                    type="number"
                    className="w-full mt-1"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    disabled={!pkg}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Payment Date</Label>
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
            {state?.errors && typeof state.errors == "object" && (
              <div className="text-destructive text-sm  ">
                {state.errors.message && state.errors.message}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => toggleOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
