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
import { addClassAction } from "@/lib/actions/class-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { ApiError } from "@/core/api-error";
import { formatCategory } from "@/lib/utils/catalog";
import type { Location } from "@/lib/data/locations";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null | ApiError;
  data: any | null;
  defaultValues?: {
    title: string;
    category: string;
    price: string;
    locations: string[];
  };
}

interface AddClassProps {
  categories?: string[];
  locations?: Location[];
}

export function AddClass({ categories = [], locations = [] }: AddClassProps) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      title: "",
      price: "",
      category: "",
      locations: [],
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
      const result = await addClassAction(currentState, formData);

      if (result.success) {
        setIsOpen(false);
        setSelectedCategory("");
        setSelectedLocation("");
        return initialState;
      }

      return {
        ...result,
        defaultValues,
      };
    },
    initialState
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Add Class</span>
        <span className="sm:hidden">Add</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Adding a new class
            </DialogTitle>
            <DialogDescription>Add class data</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="mt-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Class Name
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={state?.defaultValues?.title}
                />
                {state?.errors && "title" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Price</Label>
                <Input
                  name="price"
                  type="number"
                  min={0}
                  className="w-full"
                  defaultValue={state?.defaultValues?.price}
                />
                {state?.errors && "price" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.price}
                  </p>
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
                {state?.errors && "locations" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.locations}
                  </p>
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
                    <SelectValue placeholder="Select a category" />
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
                          className="hover:bg-accent"
                        >
                          {formatCategory(category)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {state?.errors && "category" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.category}
                  </p>
                )}
              </div>
            </div>
            {state.errors && state.errors.message && (
              <div className="text-destructive">{state.errors.message}</div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
              <Button
                type="button"
                className="px-4 w-full sm:w-auto"
                variant="outline"
                onClick={() => setIsOpen(false)}
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
