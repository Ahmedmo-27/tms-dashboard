"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { editPackageAction } from "@/lib/actions/package-actions";
import type { Package } from "../../packages/columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "../../multiselect";
import { Edit } from "lucide-react";
import { Class } from "../../classes/columns";
import { Coach } from "../../coaches/columns";
import { CoachSearchSelect } from "@/components/ui/coach-search-select";
import { getCoaches } from "@/lib/data/coaches";
import {
  formatCategory,
  getEffectivePackageNote,
  PACKAGE_CATEGORIES,
} from "@/lib/utils/catalog";
import { ClassRestrictionsEditor } from "../../packages/class-restrictions-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null;
  data: any | null;
  defaultValues?: Record<string, string>;
}

function EditPackageForm({
  pkg,
  classes,
  categories,
  coaches,
  onClose,
}: {
  pkg: Package;
  classes: Class[];
  categories: string[];
  coaches: Coach[];
  onClose: () => void;
}) {
  const router = useRouter();
  const availableCategories =
    categories && categories.length > 0
      ? categories
      : (PACKAGE_CATEGORIES as unknown as string[]);

  const classMap = new Map(classes.map((cls) => [cls.title, cls._id]));
  const classesOptions = classes.map((cls) => cls.title);

  const validOpensClasses = (pkg.opensClasses ?? []).filter((c) => c != null);
  const [selectedClassTitles, setSelectedClassTitles] = useState<string[]>(
    validOpensClasses.map((c) => c.title)
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
    validOpensClasses.map((c) => c._id)
  );

  const initialCoachId =
    typeof pkg.coachId === "object" && pkg.coachId !== null
      ? pkg.coachId._id ?? ""
      : typeof pkg.coachId === "string"
      ? pkg.coachId
      : "";

  const [selectedCoachId, setSelectedCoachId] = useState<string>(initialCoachId);
  const [selectedCategory, setSelectedCategory] = useState(pkg.category);
  const [classRestrictions, setClassRestrictions] = useState<
    { cid: string; limit: number }[]
  >(pkg.classRestrictions ?? []);

  const effectiveNote = getEffectivePackageNote(pkg);

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: undefined,
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        _id: formData.get("_id") as string,
        name: formData.get("name") as string,
        numberOfSessions: formData.get("numberOfSessions") as string,
        expiryPeriod: formData.get("expiryPeriod") as string,
        price: formData.get("price") as string,
        notes: (formData.get("notes") as string) ?? "",
        category: formData.get("category") as string,
        coachId: formData.get("coachId") as string,
      };
      const result = await editPackageAction(currentState, formData);
      if (result.success) {
        onClose();
        router.refresh();
        return initialState;
      } else {
        return {
          ...result,
          defaultValues,
        };
      }
    },
    initialState
  );

  const fieldError = (key: string) =>
    state.errors && key in state.errors
      ? (state.errors as Record<string, string>)[key]
      : null;

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="_id" value={pkg._id} />
      {selectedClassIds.map((classId) => (
        <input
          key={classId}
          type="hidden"
          name="opensClasses"
          value={classId}
        />
      ))}
      {state?.errors && "message" in state.errors && state.errors.message && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.errors.message}
        </div>
      )}
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Package Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={state?.defaultValues?.name ?? pkg.name}
          />
          {fieldError("name") && (
            <div className="text-destructive text-sm">{fieldError("name")}</div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Sessions</Label>
            <Input
              name="numberOfSessions"
              type="number"
              min={1}
              defaultValue={state?.defaultValues?.numberOfSessions ?? pkg.numberOfSessions}
              className="w-full"
            />
            {fieldError("numberOfSessions") && (
              <div className="text-destructive text-sm">
                {fieldError("numberOfSessions")}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Expiry (days)</Label>
            <Input
              name="expiryPeriod"
              type="number"
              min={1}
              max={365}
              defaultValue={state?.defaultValues?.expiryPeriod ?? pkg.expiryPeriod}
              className="w-full"
            />
            {fieldError("expiryPeriod") && (
              <div className="text-destructive text-sm">
                {fieldError("expiryPeriod")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm font-medium">
            Price
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="any"
            defaultValue={state?.defaultValues?.price ?? String(pkg.price ?? "")}
          />
          {fieldError("price") && (
            <div className="text-destructive text-sm">{fieldError("price")}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes (optional)
          </Label>
          <Input
            id="notes"
            name="notes"
            type="text"
            placeholder="e.g. Can’t book Reformer Pilates classes"
            defaultValue={state?.defaultValues?.notes ?? effectiveNote}
          />
          {fieldError("notes") && (
            <div className="text-destructive text-sm">{fieldError("notes")}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Opens Classes</Label>
          <MultiSelect
            placeholder="Select classes"
            selected={selectedClassTitles}
            options={classesOptions}
            onChange={(selected) => {
              setSelectedClassTitles(selected);
              setSelectedClassIds(
                selected
                  .map((title) => classMap.get(title) || "")
                  .filter(Boolean)
              );
            }}
          />
          {fieldError("opensClasses") && (
            <div className="text-destructive text-sm">
              {fieldError("opensClasses")}
            </div>
          )}
        </div>

        <input
          type="hidden"
          name="classRestrictions"
          value={JSON.stringify(classRestrictions)}
        />
        <ClassRestrictionsEditor
          opensClasses={selectedClassIds.map((id, i) => ({
            _id: id,
            title: selectedClassTitles[i] ?? id,
          }))}
          initialRestrictions={pkg.classRestrictions ?? []}
          onChange={setClassRestrictions}
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Category</Label>
          <input type="hidden" name="category" value={selectedCategory} />
          <Select
            value={selectedCategory || undefined}
            disabled={pending}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No categories available
                </SelectItem>
              ) : (
                availableCategories.map((category) => (
                  <SelectItem
                    key={category}
                    value={category}
                    className="cursor-pointer hover:bg-accent"
                  >
                    {formatCategory(category)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {fieldError("category") && (
            <div className="text-destructive text-sm">
              {fieldError("category")}
            </div>
          )}
        </div>

        {selectedCategory === "PERSONAL_TRAINING" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Assign Coach</Label>
            <input type="hidden" name="coachId" value={selectedCoachId} />
            <CoachSearchSelect
              coaches={coaches}
              value={selectedCoachId}
              onChange={setSelectedCoachId}
              disabled={pending}
            />
            {fieldError("coachId") && (
              <div className="text-destructive text-sm">
                {fieldError("coachId")}
              </div>
            )}
          </div>
        )}

        {fieldError("message") && (
          <div className="text-destructive text-sm">
            {fieldError("message")}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
        <Button
          type="button"
          className="px-4 w-full sm:w-auto"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="px-4 w-full sm:w-auto"
          disabled={
            pending ||
            (selectedCategory === "PERSONAL_TRAINING" && !selectedCoachId)
          }
          variant="default"
        >
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function EditPackageDialog({
  pkg,
  classes,
  categories = PACKAGE_CATEGORIES as unknown as string[],
  coaches = [],
  compact = false,
}: {
  pkg: Package;
  classes: Class[];
  categories?: string[];
  coaches?: Coach[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>(coaches);

  useEffect(() => {
    if (coaches && coaches.length > 0) {
      setAvailableCoaches(coaches);
    } else {
      getCoaches()
        .then((data) => {
          if (Array.isArray(data)) setAvailableCoaches(data);
        })
        .catch(() => {});
    }
  }, [coaches]);

  const triggerButton = (
    <Button
      type="button"
      onSelect={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      variant="outline"
      size={compact ? "icon" : "default"}
      className={compact ? "h-8 w-8 cursor-pointer shrink-0" : "cursor-pointer w-full"}
    >
      <Edit className={compact ? "h-4 w-4" : "mr-2 h-4 w-4"} />
      {!compact && <span>Edit</span>}
      {compact && <span className="sr-only">Edit Package</span>}
    </Button>
  );

  return (
    <div>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
          <TooltipContent>Edit Package</TooltipContent>
        </Tooltip>
      ) : (
        triggerButton
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Editing {pkg.name} package
            </DialogTitle>
            <DialogDescription>Edit package data</DialogDescription>
          </DialogHeader>
          {open && (
            <EditPackageForm
              key={pkg._id}
              pkg={pkg}
              classes={classes}
              categories={categories}
              coaches={availableCoaches}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
