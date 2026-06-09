import { tms } from "@/lib/tms-api";
import {
  mergePaymentRecords,
  normalizePaymentsPayload,
  parsePayments,
  type RawPaymentRecord,
} from "../utils/parsers/payments-parser";

const REFUND_LIST_ENDPOINTS = [
  "/api/admin/refunds",
  "/admin/refunds",
] as const;

const CASHOUT_LIST_ENDPOINTS = [
  "/api/admin/refunds/cashout",
  "/api/admin/refunds/cashouts",
  "/admin/refunds/cashout",
  "/admin/refunds/cashouts",
] as const;

async function fetchFromEndpoints(
  endpoints: readonly string[],
  date?: string
): Promise<RawPaymentRecord[]> {
  const dateQuery = date ? `?date=${date}` : "";

  for (const endpoint of endpoints) {
    try {
      const response = await tms.get(`${endpoint}${dateQuery}`);
      return normalizePaymentsPayload(response.data.data);
    } catch {
      // Try the next endpoint shape.
    }
  }

  return [];
}

function tagMemberRefundRecords(records: RawPaymentRecord[]): RawPaymentRecord[] {
  return records.map((record) => ({
    ...record,
    isRefunded: true,
    isCashOut: false,
  }));
}

function tagCashOutRecords(records: RawPaymentRecord[]): RawPaymentRecord[] {
  return records.map((record) => ({
    ...record,
    isCashOut: true,
    isRefunded: true,
  }));
}

export const getPayments = async (date?: string) => {
  try {
    const dateQuery = date ? `?date=${date}` : "";
    const response = await tms.get(`/admin/payments${dateQuery}`);
    const paymentRecords = normalizePaymentsPayload(response.data.data);

    const [refundRecords, cashOutRecords] = await Promise.all([
      fetchFromEndpoints(REFUND_LIST_ENDPOINTS, date),
      fetchFromEndpoints(CASHOUT_LIST_ENDPOINTS, date),
    ]);

    const mergedRecords = mergePaymentRecords(
      paymentRecords,
      mergePaymentRecords(
        tagMemberRefundRecords(refundRecords),
        tagCashOutRecords(cashOutRecords)
      )
    );

    return parsePayments(mergedRecords);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
