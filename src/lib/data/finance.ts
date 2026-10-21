import { tms } from "@/lib/tms-api";

/** Read-only finance analytics (accountant). */

export type FinanceParams = {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  [key: string]: string | number | boolean | undefined;
};

export type RangeInfo = { startDate: string; endDate: string; granularity?: "day" | "month" };

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type MoneySummary = {
  gross: number;
  refunds: number;
  cashOuts: number;
  net: number;
  netCash: number;
  transactions: number;
  avgTicket: number;
  payingCustomers: number;
  refundCount: number;
  cashOutCount: number;
  deductedCount: number;
};

export type OverviewData = {
  range: RangeInfo;
  previousRange: RangeInfo;
  summary: {
    current: MoneySummary;
    previous: MoneySummary;
    deltas: Record<keyof MoneySummary, number | null>;
  };
  trend: { bucket: string; gross: number; refunds: number; net: number; previousNet: number | null }[];
  byBranch: { locationId: string; branchName: string; gross: number; refunds: number; net: number; count: number }[];
  byMethod: { method: string; amount: number; count: number }[];
  bySegment: { segment: string; amount: number; count: number }[];
};

export type SalesRow = {
  id: string;
  time: string;
  customer: string;
  phone: string;
  memberId: string | null;
  item: string;
  segment: string;
  purpose: string;
  method: string;
  amount: number;
  listPrice: number | null;
  discount: number;
  branchId: string;
  branch: string;
  isRefunded: boolean;
  reference: string;
};

export type SalesData = {
  range: RangeInfo;
  segment: string;
  segments: { segment: string; amount: number; count: number; previousAmount: number; change: number | null }[];
  totals: {
    amount: number;
    count: number;
    avgTicket: number;
    discountTotal: number;
    discountedCount: number;
    discountRate: number;
    uniqueCustomers: number;
  };
  trend: { bucket: string; amount: number; count: number }[];
  topItems: { name: string; amount: number; count: number; listPrice: number | null; discount: number; avgPaid: number }[];
  byMethod: { method: string; amount: number; count: number }[];
  payments: Paged<SalesRow>;
};

export type CoachHoursRow = {
  coachId: string;
  name: string;
  sessions: number;
  /** Class sessions this coach ran alone. Absent on an API older than this field. */
  soloClassSessions?: number;
  /** Class sessions shared with at least one other coach. */
  groupClassSessions?: number;
  hours: number;
  hoursByCategory: Record<string, number>;
  sessionsByCategory: Record<string, number>;
  capacity: number;
  booked: number;
  attended: number;
  packageUses: number;
  attendedPackageUses: number;
  dropIns: number;
  dropInRevenue: number;
  packageValue: number;
  ptSessions: number;
  ptRevenue: number;
  attributedRevenue: number;
  uniqueMembers: number;
  fillRate: number | null;
  attendanceRate: number | null;
};

export type CoachHoursData = {
  range: RangeInfo;
  totals: {
    sessions: number;
    hours: number;
    ptSessions: number;
    activeCoaches: number;
    booked: number;
    attended: number;
    unassignedSessions: number;
  };
  categories: { category: string; hours: number; sessions: number }[];
  coaches: CoachHoursRow[];
  byClass: {
    classTitle: string;
    category: string;
    sessions: number;
    hours: number;
    booked: number;
    attended: number;
    capacity: number;
    dropInRevenue: number;
    fillRate: number | null;
    attendanceRate: number | null;
  }[];
  trend: ({ bucket: string } & Record<string, number | string>)[];
};

export type CoachUsageEntry = {
  id: string;
  date: string;
  type: "CLASS" | "PT";
  source: string;
  sessionId: string | null;
  classTitle: string;
  category: string;
  memberId: string | null;
  memberName: string;
  phone: string;
  packageName: string;
  packageCategory: string | null;
  /** Coaches assigned to the session (1 = this coach alone, PT is always 1). */
  coachCount?: number;
  isDropIn: boolean;
  attended: boolean;
  /** What the member paid per session, or the amount paid for a drop-in. */
  sessionValue: number | null;
  /** "paid" = from the member's own purchase, "list" = the package's current price. */
  valueSource?: "paid" | "list" | null;
  /** What the package cost when this member bought it. */
  packagePrice?: number | null;
  /** Sessions that purchase included. */
  packageSessions?: number | null;
  branch: string;
};

