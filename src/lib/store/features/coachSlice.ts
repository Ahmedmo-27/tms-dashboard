import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ClientDto, ScheduleResponseDto } from "@/types/coach.types";

export interface CoachNotification {
  id: string;
  memberName: string;
  packageName: string;
  classesTotal: number;
  createdAt: string;
  read: boolean;
}

export type CoachClient = ClientDto;

interface CoachState {
  coachId: string | null;
  name: string | null;
  token: string | null;
  clients: CoachClient[];
  clientsLoading: boolean;
  clientsTotalPages: number;
  notifications: CoachNotification[];
  schedule: ScheduleResponseDto | null;
  scheduleLoading: boolean;
  hasPtSessions: boolean;
  hasScheduledClasses: boolean;
}

const initialState: CoachState = {
  coachId: null,
  name: null,
  token: null,
  clients: [],
  clientsLoading: false,
  clientsTotalPages: 1,
  notifications: [],
  schedule: null,
  scheduleLoading: false,
  hasPtSessions: true, // Default to true so it doesn't immediately hide without knowing
  hasScheduledClasses: true,
};

const coachSlice = createSlice({
  name: "coach",
  initialState,
  reducers: {
    setCoachCredentials: (
      state,
      action: PayloadAction<{ token: string; coachId: string; name?: string; hasPtSessions?: boolean; hasScheduledClasses?: boolean }>
    ) => {
      state.token = action.payload.token;
      state.coachId = action.payload.coachId;
      if (action.payload.name) {
        state.name = action.payload.name;
      }
      if (action.payload.hasPtSessions !== undefined) {
        state.hasPtSessions = action.payload.hasPtSessions;
      }
      if (action.payload.hasScheduledClasses !== undefined) {
        state.hasScheduledClasses = action.payload.hasScheduledClasses;
      }
    },
    setCoachName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setCoachClients: (state, action: PayloadAction<{ clients: CoachClient[]; totalPages: number }>) => {
      state.clients = action.payload.clients;
      state.clientsTotalPages = action.payload.totalPages;
    },
    setClientsLoading: (state, action: PayloadAction<boolean>) => {
      state.clientsLoading = action.payload;
    },
    logoutCoach: (state) => {
      state.coachId = null;
      state.name = null;
      state.token = null;
      state.clients = [];
      state.clientsLoading = false;
      state.clientsTotalPages = 1;
      state.notifications = [];
      state.schedule = null;
      state.scheduleLoading = false;
      state.hasPtSessions = true;
      state.hasScheduledClasses = true;
    },
    addNotification: (
      state,
      action: PayloadAction<Omit<CoachNotification, "id" | "read">>
    ) => {
      state.notifications.unshift({
        ...action.payload,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
      });
    },
    markAllNotificationsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({
        ...n,
        read: true,
      }));
    },
    setSchedule: (state, action: PayloadAction<ScheduleResponseDto>) => {
      state.schedule = action.payload;
    },
    clearSchedule: (state) => {
      state.schedule = null;
    },
    setScheduleLoading: (state, action: PayloadAction<boolean>) => {
      state.scheduleLoading = action.payload;
    },
  },
});

export const {
  setCoachCredentials,
  setCoachName,
  setCoachClients,
  setClientsLoading,
  logoutCoach,
  addNotification,
  markAllNotificationsRead,
  setSchedule,
  clearSchedule,
  setScheduleLoading,
} = coachSlice.actions;

export default coachSlice.reducer;
