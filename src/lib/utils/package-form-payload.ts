/**
 * Builds the package create/update payload from FormData.
 * Always includes opensClasses (even []) so PT packages without classes
 * still validate and can persist coachId changes.
 */
export function buildPackagePayloadFromFormData(formData: FormData): Record<string, unknown> {
  const rawData: Record<string, FormDataEntryValue | null> = {
    _id: formData.get("_id"),
    name: formData.get("name"),
    price: formData.get("price"),
    numberOfSessions: formData.get("numberOfSessions"),
    expiryPeriod: formData.get("expiryPeriod"),
    category: formData.get("category"),
  };

  const opensClasses = (formData.getAll("opensClasses") as string[]).filter(
    (id) => id.trim() !== ""
  );
  const rawRestrictions = formData.get("classRestrictions") as string | null;
  const coachIdRaw = formData.get("coachId");
  const coachId =
    typeof coachIdRaw === "string" && coachIdRaw.trim() !== ""
      ? coachIdRaw.trim()
      : undefined;
  const notesRaw = formData.get("notes");

  const pkg: Record<string, unknown> = {};

  Object.entries(rawData).forEach(([key, value]) => {
    if (key === "_id") {
      if (value !== null && value !== "") pkg[key] = value;
    } else {
      pkg[key] = typeof value === "string" ? value : (value ?? "");
    }
  });

  if (typeof notesRaw === "string") {
    pkg.notes = notesRaw.trim();
  }

  pkg.opensClasses = opensClasses;
  if (coachId) {
    pkg.coachId = coachId;
  } else if (formData.has("coachId") && formData.get("coachId") === "") {
    pkg.coachId = null;
  }
  pkg.classRestrictions = rawRestrictions ? JSON.parse(rawRestrictions) : [];

  return pkg;
}
