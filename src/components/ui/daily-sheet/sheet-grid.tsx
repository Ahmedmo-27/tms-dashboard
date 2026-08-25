"use client";

import { Fragment, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SheetNameCell } from "./sheet-name-cell";
import type { LocalSheetRow, SheetPane } from "./types";
import { explainSheetRowFault } from "@/lib/utils/sheet-row-fault";

const COLUMNS = [
  { key: "num", label: "#", width: "2.5rem" },
  { key: "name", label: "Name", width: "11rem" },
  { key: "member", label: "Member", width: "10.5rem" },
  { key: "payment", label: "Payment", width: "4.75rem" },
  { key: "method", label: "Method", width: "5.5rem" },
  { key: "purpose", label: "Purpose", width: "10rem" },
  { key: "phone", label: "Number", width: "7.5rem" },
  { key: "status", label: "Status", width: "6.5rem" },
  { key: "notes", label: "Notes", width: "10rem" },
] as const;

export type SheetSection = {
  key: string;
  headerLabel?: string;
  headerName?: string;
  rows: LocalSheetRow[];
};

function cellClass(extra?: string) {
  return cn(
    "border-b border-r border-border/70 p-0 align-middle",
    extra
  );
}

function isLongSheetError(message: string): boolean {
  return message.length > 90 || message.includes("\n");
}

