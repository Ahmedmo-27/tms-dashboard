"use server"
import { revalidatePath } from "next/cache";
import { cancelClass, editClass, scheduleClass } from "../data/schedule";
import { scheduledClassSchema } from "../schemas/scheduledClassSchema";
import { parseStateError } from "../utils/state-errors";
import { ScheduledClass } from "@/components/ui/schedule/columns";

export const scheduleClassAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const scls = {
      clsId: formData.get("clsId"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      availableSlots: Number(formData.get("availableSlots")),
      coachId: formData.get("coachId"),
    };
    const validatedData = scheduledClassSchema.parse(scls);
    const validatedScls = {
      cid: validatedData.clsId,
      bookedMembers: [],
      ...validatedData,
    };

    const response = await scheduleClass(validatedScls);

    // Revalidate the member's page and the members list
    revalidatePath(`/dashboard/schedule`);

    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    console.log(error)
    return parseStateError(error as Error);
  }
};


export const editSlotsAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const scid = formData.get("scid")?.toString() || ""
    const slots = formData.get("availableSlots")
    
    const response = await editClass(scid, {availableSlots: Number(slots)});

    // Revalidate the member's page and the members list
    revalidatePath(`/dashboard/schedule`);
    
    return {
      success: true,
      errors: null,
      data: response,
    };
  } catch (error) {
    console.log(error)
    return parseStateError(error as Error);
  }
};

export const editClassAction = async (
  _prevState: any,
  formData: FormData
) => {
  try {
    const scid = formData.get("scid")?.toString() || ""
    const scls = {
      startTime: formData.get("startTime")?.toString(),
      endTime: formData.get("endTime")?.toString(),
      coachId: formData.get("coachId")?.toString(),
    };

    const response = await editClass(scid, scls);

    // Revalidate the member's page and the members list
    revalidatePath(`/dashboard/schedule`);

    return {
      success: true,
      errors: null,
      data: scls,
    };
  } catch (error) {
    console.log(error)
    return parseStateError(error as Error);
  }
};

export const cancelClassAction = async (
  classId: string,
) => {
    try {      
      await cancelClass(classId);
      revalidatePath("/dashboard/schedule");
      return { success: true };
    } catch (error) {
      return parseStateError(error as Error);
    }
}