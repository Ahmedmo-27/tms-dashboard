"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useActionState } from "react";
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
import { formatCategory } from "@/lib/utils/catalog";
import type { Location } from "@/lib/data/locations";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | ApiError | null;
  data: any | null;
  defaultValues?: {
    title: string;
    price: string;
    category: string;
    locations: string[];
  };
}

interface EditClassDialogProps {
  cls: Class;
  categories: string[];
  locations?: Location[];
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

export default function EditClassDialog({
  cls,
  categories,
  locations = [],
}: EditClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(cls.category);
  const [selectedLocation, setSelectedLocation] = useState(
    resolveLocationId(cls.locations?.[0], locations)
  );
  const normalizedLocationIds = (cls.locations || []).map((location) =>
    resolveLocationId(location, locations)
  );
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      title: cls.title,
      price: cls.price,
      category: cls.category,
      locations: normalizedLocationIds,
    },
  };

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        title: formData.get("title") as string,
        price: formData.get("price") as string,
        category: formData.get("category") as string,
        locations: formData.getAll("locations") as string[],
      };
      const result = await editClassAction(currentState, formData);
      if (result.success) {
        setOpen(false);
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
    <div>
      <Button
        onSelect={(e) => e.preventDefault()}
        onClick={() => setOpen(true)}
        variant="outline"
        className="w-full"
      >
        <Edit className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Edit</span>
        <span className="sm:hidden">Edit</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Editing {cls.title} class
            </DialogTitle>
            <DialogDescription>Edit class data</DialogDescription>
          </DialogHeader>
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
                  defaultValue={state.defaultValues?.title}
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
                  defaultValue={state.defaultValues?.price}
                />
                {state.errors && "price" in state.errors && (
                  <div className="text-destructive text-sm">
                    {state.errors.price}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  name="category"
                  value={selectedCategory}
                  disabled={pending}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="" disabled>
                        No categories available
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
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
                <Select
                  name="locations"
                  value={selectedLocation}
                  disabled={pending}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.length === 0 ? (
                      <SelectItem value="" disabled>
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

              {state.errors && state.errors.message && (
                <div className="text-destructive">{state.errors.message}</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <Button
                type="button"
                className="px-4 w-full sm:w-auto"
                variant="outline"
                onClick={() => setOpen(false)}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
