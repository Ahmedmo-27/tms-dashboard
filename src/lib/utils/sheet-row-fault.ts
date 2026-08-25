export type SheetRowFaultInput = {
  name?: string;
  purpose?: string;
  memberLabel?: string;
};

const CATALOG_PURPOSE_HINT =
  "did not match a catalog package at this branch. Check Purpose spelling or pick a listed package.";

export function explainSheetRowFault(
  row: SheetRowFaultInput,
  error: string,
  code?: string,
): string {
  const who = row.name?.trim() || "This person";
  const purpose = row.purpose || row.memberLabel || "This purpose";

  switch (code) {
    case "PACKAGE_DOES_NOT_OPEN_CLASS":
      return `${who} has an active package, but it does not include this class. Move them to a class their membership opens, or sell a matching package.`;
    case "NO_ACTIVE_PACKAGE_FOUND":
      return `${who} has no active package. Sell a package on this row or record a paid drop-in.`;
    case "PACKAGE_EXPIRED":
      return `${who}'s package for this class has expired. Renew or sell a new package, then save again.`;
    case "NO_REMAINING_SESSIONS":
      return `${who}'s package for this class has no remaining sessions. Sell a new package or record a paid drop-in.`;
    case "CLASS_RESTRICTION_REACHED":
      return `${who} has reached the monthly limit for this class. Choose a different session or wait until next month.`;
    case "NO_CLASS_PACKAGES_CONFIGURED":
      return "No catalog package opens this class at this branch. Check class/package setup before recording attendance.";
    case "PACKAGE_NOT_MATCHED":
      return `“${purpose}” ${CATALOG_PURPOSE_HINT}`;
    case "NO_ACTIVE_PT_PACKAGE":
      return `${who} does not have an active personal training package.`;
    case "NO_ACTIVE_SPACE_PACKAGE":
      return `${who} does not have an active package with open gym access at this branch.`;
    case "NO_ACCESS_AT_LOCATION":
      return `${who}'s membership does not include open gym at this branch.`;
    case "MEMBER_NOT_FOUND":
      return `${who} was not matched to a member. Search and select them from the name field.`;
    case "CLASS_NOT_FOUND":
      return "This class session could not be found for this day and branch.";
    case "DROPIN_BLOCKED_BY_PACKAGE_BOOKING":
      return `${who} is already on this class with a package. Clear the Method/Payment cells to record membership attendance, or cancel the package booking before taking a drop-in.`;
      return "This class row is not attached to a scheduled class for this day, so attendance cannot be recorded.";
    case "AMBIGUOUS_MEMBER":
      return `${who} matches more than one member. Pick the correct person from search so the row is linked to one member.`;
    case "MEMBER_REQUIRED":
      return `${who} was not matched to a member. Search and select them — this row cannot be saved as a guest.`;
    case "PHONE_REQUIRED":
      return "This row needs a phone number (guest drop-in or package sale).";
    case "PAYMENT_METHOD_REQUIRED":
      return "This row has a payment or drop-in but no payment method. Choose Cash, Visa, App, Instapay, Valu, or Payment Link.";
    case "UNMAPPED_MEMBERSHIP":
      if (error.toLowerCase().includes("will pay") || error.toLowerCase().includes("will renew")) {
        return "This row is marked will pay / will renew, so it was skipped. The original text stays in Notes.";
      }
      if (error.toLowerCase().includes("invitation")) {
        return "Invitations are not gym check-ins, so this Space/PT or class invitation was skipped.";
      }
      if (error.toLowerCase().includes("clinic")) {
        return "Clinic visits are not gym check-ins, so this row was skipped.";
      }
      return "This membership or purpose is not mapped on the sheet, so nothing was written for this row.";
    case "INVALID_ROW":
      if (error.toLowerCase().includes("name is required")) {
        return "Enter the person's name before saving this row.";
      }
      if (error.toLowerCase().includes("product sale")) {
        return "Retail product sales are not check-ins. Do not save them on the daily sheet.";
      }
      if (error.toLowerCase().includes("split amounts")) {
        return "This payment cell has more than one amount. Put the extra amount in Notes and leave a single check-in amount.";
      }
      return "Fill Member or Purpose, or add a payment, so the sheet knows whether this is attendance, a drop-in, PT, Space, or a package sale.";
    case "CLASS_TIME_UNREADABLE":
      return "The class header needs a time the sheet can read (for example “Mat Pilates 9 am”).";
    case "CATALOG_CLASS_NOT_FOUND":
      return "No catalog class matches this header at this branch. Check the class name and time.";
    case "CATALOG_CATEGORY_MISSING":
      return (
        error ||
        "This branch has no class of that type in the catalog. Add it to the branch, then import again."
      );
    case "CATALOG_CLASS_AMBIGUOUS":
      return (
        error ||
        "This header is short for several classes at this branch. Use the full class name."
      );
    default:
      break;
  }

  const lower = error.toLowerCase();

  if (lower.includes("more than one") || lower.includes("ambiguous")) {
    return `${who} matches more than one member. Pick the correct person from search so the row is linked to one member.`;
  }
  if (
    lower.includes("pick the member") ||
    lower.includes("existing member") ||
    lower.includes("member_required")
  ) {
    return `${who} was not matched to a member. Search and select them — this row cannot be saved as a guest.`;
  }
  if (lower.includes("phone number is required") || lower.includes("phone")) {
    return "This row needs a phone number (guest drop-in or package sale).";
  }
  if (lower.includes("payment method")) {
    return "This row has a payment or drop-in but no payment method. Choose Cash, Visa, App, Instapay, Valu, or Payment Link.";
  }
  if (lower.includes("missing its session")) {
    return "This class row is not attached to a scheduled class for this day, so attendance cannot be recorded.";
  }
  if (lower.includes("could not match a catalog package")) {
    return `“${purpose}” ${CATALOG_PURPOSE_HINT}`;
  }
  if (lower.includes("unmapped") || lower.includes("clinic")) {
    return "This membership or purpose is not mapped on the sheet, so nothing was written for this row.";
  }
  if (lower.includes("classif") || lower.includes("membership or payment")) {
    return "Fill Member or Purpose, or add a payment, so the sheet knows whether this is attendance, a drop-in, PT, Space, or a package sale.";
  }
  if (lower.includes("already")) {
    return "This was already recorded in the system, so the sheet skipped writing it again.";
  }
  return "The values on this row could not be saved. Check name, membership, payment, and purpose, then save again.";
}