export type CoachUsageData = {
  coach: { id: string; name: string };
  range: RangeInfo;
  summary: {
    classSessions: number;
    ptSessions: number;
    totalSessions: number;
    classHours: number;
    /** Sessions the coach ran alone: solo classes + PT. Absent on an older API. */
    individualSessions?: number;
    /** Class sessions shared with at least one other coach. */
    groupSessions?: number;
    soloClassSessions?: number;
    groupClassSessions?: number;
    soloClassHours?: number;
    groupClassHours?: number;
    totalBookings: number;
    packageUses: number;
    attendedPackageUses: number;
    dropIns: number;
    attendedDropIns: number;
    /** Money taken for drop-ins in this coach's sessions. Absent on an older API. */
    dropInRevenue?: number;
    uniqueMembers: number;
    uniquePackages: number;
    estimatedValue: number;
  };
  coCoaches?: { coachId: string; name: string; sessions: number }[];
  byPackage: { packageName: string; category: string | null; uses: number; attended: number; members: number; value: number }[];
  byMember: {
    memberId: string | null;
    memberName: string;
    phone: string;
    uses: number;
    attended: number;
    dropIns: number;
    packages: string[];
  }[];
  entries: CoachUsageEntry[];
};

export type PtData = {
  range: RangeInfo;
  totals: {
    sessions: number;
    scanSessions: number;
    deductionSessions: number;
    activeClients: number;
    activePackages: number;
    remainingSessions: number;
    remainingValue: number;
    revenue: number;
    sales: number;
    newSales: number;
    renewals: number;
    renewalShare: number;
    lowBalance: number;
    expiringSoon: number;
  };
  coaches: {
    coachId: string;
    name: string;
    sessions: number;
    scanSessions: number;
    deductionSessions: number;
    activeClients: number;
    remainingSessions: number;
    lowBalanceClients: number;
    expiringSoon: number;
    revenue: number;
    sales: number;
    newSales: number;
    renewals: number;
    avgSessionsPerClient: number;
  }[];
  trend: { bucket: string; sessions: number; revenue: number }[];
  alerts: {
    memberId: string;
    memberName: string;
    phone: string;
    coach: string;
    packageName: string;
    remainingSessions: number;
    endDate: string;
    status: string;
    reasons: string[];
  }[];
};

export type DeferredData = {
  asOf: string;
  range: RangeInfo;
  totals: {
    unearned: number;
    sessionsOwed: number;
    livePackages: number;
    earnedInRange: number;
    collectedInRange: number;
    breakageInRange: number;
    expiredWithBalance: number;
    expiringNext30Days: number;
  };
  categories: {
    category: string;
    unearned: number;
    sessionsOwed: number;
    packages: number;
    earned: number;
    breakage: number;
    expiredPackages: number;
  }[];
  byBranch: { locationId: string; branchName: string; unearned: number; sessionsOwed: number }[];
  expiringByWeek: { week: string; value: number }[];
  expiring: {
    memberId: string | null;
    memberName: string;
    packageName: string;
    category: string;
    remainingSessions: number;
    valueAtRisk: number;
    endDate: string;
    branch: string;
  }[];
};

export type BranchRow = MoneySummary & {
  locationId: string;
  branchName: string;
  previousNet: number;
  netChange: number | null;
  refundRate: number;
  cashShare: number;
  cardShare: number;
  instapayShare: number;
  activeMembers: number;
  revenuePerMember: number | null;
  classSessions: number;
  classBookings: number;
  classAttendance: number;
  trend: { bucket: string; net: number }[];
};

export type BranchesData = {
  range: RangeInfo;
  previousRange: RangeInfo;
  branches: BranchRow[];
  allBranchMembers: number;
  unassignedRefunds: number;
};

