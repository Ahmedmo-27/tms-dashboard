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
import { addPackageAction } from "@/lib/actions/package-actions";
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
import { MultiSelect } from "../../multiselect";
import { Class } from "../../classes/columns";
import { formatCategory } from "@/lib/utils/catalog";
import { ClassRestrictionsEditor } from "../../packages/class-restrictions-editor";

interface ActionState {
  success: boolean;
  errors: Record<string, string> | null;
  data: any | null;
  defaultValues?: {
    _id: string;
    name: string;
    numberOfSessions: string;
    expiryPeriod: string;
    price: string;
    category: string;
    opensClasses: string[];
  };
}

export function AddPackageDialog({
  classes,
  categories,
}: {
  classes: Class[];
  categories: string[];
}) {
  const initialState: ActionState = {
    success: false,
    errors: null,
    data: null,
    defaultValues: {
      _id: "newId",
      name: "",
      numberOfSessions: "",
      expiryPeriod: "",
      price: "",
      category: "",
      opensClasses: [],
    },
  };

  const classMap = new Map(classes.map((cls) => [cls.title, cls._id]));
  const classesOptions = classes.map((cls) => cls.title);

  const [selectedClassTitles, setSelectedClassTitles] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const [state, formAction, pending] = useActionState(
    async (currentState: any, formData: FormData) => {
      const defaultValues = {
        _id: "newId",
        name: formData.get("name") as string,
        numberOfSessions: formData.get("numberOfSessions") as string,
        expiryPeriod: formData.get("expiryPeriod") as string,
        price: formData.get("price") as string,
        category: formData.get("category") as string,
        opensClasses: selectedClassIds,
      };
      const result = await addPackageAction(currentState, formData);

      if (result.success) {
        setIsOpen(false);
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
  const [classRestrictions, setClassRestrictions] = useState<
    { cid: string; limit: number }[]
  >([]);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)} className="w-full sm:w-auto">
        <Plus className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Add Package</span>
        <span className="sm:hidden">Add</span>
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Adding a new package
            </DialogTitle>
            <DialogDescription>Edit package data</DialogDescription>
          </DialogHeader>
          <form action={formAction} className="mt-4">
            {selectedClassIds.map((classId) => (
              <input
                key={classId}
                type="hidden"
                name="opensClasses"
                value={classId}
              />
            ))}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Package Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={state?.defaultValues?.name}
                />
                {state?.errors && "name" in state.errors && (
                  <p className="text-destructive text-sm">
                    {state.errors.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sessions</Label>
                  <Input
                    name="numberOfSessions"
                    type="number"
                    min={1}
                    max={100}
                    className="w-full"
                    defaultValue={state?.defaultValues?.numberOfSessions}
                  />
                  {state?.errors && "numberOfSessions" in state.errors && (
                    <p className="text-destructive text-sm">
                      {state.errors.numberOfSessions}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Expiry (days)</Label>
                  <Input
                    name="expiryPeriod"
                    type="number"
                    min={1}
                    max={365}
                    className="w-full"
                    defaultValue={state?.defaultValues?.expiryPeriod}
                  />
                  {state?.errors && "expiryPeriod" in state.errors && (
                    <p className="text-destructive text-sm">
                      {state.errors.expiryPeriod}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Price</Label>
                <Input
                  name="price"
                  type="number"
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
                <Label className="text-sm font-medium">Opens Classes</Label>
                <MultiSelect
                  placeholder="Select classes"
                  selected={selectedClassTitles}
                  options={classesOptions}
                  onChange={(selected) => {
                    setSelectedClassTitles(selected);
                    setSelectedClassIds(
                      selected.map((title) => classMap.get(title) || "")
                    );
                  }}
                />
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
                onChange={setClassRestrictions}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  name="category"
                  defaultValue={
                    state?.defaultValues?.category || selectedCategory
                  }
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
