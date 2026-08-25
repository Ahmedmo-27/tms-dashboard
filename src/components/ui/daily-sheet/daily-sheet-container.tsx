"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Loader2, Save, Table2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PaymentDatePicker } from "@/components/ui/payments/date-picker";
import { useBranchContext } from "@/lib/hooks/use-branch-context";
import { parseSheetAmount } from "@/lib/utils/daily-sheet-csv";
import {
  commitSheetRows,
  getSheetDay,
  getSheetMemberEligibility,
} from "@/lib/data/daily-sheet";
import { getApiErrorMessage } from "@/lib/utils/api-error-message";
import { SheetPaneTable, type SheetSection } from "./sheet-grid";
import { ExportSheetDialog } from "./export-sheet-dialog";
import { ImportSheetDialog } from "./import-sheet-dialog";
import type {
  LocalSheetRow,
  SheetCommitRow,
  SheetCommitResult,
  SheetDayResponse,
  SheetMemberEligibility,
  SheetPane,
  SheetPersonRow,
} from "./types";

const CLASS_DRAFTS = 3;
const SPACE_DRAFTS = 6;

function amountText(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value))) return "";
  return String(value);
}

function mergeEligibility(
  row: LocalSheetRow,
  result: SheetMemberEligibility
): LocalSheetRow {
  if (!result.ok) {
    return {
      ...row,
      status: "error",
      error: result.error || "This member has no eligible package",
      errorCode: result.code,
      lookupPending: false,
    };
  }
  const fillable = (value: string) => !value.trim() || row.autoFilled === true;
  return {
    ...row,
    memberLabel: fillable(row.memberLabel)
      ? result.memberLabel || ""
      : row.memberLabel,
    purpose: fillable(row.purpose) ? result.purpose || "" : row.purpose,
    autoFilled: true,
    status: "draft",
    error: undefined,
    errorCode: undefined,
    lookupPending: false,
  };
}

function fromServerRow(
  row: SheetPersonRow,
  pane: SheetPane,
  scid?: string,
  uniqueId = row.id
): LocalSheetRow {
  const amount = amountText(row.amount);
  const paymentMethod = row.paymentMethod || "";
  const purpose = row.purpose || "";
  const phone = row.phone || "";
  return {
    clientRowId: uniqueId,
    originId: row.id,
    pane,
    scid: scid || row.scid,
    memberId: row.memberId,
    name: row.name || "",
    memberLabel: row.memberLabel || "",
    amount,
    paymentMethod,
    purpose,
    phone,
    status: "in_app",
    note: row.note || "",
    baseline: { amount, paymentMethod, purpose, phone },
  };
}

