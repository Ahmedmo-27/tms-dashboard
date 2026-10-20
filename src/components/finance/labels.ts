export const SEGMENT_LABELS: Record<string, string> = {
  FUNCTIONAL_TRAINING: "Functional Training",
  STUDIO: "Studio",
  PERSONAL_TRAINING: "Personal Training",
  ONLINE_PERSONAL_TRAINING: "Online Personal Training",
  PRE_POST_NATAL: "Pre/Post Natal",
  MIXED: "Mixed",
  SPACE_MEMBERSHIP: "Space Membership",
  ULTIMATE_MINDSPACER: "Ultimate Mindspacer",
  OPEN_GYM: "Open Gym",
  UNCATEGORIZED_PACKAGE: "Other packages",
  WORKSPACE: "Workspace",
  UNCATEGORIZED: "Uncategorized",
  DROPIN: "Member drop-ins",
  NON_MEMBER_DROPIN: "Non-member drop-ins",
  WALKIN: "Walk-ins",
  OTHER: "Other",
  REFUND: "Refund",
  CASHOUT: "Cash out",
};

export const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  VISA: "Visa",
  INSTAPAY: "InstaPay",
  APP: "In-app",
  PAYMENT_LINK: "Payment link",
  VALU: "ValU",
  DEDUCTED: "Deducted from package",
};

export const FLAG_LABELS: Record<string, string> = {
  POSSIBLE_DUPLICATE: "Possible duplicate",
  UNUSUAL_AMOUNT: "Unusual amount",
  ZERO_OR_NEGATIVE_AMOUNT: "Zero or negative amount",
  MISSING_ONLINE_REFERENCE: "Online payment without reference",
  REFUNDED_WITHOUT_RECORD: "Marked refunded, no refund record",
  REFUND_PAYMENT_NOT_FOUND: "Refund linked to missing payment",
  REFUND_EXCEEDS_PAYMENT: "Refund larger than payment",
};

export const segmentLabel = (key: string) => SEGMENT_LABELS[key] ?? key;
export const methodLabel = (key: string) => METHOD_LABELS[key] ?? key;
export const flagLabel = (key: string) => FLAG_LABELS[key] ?? key;

/**
 * Fixed color slot per entity, so filtering never repaints a series.
 * Categories are keyed by name; anything unknown folds into the muted color.
 */
const CATEGORY_SLOTS: Record<string, number> = {
  STUDIO: 1,
  FUNCTIONAL_TRAINING: 2,
  PERSONAL_TRAINING: 3,
  PRE_POST_NATAL: 4,
  MIXED: 5,
  OPEN_GYM: 6,
  SPACE_MEMBERSHIP: 7,
  ULTIMATE_MINDSPACER: 8,
};

export function categoryColor(key: string): string {
  const slot = CATEGORY_SLOTS[key];
  return slot ? `var(--viz-${slot})` : "var(--viz-muted)";
}

export function seriesColor(index: number): string {
  return index < 8 ? `var(--viz-${index + 1})` : "var(--viz-muted)";
}
