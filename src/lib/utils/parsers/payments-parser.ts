import { Payment } from "@/components/ui/payments/columns";

export interface RawPaymentRecord {
  _id?: string;
  id?: string;
  uid?: { name?: string; phoneNumber?: string };
  nonMemberName?: string;
  memberName?: string;
  nonMemberPhone?: string;
  phoneNumber?: string;
  phone?: string;
  pkgId?: { name: string };
  scid?: {
    cid: { title: string; locations: { branchName: string }[] };
    startTime: string;
  };
  paymentTime?: string | Date;
  createdAt?: string | Date;
  recordedAt?: string | Date;
  amount: number | string;
  paymentMethod?: string;
  // isRefunded on a payment row means "this purchase was refunded" (informational).
  // It does NOT make the row render as an outflow — only entryType/isMoneyOut do that.
  isRefunded?: boolean;
  isRefund?: boolean;
  isCashOut?: boolean;
  // entryType comes from the API on refund/cashout rows
  entryType?: "REFUND" | "CASHOUT";
  // isMoneyOut is set by the API on refund/cashout rows
  isMoneyOut?: boolean;
  type?: string;
  transactionType?: string;
  kind?: string;
  refundReason?: string;
  reason?: string;
  paymentLabel?: string | null;
}

export function normalizePaymentsPayload(data: unknown): RawPaymentRecord[] {
  if (Array.isArray(data)) {
    return data as RawPaymentRecord[];
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    return [
      ...(Array.isArray(obj.payments) ? (obj.payments as RawPaymentRecord[]) : []),
      ...(Array.isArray(obj.refunds) ? (obj.refunds as RawPaymentRecord[]) : []),
      ...(Array.isArray(obj.cashOuts)
        ? (obj.cashOuts as RawPaymentRecord[])
        : []),
      ...(Array.isArray(obj.cashouts)
        ? (obj.cashouts as RawPaymentRecord[])
        : []),
    ];
  }

  return [];
}

function getRecordId(record: RawPaymentRecord): string | undefined {
  return record._id ?? record.id;
}

export function mergePaymentRecords(
  primary: RawPaymentRecord[],
  supplemental: RawPaymentRecord[]
): RawPaymentRecord[] {
  const seen = new Set<string>();
  const merged = [...primary];

  for (const record of primary) {
    const id = getRecordId(record);
    if (id) seen.add(id);
  }

  for (const record of supplemental) {
    const id = getRecordId(record);
    if (!id || !seen.has(id)) {
      merged.push(record);
      if (id) seen.add(id);
    }
  }

  return merged;
}

function normalizeType(record: RawPaymentRecord): string {
  return (record.type ?? record.transactionType ?? record.kind ?? "")
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function hasMemberContext(record: RawPaymentRecord): boolean {
  return !!(
    record.uid?.name ||
    record.memberName ||
    record.nonMemberName ||
    record.uid
  );
}

function isPackageOrClassPayment(record: RawPaymentRecord): boolean {
  return !!(record.pkgId || record.scid);
}

function getTransactionFlags(record: RawPaymentRecord) {
  // Primary signal: entryType or isMoneyOut set by the API on dedicated refund/cashout rows.
  // A raw payment row with isRefunded=true is just "this purchase was refunded" — it stays
  // as a positive purchase entry. The separate refund row carries the negative amount.
  if (record.isMoneyOut === true || record.entryType === "REFUND" || record.entryType === "CASHOUT") {
    const isCashOut = record.entryType === "CASHOUT" || record.isCashOut === true;
    return { isCashOut, isRefunded: true };
  }

  // Fallback heuristics for legacy / supplemental data sources (refunds/cashouts endpoints)
  const type = normalizeType(record);

  const explicitCashOut =
    record.isCashOut === true ||
    type === "CASH_OUT" ||
    type === "CASHOUT";

  const explicitMemberRefund =
    (record.isRefunded === true || record.isRefund === true) &&
    !explicitCashOut;

  const typedMemberRefund =
    type === "REFUND" ||
    type === "MEMBER_REFUND" ||
    type === "MEMBERREFUND";

  const typedCashOut = explicitCashOut;

  const reason = record.refundReason ?? record.reason;
  const inferredCashOut =
    !explicitMemberRefund &&
    !typedMemberRefund &&
    !isPackageOrClassPayment(record) &&
    !hasMemberContext(record) &&
    !!reason &&
    (typedCashOut ||
      type === "OUTFLOW" ||
      record.paymentMethod?.toUpperCase() === "CASH OUT");

  const inferredMemberRefund =
    !inferredCashOut &&
    !typedCashOut &&
    !!reason &&
    !isPackageOrClassPayment(record) &&
    (explicitMemberRefund ||
      typedMemberRefund ||
      hasMemberContext(record));

  const isCashOut = typedCashOut || inferredCashOut;
  const isRefunded = explicitMemberRefund || typedMemberRefund || inferredMemberRefund || isCashOut;

  return { isCashOut, isRefunded };
}

export const parsePayments = (payments: unknown): Payment[] => {
  const records = normalizePaymentsPayload(payments);

  return records.map((payment) => {
    const { isCashOut, isRefunded } = getTransactionFlags(payment);

    let purpose = "";
    if (payment.pkgId) {
      purpose = payment.pkgId.name;
    } else if (payment.scid) {
      purpose = payment.scid.cid.title;
    }

    const refundReason = payment.refundReason ?? payment.reason ?? "";
    const resolvedMemberName =
      payment.uid?.name ??
      payment.nonMemberName ??
      payment.memberName;

    const memberName = isCashOut
      ? "Cash Out"
      : (resolvedMemberName ?? (isRefunded ? "Refund" : "—"));

    return {
      memberName,
      phone:
        payment.uid?.phoneNumber ??
        payment.nonMemberPhone ??
        payment.phoneNumber ??
        payment.phone ??
        "—",
      purpose:
        purpose ||
        refundReason ||
        (isCashOut ? "Cash Out" : isRefunded ? "Refund" : ""),
      paymentTime: new Date(
        (payment.paymentTime ?? payment.createdAt ?? payment.recordedAt ?? new Date()) as string | Date
      ),
      amount: String(payment.amount),
      paymentMethod:
        payment.paymentMethod ??
        (isCashOut ? "Cash Out" : isRefunded ? "Refund" : "—"),
      location: payment.scid
        ? payment.scid.cid.locations[0]?.branchName ?? " -- "
        : " -- ",
      classTime: payment.scid ? payment.scid.startTime : "",
      isRefunded,
      isCashOut,
      refundReason,
      paymentLabel: payment.paymentLabel ?? null,
    };
  });
};

export function isOutflowTransaction(payment: Payment): boolean {
  return !!(payment.isRefunded || payment.isCashOut);
}

export function getOutflowBadgeLabel(payment: Payment): string {
  return payment.isCashOut ? "Cash Out" : "Refunded";
}