function uniqueServerRows(
  rows: SheetPersonRow[],
  pane: SheetPane,
  scid?: string
): LocalSheetRow[] {
  const seen = new Map<string, number>();
  return rows.map((row) => {
    const base = row.id || `${pane}:${row.name || "row"}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return fromServerRow(row, pane, scid, count === 0 ? base : `${base}:${count}`);
  });
}

function emptyDraft(pane: SheetPane, scid?: string, index = 0): LocalSheetRow {
  return {
    clientRowId: `draft:${pane}:${scid || "space"}:${index}:${Math.random().toString(36).slice(2, 8)}`,
    pane,
    scid,
    name: "",
    memberLabel: "",
    amount: "",
    paymentMethod: "",
    purpose: "",
    phone: "",
    note: "",
    status: "draft",
  };
}

function parseAmount(raw: string): number | null {
  return parseSheetAmount(raw).amount;
}

function shouldCommit(row: LocalSheetRow): boolean {
  if (!row.name.trim()) return false;
  if (row.status === "draft" || row.status === "error") return true;
  if (row.status === "in_app" || row.status === "saved") {
    const hadPayment = Boolean(row.baseline?.amount);
    const hasPayment = Boolean(row.amount.trim());
    return !hadPayment && hasPayment;
  }
  return false;
}

function toCommitRow(row: LocalSheetRow): SheetCommitRow {
  return {
    clientRowId: row.clientRowId,
    pane: row.pane,
    scid: row.scid,
    memberId: row.memberId,
    name: row.name.trim(),
    memberLabel: row.memberLabel.trim() || undefined,
    amount: parseAmount(row.amount),
    paymentMethod: row.paymentMethod.trim() || undefined,
    purpose: row.purpose.trim() || undefined,
    phone: row.phone.trim() || undefined,
    note:
      row.note?.trim() ||
      (/will\s*(pay|renew|scan)|\binvit|\binv\b/i.test(
        `${row.memberLabel} ${row.purpose}`
      )
        ? row.memberLabel.trim() || row.purpose.trim() || undefined
        : undefined),
    amountText: row.amount.trim() || undefined,
  };
}

type ClassState = {
  scid: string;
  title: string;
  coachName: string;
  rows: LocalSheetRow[];
};

function buildState(day: SheetDayResponse): {
  classes: ClassState[];
  spacePt: LocalSheetRow[];
} {
  const classes = day.classes.map((block) => ({
    scid: block.scid,
    title: block.title,
    coachName: block.coachName,
    rows: [
      ...uniqueServerRows(block.rows, "class", block.scid),
      ...Array.from({ length: CLASS_DRAFTS }, (_, i) =>
        emptyDraft("class", block.scid, i)
      ),
    ],
  }));
  const spacePt = day.locationId
    ? [
        ...uniqueServerRows(day.spacePt, "space_pt"),
        ...Array.from({ length: SPACE_DRAFTS }, (_, i) =>
          emptyDraft("space_pt", undefined, i)
        ),
      ]
    : [];
  return { classes, spacePt };
}

export function DailySheetContainer({
  initialDay,
  initialDate,
  locationId,
}: {
  initialDay: SheetDayResponse;
  initialDate: string;
  locationId?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isViewingAllBranches, canActAsBranchAdmin, effectiveLocationId } =
    useBranchContext();
  const branchId = locationId || effectiveLocationId;
  const [day, setDay] = useState(initialDay);
  const [date, setDate] = useState(() => new Date(`${initialDate}T12:00:00`));
  const [classes, setClasses] = useState<ClassState[]>(
    () => buildState(initialDay).classes
  );
  const [spacePt, setSpacePt] = useState<LocalSheetRow[]>(
    () => buildState(initialDay).spacePt
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const loadGeneration = useRef(0);

  useEffect(() => {
    setDate(new Date(`${initialDate}T12:00:00`));
    const next = buildState(initialDay);
    setDay(initialDay);
    setClasses(next.classes);
    setSpacePt(next.spacePt);
  }, [initialDay, initialDate]);

  const pendingCount = useMemo(() => {
    const classRows = classes.flatMap((cls) => cls.rows);
    return [...classRows, ...spacePt].filter(shouldCommit).length;
  }, [classes, spacePt]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingCount === 0) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [pendingCount]);

  const loadDay = useCallback(
    async (nextDate: Date) => {
      const generation = ++loadGeneration.current;
      setLoading(true);
      try {
        const dateKey = format(nextDate, "yyyy-MM-dd");
        const next = await getSheetDay(dateKey, branchId);
        if (generation !== loadGeneration.current) return;
        const state = buildState(next);
        setDay(next);
        setClasses(state.classes);
        setSpacePt(state.spacePt);
      } catch (error) {
        if (generation !== loadGeneration.current) return;
        toast.error(getApiErrorMessage(error));
      } finally {
        if (generation === loadGeneration.current) {
          setLoading(false);
        }
      }
    },
    [branchId]
  );

  // Branch admins (and a selected branch) are known on the client even when
  // the first server render had no locationId, which leaves SPACE / PT empty.
  useEffect(() => {
    if (!branchId || initialDay.locationId === branchId) return;
    void loadDay(new Date(`${initialDate}T12:00:00`));
  }, [branchId, initialDay.locationId, initialDate, loadDay]);

  const handleImported = (importedDate: string, importedLocationId: string) => {
    const currentDate = format(date, "yyyy-MM-dd");
    if (
      importedDate === currentDate &&
      importedLocationId === (branchId || "")
    ) {
      void loadDay(date);
    }
  };

  const handleDateChange = (next?: Date) => {
    if (!next) return;
    const dateKey = format(next, "yyyy-MM-dd");
    if (dateKey === format(date, "yyyy-MM-dd")) return;
    if (pendingCount > 0) {
      const ok = window.confirm(
        "You have unsaved sheet rows. Change date and discard them?"
      );
      if (!ok) return;
    }
    setDate(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", dateKey);
    router.replace(`/dashboard/sheet?${params.toString()}`);
    void loadDay(next);
  };

  const patchClassRow = (clientRowId: string, patch: Partial<LocalSheetRow>) => {
    setClasses((prev) =>
      prev.map((cls) => {
        const index = cls.rows.findIndex((r) => r.clientRowId === clientRowId);
        if (index < 0) return cls;
        const rows = cls.rows.map((row) =>
          row.clientRowId === clientRowId ? { ...row, ...patch } : row
        );
        const last = rows[rows.length - 1];
        if (last?.name.trim()) {
          rows.push(emptyDraft("class", cls.scid, rows.length));
        }
        return { ...cls, rows };
      })
    );
  };

  const patchSpaceRow = (clientRowId: string, patch: Partial<LocalSheetRow>) => {
    setSpacePt((prev) => {
      const rows = prev.map((row) =>
        row.clientRowId === clientRowId ? { ...row, ...patch } : row
      );
      const last = rows[rows.length - 1];
      if (last?.name.trim()) {
        rows.push(emptyDraft("space_pt", undefined, rows.length));
      }
      return rows;
    });
  };

  // Error and skipped rows were never written to the system, so dropping them
  // only clears the sheet.
  const removeClassRow = (clientRowId: string) => {
    setClasses((prev) =>
      prev.map((cls) => ({
        ...cls,
        rows: cls.rows.filter((row) => row.clientRowId !== clientRowId),
      }))
    );
  };

  const removeSpaceRow = (clientRowId: string) => {
    setSpacePt((prev) => prev.filter((row) => row.clientRowId !== clientRowId));
  };

  // Rewrites one row in place. Unlike patchClassRow/patchSpaceRow this never
  // appends a trailing draft, so async results can land without growing the pane.
  const updateRow = (
    pane: SheetPane,
    clientRowId: string,
    update: (row: LocalSheetRow) => LocalSheetRow
  ) => {
    if (pane === "class") {
      setClasses((prev) =>
        prev.map((cls) => ({
          ...cls,
          rows: cls.rows.map((r) =>
            r.clientRowId === clientRowId ? update(r) : r
          ),
        }))
      );
    } else {
      setSpacePt((prev) =>
        prev.map((r) => (r.clientRowId === clientRowId ? update(r) : r))
      );
    }
  };

  // The package a check-in would spend is known as soon as the member is, so
  // fill Member and Purpose right away instead of failing at save time.
  const handleMemberPicked = async (row: LocalSheetRow, memberId: string) => {
    // Skip any answer for a row that moved on to a different member meanwhile.
    const forThisMember =
      (update: (row: LocalSheetRow) => LocalSheetRow) =>
      (current: LocalSheetRow) =>
        current.memberId === memberId ? update(current) : current;

    updateRow(
      row.pane,
      row.clientRowId,
      forThisMember((current) => ({ ...current, lookupPending: true }))
    );

    let result: SheetMemberEligibility;
    try {
      result = await getSheetMemberEligibility({
        memberId,
        pane: row.pane,
        scid: row.scid,
      });
    } catch {
      // A lookup failure must not block typing; saving still validates.
      updateRow(
        row.pane,
        row.clientRowId,
        forThisMember((current) => ({ ...current, lookupPending: false }))
      );
      return;
    }
    updateRow(
      row.pane,
      row.clientRowId,
      forThisMember((current) => mergeEligibility(current, result))
    );
  };

  const mergeAfterSave = (
    fresh: { classes: ClassState[]; spacePt: LocalSheetRow[] },
    currentClasses: ClassState[],
    currentSpace: LocalSheetRow[],
    results: Map<string, SheetCommitResult>
  ) => {
    const keep = (row: LocalSheetRow): LocalSheetRow | null => {
      const result = results.get(row.clientRowId);
      if (result && !result.ok) {
        return {
          ...row,
          status: "error",
          error: result.error,
          errorCode: result.code,
        };
      }
      if (result?.skipped) {
        return {
          ...row,
          status: "skipped",
          error: result.error,
          errorCode: result.code,
          note:
            row.note?.trim() ||
            row.memberLabel.trim() ||
            row.purpose.trim() ||
            row.note,
        };
      }
      return null;
    };

    const classesMerged = fresh.classes.map((cls) => {
      const old = currentClasses.find((c) => c.scid === cls.scid);
      const inApp = cls.rows.filter((r) => r.status === "in_app");
      const leftovers = (old?.rows.map(keep) ?? []).filter(
        (row): row is LocalSheetRow => row !== null
      );
      const drafts = Array.from({ length: CLASS_DRAFTS }, (_, i) =>
        emptyDraft("class", cls.scid, i)
      );
      return { ...cls, rows: [...inApp, ...leftovers, ...drafts] };
    });

    const inAppSpace = fresh.spacePt.filter((r) => r.status === "in_app");
    const leftoverSpace = currentSpace
      .map(keep)
      .filter((row): row is LocalSheetRow => row !== null);
    const spaceDrafts = Array.from({ length: SPACE_DRAFTS }, (_, i) =>
      emptyDraft("space_pt", undefined, i)
    );

    return {
      classes: classesMerged,
      spacePt: [...inAppSpace, ...leftoverSpace, ...spaceDrafts],
    };
  };

  const handleSave = async () => {
    if (!canActAsBranchAdmin) {
      toast.error("Select a branch before saving the sheet.");
      return;
    }
    const rows = [
      ...classes.flatMap((cls) => cls.rows),
      ...spacePt,
    ].filter(shouldCommit);
    if (rows.length === 0) {
      toast.error("Nothing to save.");
      return;
    }
    setSaving(true);
    try {
      const results = await commitSheetRows({
        date: format(date, "yyyy-MM-dd"),
        locationId: branchId,
        rows: rows.map(toCommitRow),
      });
      const byId = new Map(results.map((r) => [r.clientRowId, r]));
      const failed = results.filter((r) => !r.ok);
      const skipped = results.filter((r) => r.ok && r.skipped);
      const saved = results.filter((r) => r.ok && !r.skipped);

      try {
        const next = await getSheetDay(format(date, "yyyy-MM-dd"), branchId);
        const fresh = buildState(next);
        const merged = mergeAfterSave(fresh, classes, spacePt, byId);
        setDay(next);
        setClasses(merged.classes);
        setSpacePt(merged.spacePt);
      } catch {
        const apply = (row: LocalSheetRow): LocalSheetRow => {
          const result = byId.get(row.clientRowId);
          if (!result) return row;
          if (!result.ok) {
            return {
              ...row,
              status: "error",
              error: result.error,
              errorCode: result.code,
            };
          }
          if (result.skipped) {
            return {
              ...row,
              status: "skipped",
              error: result.error,
              errorCode: result.code,
              note:
                row.note?.trim() ||
                row.memberLabel.trim() ||
                row.purpose.trim() ||
                row.note,
            };
          }
          return { ...row, status: "saved", error: undefined, errorCode: undefined };
        };
        setClasses((prev) =>
          prev.map((cls) => ({ ...cls, rows: cls.rows.map(apply) }))
        );
        setSpacePt((prev) => prev.map(apply));
      }

      if (failed.length === 1) {
        toast.error(
          failed[0].error?.trim() ||
            "1 row failed. Fix the error and save again."
        );
      } else if (failed.length) {
        const first = failed[0].error?.trim();
        toast.error(
          first
            ? `${failed.length} rows failed. ${first}`
            : `${failed.length} rows failed. Fix the errors and save again.`
        );
      } else {
        toast.success(
          skipped.length
            ? `Saved ${saved.length}, skipped ${skipped.length}.`
            : `Saved ${saved.length} row${saved.length === 1 ? "" : "s"}.`
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const classSections: SheetSection[] = classes.map((cls) => ({
    key: cls.scid,
    headerLabel: cls.title,
    headerName: cls.coachName,
    rows: cls.rows,
  }));

  const spaceSections: SheetSection[] = [
    { key: "space-pt", rows: spacePt },
  ];

  const classFilled = classes.reduce(
    (sum, cls) => sum + cls.rows.filter((row) => row.name.trim()).length,
    0
  );
  const spaceFilled = spacePt.filter((row) => row.name.trim()).length;
  const dateLabel = format(date, "d/M");

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Table2 className="h-7 w-7 shrink-0 text-primary" />
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Sheet</h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {format(date, "EEEE d MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              {pendingCount} unsaved
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">All saved</span>
          )}
          <PaymentDatePicker
            selectedDate={date}
            onDateChange={handleDateChange}
            className="h-9 w-[12.5rem]"
          />
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            disabled={saving || loading}
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportOpen(true)}
            disabled={saving || loading}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={saving || pendingCount === 0 || loading || isViewingAllBranches}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save to system
          </Button>
        </div>
      </div>

      <Separator />

      {isViewingAllBranches ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Select a branch. SPACE / PT payments are for one branch and one day only.
        </p>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/20">
        {loading ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading day…
          </div>
        ) : null}
        <div className="flex min-w-max items-start">
          <SheetPaneTable
            title={`Daily Check In ${dateLabel}`}
            subtitle={`${classes.length} class${classes.length === 1 ? "" : "es"} · ${classFilled} on sheet`}
            sections={classSections}
            pane="class"
            memberOptions={day.memberLabels.class}
            purposeOptions={day.purposeLabels.class}
            paymentMethods={day.paymentMethods}
            emptyMessage="No classes scheduled for this day."
            onPatch={patchClassRow}
            onRemove={removeClassRow}
            onMemberPicked={handleMemberPicked}
          />
          <div className="w-2 shrink-0 self-stretch bg-muted" />
          <SheetPaneTable
            title="SPACE / PT"
            subtitle={
              isViewingAllBranches
                ? "Select a branch"
                : `${spaceFilled} on this day`
            }
            sections={spaceSections}
            pane="space_pt"
            memberOptions={day.memberLabels.spacePt}
            purposeOptions={day.purposeLabels.spacePt}
            paymentMethods={day.paymentMethods}
            emptyMessage="Select a branch to see Space / PT payments for this day."
            onPatch={patchSpaceRow}
            onRemove={removeSpaceRow}
            onMemberPicked={handleMemberPicked}
          />
        </div>
      </div>

      <ExportSheetDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        sheetDate={date}
        locationId={branchId}
      />
      <ImportSheetDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        sheetDate={date}
        locationId={branchId}
        onImported={handleImported}
      />
    </div>
  );
}
