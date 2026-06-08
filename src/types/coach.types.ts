export interface ClientDto {
  memberId: string;
  name: string;
  email: string;
  phoneNumber: string;
  source: string[];           // ["PT"], ["GROUP"], or ["PT", "GROUP"]
  activePackagesCount: number;
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
  bookingMethod: string;      // from bookedMembers[].method e.g. "5 Studio", "3 Month Ultimate Mindspacer"
  activePackage: ActivePackageDto | null;
}

export interface SessionDto {
  scheduledClassId: string;
  classTitle: string;         // from Classes table via cid lookup
  category: string;           // e.g. "STUDIO"
  startTime: string;          // "HH:mm" e.g. "06:00"
  endTime: string;            // "HH:mm" e.g. "07:00"
  capacity: number;           // availableSlots + bookedMembers.length
  bookedCount: number;        // bookedMembers.length
  clients: CalendarClientDto[];
}

export interface DayDto {
  date: string;               // "YYYY-MM-DD"
  dayName: string;            // "Monday"
  sessions: SessionDto[];
}

export interface ScheduleResponseDto {
  weekStart: string;
  weekEnd: string;
  days: DayDto[];             // always 7 days Mon-Sun, empty days have sessions: []
}
