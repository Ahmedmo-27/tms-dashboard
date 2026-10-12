export interface ClientDto {
  memberId: string;
  name: string;
  email: string;
  phoneNumber: string;
  source: string[];
  activePackagesCount: number;
  remainingClasses: number | null;
  totalClasses?: number | null;
  daysUntilExpiry: number | null;
  nearestExpiryDate: string | null;
}

export interface ActivePackageDto {
  pkgId: string;
  pkgStartDate: string;
  remainingClasses: number;
  totalClasses?: number | null;
}

export interface CalendarClientDto {
  memberId: string;
  name: string;
  phoneNumber: string;
  bookingMethod: string;
  activePackage: ActivePackageDto | null;
}

export interface SessionDto {
  scheduledClassId: string;
  classTitle: string;
  category: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  location: string | null;
  coachName?: string;
  coachNames?: string;
  allCoachNames?: string;
  coaches?: { id: string; name: string }[];
  clients: CalendarClientDto[];
}

export interface DayDto {
  date: string;
  dayName: string;
  sessions: SessionDto[];
}

export interface ScheduleResponseDto {
  weekStart: string;
  weekEnd: string;
  days: DayDto[];
}

export interface CoachMeDto {
  name: string;
  email: string;
  phoneNumber: string;
  role?: string;
  branchName: string | null;
  branchLocation: string | null;
  hasPtSessions: boolean;
  hasScheduledClasses: boolean;
}

export interface TodaySessionSummaryDto {
  scheduledClassId: string;
  classTitle: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  coachName?: string;
  coachNames?: string;
  allCoachNames?: string;
  coaches?: { id: string; name: string }[];
}

export interface TodayPtAlertDto {
  memberId: string;
  name: string;
  remainingClasses: number;
  totalClasses?: number | null;
  daysUntilExpiry: number;
  packageName: string;
}

export interface TodaySummaryDto {
  nextSession: TodaySessionSummaryDto | null;
  todaySessions: TodaySessionSummaryDto[];
  scans: {
    successCount: number;
    failedCount: number;
    willPayCount: number;
  };
  tickets: { openCount: number };
  ptAlerts: TodayPtAlertDto[];
  unreadNotifications: number;
}

export interface DeductionHistoryItemDto {
  id: string;
  reason: string;
  sessionDate: string;
  classesRemainingAfter: number;
  totalClasses?: number | null;
  createdAt: string;
  pkgId?: string;
  packageName?: string;
  source?: string;
}

export interface ClientAttendanceItemDto {
  id: string;
  type: "PT" | "CLASS";
  title: string;
  date: string;
  method?: string;
  notes?: string;
  location?: string | null;
  pkgId?: string;
  scheduledClassId?: string;
}

export type PtAchievementFilterType = "weekly" | "monthly" | "date";

export interface PtAchievementParams {
  filterType: PtAchievementFilterType;
  date?: string;      // yyyy-MM-dd (for weekly mode)
  month?: string;     // yyyy-MM (for monthly mode)
  startDate?: string; // yyyy-MM-dd (for date mode)
  endDate?: string;   // yyyy-MM-dd (for date mode)
  coachId?: string;
}

export interface CoachAchievementRow {
  coachId: string;
  coachName: string;
  sessions: number;
  scanSessions: number;
  deductionSessions: number;
  boughtPackages: number;
  boughtRevenue: number;
  activeClients: number;
  remainingSessions: number;
  lowBalanceClients: number;
  expiringSoon: number;
}

export interface BoughtPackageItem {
  paymentId: string;
  memberId: string | null;
  memberName: string;
  phone: string;
  packageName: string;
  packageId: string;
  amount: number;
  numberOfSessions: number;
  paymentDate: string;
  remainingSessions: number | null;
  packageStatus: string | null;
}

export interface DeliveredSessionItem {
  id: string;
  date: string;
  source: "SCAN" | "COACH_DEDUCTION";
  memberId: string;
  memberName: string;
  phone: string;
  packageName: string;
  reason?: string;
}

export interface ClientBalanceItem {
  memberId: string;
  memberName: string;
  phone: string;
  packageName: string;
  packageId: string;
  remainingSessions: number;
  pkgEndDate: string;
  status: string;
  daysUntilExpiry: number;
  isLowBalance: boolean;
  isExpiringSoon: boolean;
}

export interface PtAchievementReport {
  range: { startDate: string; endDate: string; filterType: string };
  totals: {
    sessions: number;
    scanSessions: number;
    deductionSessions: number;
    boughtPackages: number;
    boughtRevenue: number;
    activeClients: number;
    remainingSessions: number;
    lowBalanceClients: number;
    expiringSoon: number;
  };
  coaches: CoachAchievementRow[];
  selectedCoach?: {
    coachId: string;
    coachName: string;
    boughtPackages: BoughtPackageItem[];
    deliveredSessions: DeliveredSessionItem[];
    activeClients: ClientBalanceItem[];
  };
}
