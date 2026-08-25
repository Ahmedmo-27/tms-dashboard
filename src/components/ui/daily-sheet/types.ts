export type SheetPane = "class" | "space_pt";

export type SheetRowStatus = "in_app" | "draft" | "saved" | "error" | "skipped";

export type SheetPersonRow = {
  id: string;
  source: "class_scan" | "non_user" | "pt" | "open_gym" | "payment";
  memberId?: string;
  name: string;
  memberLabel: string;
  amount?: number | null;
  paymentMethod?: string;
  purpose?: string;
  phone?: string;
  note?: string;
  paymentId?: string;
  scid?: string;
};

export type SheetClassBlock = {
  scid: string;
  title: string;
  coachName: string;
  startTime: string;
  classPrice?: number | null;
  rows: SheetPersonRow[];
};

export type SheetDayResponse = {
  date: string;
  locationId: string | null;
  classes: SheetClassBlock[];
  spacePt: SheetPersonRow[];
  memberLabels: { class: string[]; spacePt: string[] };
  purposeLabels: { class: string[]; spacePt: string[] };
  paymentMethods: string[];
};

export type SheetMemberEligibility = {
  ok: boolean;
  memberLabel?: string;
  purpose?: string;
  packageName?: string;
  remainingClasses?: number;
  error?: string;
  code?: string;
};

export type SheetCommitRow = {
  clientRowId: string;
  pane: SheetPane;
  scid?: string;
  memberId?: string;
  name: string;
  memberLabel?: string;
  amount?: number | null;
  paymentMethod?: string;
  purpose?: string;
  phone?: string;
  note?: string;
  amountText?: string;
};

export type SheetCommitResult = {
  clientRowId: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  code?: string;
};

export type SheetImportPerson = {
  name: string;
  memberLabel?: string;
  amount?: number | null;
  paymentMethod?: string;
  purpose?: string;
  phone?: string;
  note?: string;
  amountText?: string;
};

export type SheetImportClass = {
  title: string;
  coachName?: string;
  rows: SheetImportPerson[];
};

export type SheetImportSummary = {
  ok: number;
  skipped: number;
  failed: number;
  classesMatched: number;
  classesCreated: number;
};

export type SheetImportResponse = {
  results: SheetCommitResult[];
  summary: SheetImportSummary;
};

export type LocalSheetRow = {
  clientRowId: string;
  originId?: string;
  pane: SheetPane;
  scid?: string;
  memberId?: string;
  name: string;
  memberLabel: string;
  amount: string;
  paymentMethod: string;
  purpose: string;
  phone: string;
  status: SheetRowStatus;
  error?: string;
  errorCode?: string;
  note?: string;
  /** Member/Purpose came from the eligibility lookup, so a new pick may replace them. */
  autoFilled?: boolean;
  /** Eligibility lookup for the picked member is in flight. */
  lookupPending?: boolean;
  baseline?: {
    amount: string;
    paymentMethod: string;
    purpose: string;
    phone: string;
  };
};
