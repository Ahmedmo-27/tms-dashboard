import { tms } from "@/lib/tms-api";
import type {
  SheetCommitResult,
  SheetCommitRow,
  SheetDayResponse,
  SheetImportClass,
  SheetImportPerson,
  SheetImportResponse,
  SheetMemberEligibility,
  SheetPane,
} from "@/components/ui/daily-sheet/types";

export async function getSheetDay(
  date: string,
  locationId?: string
): Promise<SheetDayResponse> {
  const params: Record<string, string> = { date };
  if (locationId) params.locationId = locationId;
  const response = await tms.get("/admin/sheet", { params });
  return response.data.data as SheetDayResponse;
}

export async function getSheetMemberEligibility(params: {
  memberId: string;
  pane: SheetPane;
  scid?: string;
}): Promise<SheetMemberEligibility> {
  const query: Record<string, string> = {
    memberId: params.memberId,
    pane: params.pane,
  };
  if (params.scid) query.scid = params.scid;
  const response = await tms.get("/admin/sheet/member-eligibility", {
    params: query,
  });
  return response.data.data as SheetMemberEligibility;
}

export async function commitSheetRows(payload: {
  date: string;
  locationId?: string;
  rows: SheetCommitRow[];
}): Promise<SheetCommitResult[]> {
  const response = await tms.post("/admin/sheet/commit", payload);
  return response.data.data as SheetCommitResult[];
}

export async function importSheetDay(payload: {
  date: string;
  locationId?: string;
  classes: SheetImportClass[];
  spacePt: SheetImportPerson[];
}): Promise<SheetImportResponse> {
  const response = await tms.post("/admin/sheet/import", payload);
  return response.data.data as SheetImportResponse;
}