export type RetentionData = {
  range: RangeInfo;
  totals: {
    activeMembers: number;
    newSignups: number;
    newPayingMembers: number;
    renewingMembers: number;
    newRevenue: number;
    renewalRevenue: number;
    packagesEnded: number;
    packagesRenewed: number;
    renewalRate: number | null;
    churnRate: number | null;
    lifetimeValueAvg: number;
    lifetimeValueMedian: number;
    payingMembersAllTime: number;
    frozenPackages: number;
    frozenSessions: number;
    frozenValue: number;
    freezesStarted: number;
    freezeDays: number;
  };
  trend: { bucket: string; newMembers: number; renewingMembers: number }[];
  byCategory: { category: string; ended: number; renewed: number; renewalRate: number | null }[];
  topSpenders: { memberId: string; name: string; phone: string; total: number; payments: number; lifetimeValue: number }[];
  churned: { memberId: string; name: string; phone: string; packageName: string; category: string; endDate: string }[];
};

export type LedgerRow = {
  id: string;
  kind: "PAYMENT" | "REFUND" | "CASHOUT";
  time: string;
  customer: string;
  phone: string;
  item: string;
  segment: string;
  purpose: string;
  method: string;
  amount: number;
  countsAsRevenue: boolean;
  branchId: string;
  branch: string;
  reference: string;
  note: string;
  isRefunded: boolean;
  recordedBy: string;
  flags: string[];
};

export type LedgerData = {
  range: RangeInfo;
  totals: { transactions: number; moneyIn: number; moneyOut: number; net: number; flagged: number };
  flagCounts: Record<string, number>;
  online: { count: number; amount: number; withReference: number; missingReference: number };
  cashByDay: {
    day: string;
    branchId: string;
    branch: string;
    cashIn: number;
    refundsOut: number;
    cashOuts: number;
    expectedInDrawer: number;
  }[];
  transactions: Paged<LedgerRow>;
};

export type RefundsData = {
  range: RangeInfo;
  totals: {
    refunds: number;
    refundCount: number;
    cashOuts: number;
    cashOutCount: number;
    gross: number;
    refundRate: number;
    avgRefund: number;
  };
  trend: { bucket: string; refunds: number; cashOuts: number }[];
  byReason: { reason: string; type: string; amount: number; count: number }[];
  byBranch: { branch: string; refunds: number; cashOuts: number; count: number }[];
  byStaff: { name: string; refunds: number; cashOuts: number; count: number }[];
  rows: {
    id: string;
    time: string;
    type: "REFUND" | "CASHOUT";
    amount: number;
    reason: string;
    member: string;
    branch: string;
    recordedBy: string;
    linkedPayment: { id: string; item: string; amount: number; method: string; time: string } | null;
  }[];
};

async function get<T>(path: string, params: FinanceParams): Promise<T> {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  const response = await tms.get(`/finance${path}`, { params: clean, timeout: 60000 });
  return response.data?.data as T;
}

export const financeApi = {
  overview: (p: FinanceParams) => get<OverviewData>("/overview", p),
  sales: (p: FinanceParams) => get<SalesData>("/sales", p),
  coaches: () => get<{ id: string; name: string }[]>("/coaches", {}),
  coachHours: (p: FinanceParams) => get<CoachHoursData>("/coach-hours", p),
  coachUsage: (coachId: string, p: FinanceParams) =>
    get<CoachUsageData>(`/coaches/${encodeURIComponent(coachId)}/package-usage`, p),
  pt: (p: FinanceParams) => get<PtData>("/pt", p),
  deferred: (p: FinanceParams) => get<DeferredData>("/deferred-revenue", p),
  branches: (p: FinanceParams) => get<BranchesData>("/branches", p),
  retention: (p: FinanceParams) => get<RetentionData>("/retention", p),
  ledger: (p: FinanceParams) => get<LedgerData>("/ledger", p),
  refunds: (p: FinanceParams) => get<RefundsData>("/refunds", p),
};
