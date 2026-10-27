"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useActionState } from "react";
import { editClassAction } from "@/lib/actions/class-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Class, ClassLocation } from "../../classes/columns";
import { Edit } from "lucide-react";
import { ApiError } from "@/core/api-error";
import { formatCategory, CLASS_CATEGORIES } from "@/lib/utils/catalog";
import { getDefaultClassDurationMinutes } from "@/lib/utils/class-duration";
import type { Location } from "@/lib/data/locations";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | ApiError | null;
  data: any | null;
  defaultValues?: {
    title: string;
    price: string;
    defaultDuration?: string;
    category: string;
    locations: string[];
  };
}

interface EditClassDialogProps {
  cls: Class;
  categories: string[];
  locations?: Location[];
  compact?: boolean;
  buttonClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const resolveLocationId = (
  value: ClassLocation | undefined,
  options: Location[]
): string => {
  if (!value) return "";
  if (typeof value !== "string") return value._id;
  const match = options.find(
    (location) =>
      location._id === value ||
      location.branchName === value ||
      location.location === value
  );
  return match?._id ?? value;
};

function EditClassForm({
  cls,
  categories,
  locations = [],
  onClose,
}: {
  cls: Class;
  categories: string[];
  locations: Location[];
  onClose: () => void;
}) {
  const availableCategories =
    categories && categories.length > 0
      ? categories
      : (CLASS_CATEGORIES as unknown as string[]);

  const [selectedCategory, setSelectedCategory] = useState(cls.category);
  const [selectedLocation, setSelectedLocation] = useState(
    resolveLocationId(cls.locations?.[0], locations)
  );

  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: undefined,
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        title: formData.get("title") as string,
        price: formData.get("price") as string,
        defaultDuration: formData.get("defaultDuration") as string,
        category: formData.get("category") as string,
        locations: formData.getAll("locations") as string[],
      };
      const result = await editClassAction(currentState, formData);
      if (result.success) {
        onClose();
        return initialState;
      }

      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="_id" value={cls._id} />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Class Name
          </Label>
          <Input
            id="title"
            name="title"
            type="text"
            defaultValue={state?.defaultValues?.title ?? cls.title}
          />
          {state.errors && "title" in state.errors && (
            <div className="text-destructive text-sm">
              {state.errors.title}
            </div>
          )}
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
            defaultValue={state?.defaultValues?.price ?? String(cls.price ?? "")}
          />
          {state.errors && "price" in state.errors && (
            <div className="text-destructive text-sm">
              {state.errors.price}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="defaultDuration" className="text-sm font-medium">
            Default Duration (Minutes)
          </Label>
          <Input
            id="defaultDuration"
            name="defaultDuration"
            type="number"
            min={1}
            step={1}
            placeholder="60"
            defaultValue={
              state?.defaultValues?.defaultDuration ??
              (cls.defaultDuration ? String(cls.defaultDuration) : String(getDefaultClassDurationMinutes(cls)))
            }
          />
          {state.errors && "defaultDuration" in state.errors && (
            <div className="text-destructive text-sm">
              {(state.errors as any).defaultDuration}
            </div>
          )}
        </div>
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
          {state.errors && "category" in state.errors && (
            <div className="text-destructive text-sm">
              {state.errors.category}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Location</Label>
          <input type="hidden" name="locations" value={selectedLocation} />
          <Select
            value={selectedLocation || undefined}
            disabled={pending}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a location" />
            </SelectTrigger>
            <SelectContent>
              {locations.length === 0 ? (
                <SelectItem value="_empty" disabled>
                  No locations available
                </SelectItem>
              ) : (
                locations.map((location) => (
                  <SelectItem
                    key={location._id}
                    value={location._id}
                    className="hover:bg-accent"
                  >
                    {location.branchName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {state.errors && "locations" in state.errors && (
            <div className="text-destructive text-sm">
              {state.errors.locations}
            </div>
          )}
        </div>

        {state.errors && "message" in state.errors && (
          <div className="text-destructive">{state.errors.message}</div>
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
          disabled={pending}
          variant="default"
        >
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default function EditClassDialog({
  cls,
  categories = CLASS_CATEGORIES as unknown as string[],
  locations = [],
  compact = false,
  buttonClassName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditClassDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (!isControlled) setInternalOpen(val);
    controlledOnOpenChange?.(val);
  };

  const triggerButton = (
    <Button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      variant="outline"
      size={compact ? "icon" : "default"}
      className={cn(
        compact ? "h-9 w-9 cursor-pointer shrink-0" : "w-full cursor-pointer",
        buttonClassName
      )}
    >
      <Edit className={compact ? "size-4.5" : "mr-2 h-4 w-4"} />
      {!compact && <span>Edit</span>}
      {compact && <span className="sr-only">Edit Class</span>}
    </Button>
  );

  return (
    <div>
      {!isControlled && (
        compact ? (
          <Tooltip>
            <TooltipTrigger asChild>{triggerButton}</TooltipTrigger>
            <TooltipContent>Edit Class</TooltipContent>
          </Tooltip>
        ) : (
          triggerButton
        )
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Editing {cls.title} class
            </DialogTitle>
            <DialogDescription>Edit class data</DialogDescription>
          </DialogHeader>
          {open && (
            <EditClassForm
              key={cls._id}
              cls={cls}
              categories={categories}
              locations={locations}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
