"use server";
import { revalidatePath } from "next/cache";
import { deletePackage, editPackage, addPackage } from "../data/package";
import { packageSchema } from "../schemas/packageSchema";
import { parseStateError } from "../utils/state-errors";
import { buildPackagePayloadFromFormData } from "../utils/package-form-payload";

export async function deletePackageAction(packageId: string) {
  try {
    await deletePackage(packageId);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function editPackageAction(_prevState: any, formData: FormData) {
  const pkg = buildPackagePayloadFromFormData(formData);

  try {
    const validatedPkg = packageSchema.parse(pkg);
    await editPackage(validatedPkg);

    revalidatePath("/dashboard/catalog");

    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function addPackageAction(_prevState: any, formData: FormData) {
  const rawRestrictions = formData.get("classRestrictions") as string | null;
  const coachId = (formData.get("coachId") as string) || undefined;

  const pkg = {
    _id: "newId",
    name: formData.get("name") as string,
    price: formData.get("price") as string,
    numberOfSessions: formData.get("numberOfSessions") as string,
    expiryPeriod: formData.get("expiryPeriod") as string,
    category: formData.get("category") as string,
    coachId: coachId && coachId.trim() !== "" ? coachId.trim() : undefined,
    opensClasses: (formData.getAll("opensClasses") as string[]).filter(
      (id) => id.trim() !== ""
    ),
    classRestrictions: rawRestrictions ? JSON.parse(rawRestrictions) : [],
  };

  try {
    const validatedData = packageSchema.parse(pkg);

    const locationId = (formData.get("locationId") as string) || undefined;

    await addPackage(validatedData as unknown as Parameters<typeof addPackage>[0], locationId);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}
