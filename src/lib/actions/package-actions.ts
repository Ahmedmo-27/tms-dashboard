"use server";
import { revalidatePath } from "next/cache";
import { deletePackage, editPackage, addPackage } from "../data/package";
import { packageSchema } from "../schemas/packageSchema";
import { parseStateError } from "../utils/state-errors";
import { Package } from "@/components/ui/packages/columns";

export async function deletePackageAction(packageId: string) {
  try {
    await deletePackage(packageId);
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error) {
    return parseStateError(error as Error);
  }
}

export async function editPackageAction(_prevState: any, formData: FormData) {
  const rawData = {
    _id: formData.get("_id"),
    name: formData.get("name"),
    price: formData.get("price"),
    numberOfSessions: formData.get("numberOfSessions"),
    expiryPeriod: formData.get("expiryPeriod"),
    category: formData.get("category"),
  };

  const opensClasses = formData.getAll("opensClasses") as string[];
  const rawRestrictions = formData.get("classRestrictions") as string | null;

  const pkg: Record<string, any> = {};

  // filter empty strings / null
  Object.entries(rawData).forEach(([key, value]) => {
    if (key === "_id" || (value !== null && value !== "")) {
      pkg[key] = value;
    }
  });

  // backend-preferred fix
  if (opensClasses.length > 0) {
    pkg.opensClasses = opensClasses;
  }

  pkg.classRestrictions = rawRestrictions ? JSON.parse(rawRestrictions) : [];

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
  const pkg = {
    _id: "newId",
    name: formData.get("name") as string,
    price: formData.get("price") as string,
    numberOfSessions: formData.get("numberOfSessions") as string,
    expiryPeriod: formData.get("expiryPeriod") as string,
    category: formData.get("category") as string,
    opensClasses: formData.getAll("opensClasses") as string[],
    classRestrictions: rawRestrictions ? JSON.parse(rawRestrictions) : [],
  };

  try {
    const validatedData = packageSchema.parse(pkg);

    await addPackage(validatedData);
    revalidatePath("/dashboard/catalog");
    return { success: true, errors: null, data: null };
  } catch (error) {
    return parseStateError(error as Error);
  }
}
