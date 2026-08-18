export interface ClientDto {
  memberId: string;
  name: string;
  email: string;
  phoneNumber: string;
  source: string[];
  activePackagesCount: number;
  remainingClasses: number | null;
  daysUntilExpiry: number | null;
  nearestExpiryDate: string | null;
}

export interface ActivePackageDto {
  pkgId: string;
  pkgStartDate: string;
  remainingClasses: number;
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
}

export interface TodayPtAlertDto {
  memberId: string;
  name: string;
  remainingClasses: number;
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
  createdAt: string;
  pkgId?: string;
}
