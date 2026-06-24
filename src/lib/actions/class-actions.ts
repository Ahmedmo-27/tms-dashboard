"use server";
import { revalidatePath } from "next/cache";
import { classSchema } from "../schemas/classSchema";
import { Class } from "@/components/ui/classes/columns";
import { addClass, editClass, deleteClass } from "../data/class";
import { parseStateError } from "../utils/state-errors";
export async function addClassAction(_prevState: any, formData: FormData) {
  try {
    const cls: Class = await classSchema.parse({
      _id: "newId",
      title: formData.get("title") as string,
      price: formData.get("price") as string,
      category: formData.get("category") as string,
      locations: (formData.getAll("locations") as string[]).filter((l) => l.trim() !== ""),
    });
    await addClass(cls);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export const editClassAction = async (_prevState: any, formData: FormData) => {
  const cls: Class = {
    _id: formData.get("_id") as string,
    title: formData.get("title") as string,
    price: formData.get("price") as string,
    category: formData.get("category") as string,
    locations: (formData.getAll("locations") as string[]).filter((l) => l.trim() !== ""),
  };

  try {
    const validatedData = classSchema.parse(cls);
    await editClass(validatedData);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
};

export async function deleteClassAction(classId: string) {
  try {
    await deleteClass(classId);
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error) {
    return parseStateError(error as Error);
  }
}