function StatusCell({
  row,
  onRemove,
}: {
  row: LocalSheetRow;
  onRemove?: (clientRowId: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!row.name.trim() && row.status === "draft") {
    return <div className="h-8" />;
  }

  const label =
    row.status === "in_app"
      ? "In app"
      : row.status === "draft"
        ? "Draft"
        : row.status === "saved"
          ? "Saved"
          : row.status === "skipped"
            ? "Skipped"
            : "Error";

  const tone =
    row.status === "in_app" || row.status === "saved"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
      : row.status === "draft"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
        : row.status === "skipped"
          ? "bg-muted text-muted-foreground"
          : "bg-destructive/15 text-destructive";

  const message = row.error?.trim() || "";
  const hasIssue =
    Boolean(message) && (row.status === "error" || row.status === "skipped");
  const longError = hasIssue && isLongSheetError(message);

  const badge = (
    <span
      className={cn(
        "inline-flex max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium",
        tone,
        longError && "cursor-pointer underline decoration-dotted underline-offset-2"
      )}
    >
      {label}
    </span>
  );

  const removable = Boolean(onRemove) && hasIssue;

  return (
    <>
      <div className="flex h-8 items-center gap-1 px-1.5">
        {hasIssue ? (
          <Tooltip>
            <TooltipTrigger asChild>
              {longError ? (
                <button
                  type="button"
                  className="max-w-full min-w-0"
                  onClick={() => setDetailsOpen(true)}
                >
                  {badge}
                </button>
              ) : (
                <span className="max-w-full min-w-0">{badge}</span>
              )}
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={6}
              className="max-w-xs text-left font-normal"
            >
              {longError ? "Click to view whole error message" : message}
            </TooltipContent>
          </Tooltip>
        ) : (
          badge
        )}

        {removable ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Remove this row"
                onClick={() => onRemove?.(row.clientRowId)}
                className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="font-normal">
              Remove this row from the sheet
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Row error</DialogTitle>
            <DialogDescription>
              Why this row was not saved
              {row.name.trim() ? ` for ${row.name.trim()}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Error</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{message}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Why this row is faulty
              </p>
              <p className="mt-1">{explainSheetRowFault(row, message, row.errorCode)}</p>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs">
              <dt className="text-muted-foreground">Member</dt>
              <dd>{row.memberLabel || "—"}</dd>
              <dt className="text-muted-foreground">Payment</dt>
              <dd>{row.amount || "—"}</dd>
              <dt className="text-muted-foreground">Method</dt>
              <dd>{row.paymentMethod || "—"}</dd>
              <dt className="text-muted-foreground">Purpose</dt>
              <dd>{row.purpose || "—"}</dd>
              <dt className="text-muted-foreground">Number</dt>
              <dd>{row.phone || "—"}</dd>
              <dt className="text-muted-foreground">Notes</dt>
              <dd>{row.note || "—"}</dd>
            </dl>
          </div>
          <DialogFooter>
            {removable ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  setDetailsOpen(false);
                  onRemove?.(row.clientRowId);
                }}
              >
                <X className="h-4 w-4" />
                Remove row
              </Button>
            ) : null}
            <Button type="button" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SheetInput({
  value,
  disabled,
  list,
  onChange,
  align,
  pending,
  pendingLabel,
}: {
  value: string;
  disabled?: boolean;
  list?: string;
  onChange: (value: string) => void;
  align?: "right";
  pending?: boolean;
  pendingLabel?: string;
}) {
  const input = (
    <input
      value={value}
      disabled={disabled}
      list={list}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full bg-transparent px-2 text-xs outline-none disabled:cursor-default",
        "focus:bg-primary/5",
        align === "right" && "text-right tabular-nums",
        pending && "pr-6"
      )}
    />
  );

  if (!pending) return input;

  return (
    <div className="relative min-w-0">
      {input}
      <Loader2
        aria-label={pendingLabel}
        className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-muted-foreground"
      />
    </div>
  );
}

function PersonRow({
  row,
  number,
  memberListId,
  purposeListId,
  methodListId,
  onPatch,
  onRemove,
  onMemberPicked,
}: {
  row: LocalSheetRow;
  number: number | "";
  memberListId: string;
  purposeListId: string;
  methodListId: string;
  onPatch: (clientRowId: string, patch: Partial<LocalSheetRow>) => void;
  onRemove?: (clientRowId: string) => void;
  onMemberPicked?: (row: LocalSheetRow, memberId: string) => void;
}) {
  const locked = row.status === "in_app" || row.status === "saved";
  const empty = !row.name.trim() && row.status === "draft";
  const pending = Boolean(row.lookupPending) && !locked;

  return (
    <tr
      className={cn(
        "h-8",
        empty && "bg-background",
        row.status === "error" && "bg-destructive/5",
        row.status === "skipped" && "bg-muted/40",
        row.status === "draft" &&
          row.name &&
          "bg-amber-50/70 dark:bg-amber-950/20",
        !empty && "hover:bg-muted/40"
      )}
    >
      <td className={cellClass("w-10 bg-muted/30 text-center text-[11px] text-muted-foreground")}>
        {number}
      </td>
      <td className={cellClass("min-w-[11rem]")}>
        <SheetNameCell
          value={row.name}
          memberId={row.memberId}
          disabled={locked}
          onChange={({ name, memberId, phone }) => {
            onPatch(row.clientRowId, {
              name,
              memberId,
              phone: phone ?? row.phone,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
              // A member pick re-flags this immediately below; clearing it here
              // stops a discarded pick from spinning forever.
              lookupPending: false,
            });
            if (memberId && !locked) onMemberPicked?.(row, memberId);
          }}
        />
      </td>
      <td className={cellClass("min-w-[10.5rem]")}>
        <SheetInput
          value={row.memberLabel}
          disabled={locked && Boolean(row.memberLabel)}
          list={memberListId}
          pending={pending}
          pendingLabel="Finding membership"
          onChange={(memberLabel) =>
            onPatch(row.clientRowId, {
              memberLabel,
              autoFilled: false,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
      <td className={cellClass("w-[4.75rem]")}>
        <SheetInput
          value={row.amount}
          align="right"
          onChange={(amount) =>
            onPatch(row.clientRowId, {
              amount,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
      <td className={cellClass("w-[5.5rem]")}>
        <SheetInput
          value={row.paymentMethod}
          list={methodListId}
          onChange={(paymentMethod) =>
            onPatch(row.clientRowId, {
              paymentMethod,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
      <td className={cellClass("min-w-[10rem]")}>
        <SheetInput
          value={row.purpose}
          list={purposeListId}
          pending={pending}
          pendingLabel="Finding purpose"
          onChange={(purpose) =>
            onPatch(row.clientRowId, {
              purpose,
              autoFilled: false,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
      <td className={cellClass("w-[7.5rem]")}>
        <SheetInput
          value={row.phone}
          disabled={locked && Boolean(row.phone)}
          onChange={(phone) =>
            onPatch(row.clientRowId, {
              phone,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
      <td className={cellClass("w-[6.5rem]")}>
        <StatusCell row={row} onRemove={onRemove} />
      </td>
      <td className={cellClass("min-w-[10rem]")}>
        <SheetInput
          value={row.note || ""}
          onChange={(note) =>
            onPatch(row.clientRowId, {
              note,
              status: locked ? row.status : "draft",
              error: undefined,
              errorCode: undefined,
            })
          }
        />
      </td>
    </tr>
  );
}

export function SheetPaneTable({
  title,
  subtitle,
  sections,
  pane,
  memberOptions,
  purposeOptions,
  paymentMethods,
  emptyMessage,
  onPatch,
  onRemove,
  onMemberPicked,
}: {
  title: string;
  subtitle?: string;
  sections: SheetSection[];
  pane: SheetPane;
  memberOptions: string[];
  purposeOptions: string[];
  paymentMethods: string[];
  emptyMessage?: string;
  onPatch: (clientRowId: string, patch: Partial<LocalSheetRow>) => void;
  onRemove?: (clientRowId: string) => void;
  onMemberPicked?: (row: LocalSheetRow, memberId: string) => void;
}) {
  const memberListId = `${pane}-member-list`;
  const purposeListId = `${pane}-purpose-list`;
  const methodListId = `${pane}-method-list`;
  let running = 1;
  const hasRows = sections.some((section) => section.rows.length > 0);

  return (
    <section className="flex min-w-[68rem] flex-1 flex-col border-r border-border/80 bg-card last:border-r-0">
      <header className="sticky top-0 z-20 flex h-10 items-center justify-between gap-3 border-b bg-muted px-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      <table className="w-full border-collapse text-xs">
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-muted/50">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="sticky top-10 z-10 border-b border-r border-border bg-muted px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
          <tbody>
            {sections.map((section) => {
              let filled = 0;
              const body = (
                <>
                  {section.headerLabel ? (
                    <tr className="bg-emerald-50 dark:bg-emerald-950/50">
                      <td className={cellClass("bg-emerald-100/80 dark:bg-emerald-950/50")} />
                      <td
                        className={cellClass(
                          "bg-emerald-50 px-2 py-1.5 font-semibold dark:bg-emerald-950/50"
                        )}
                      >
                        {section.headerLabel}
                      </td>
                      <td
                        className={cellClass(
                          "bg-emerald-50 px-2 py-1.5 text-muted-foreground dark:bg-emerald-950/50"
                        )}
                        colSpan={7}
                      >
                        {section.headerName || ""}
                      </td>
                    </tr>
                  ) : null}
                  {section.rows.map((row) => {
                    const hasName = Boolean(row.name.trim());
                    const number = hasName
                      ? pane === "space_pt"
                        ? running++
                        : ++filled
                      : "";
                    return (
                      <PersonRow
                        key={row.clientRowId}
                        row={row}
                        number={number}
                        memberListId={memberListId}
                        purposeListId={purposeListId}
                        methodListId={methodListId}
                        onPatch={onPatch}
                        onRemove={onRemove}
                        onMemberPicked={onMemberPicked}
                      />
                    );
                  })}
                </>
              );
              return <Fragment key={section.key}>{body}</Fragment>;
            })}
          </tbody>
        </table>
      {!hasRows && emptyMessage ? (
        <p className="px-3 py-6 text-center text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      ) : null}
      <datalist id={memberListId}>
        {[...new Set(memberOptions)].map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      <datalist id={purposeListId}>
        {[...new Set(purposeOptions)].map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      <datalist id={methodListId}>
        {[...new Set(paymentMethods)].map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </section>
  );
}
