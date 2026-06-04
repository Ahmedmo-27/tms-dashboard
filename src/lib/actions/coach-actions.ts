"use server";
import { revalidatePath } from "next/cache";
import { addCoach, editCoach } from "../data/coaches";
import { coachSchema } from "../schemas/coachSchema";
import { parseStateError } from "../utils/state-errors";

export async function addCoachAction(_prevState: any, formData: FormData) {
  const raw = {
    coachName: formData.get("coachName") as string,
    phoneNumber: formData.get("phoneNumber") as string,
  };

  try {
    const validated = coachSchema.parse(raw);
    await addCoach(validated);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function editCoachAction(_prevState: any, formData: FormData) {
  const id = formData.get("_id") as string;
  const raw = {
    coachName: formData.get("coachName") as string,
    phoneNumber: formData.get("phoneNumber") as string,
  };

  try {
    const validated = coachSchema.parse(raw);
    await editCoach(id, validated);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}
