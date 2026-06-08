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
  notifications: CoachNotification[];
  schedule: ScheduleResponseDto | null;
  scheduleLoading: boolean;
}

const initialState: CoachState = {
  coachId: null,
  name: null,
  token: null,
  clients: [],
  notifications: [],
  schedule: null,
  scheduleLoading: false,
};

const coachSlice = createSlice({
  name: "coach",
  initialState,
  reducers: {
    setCoachCredentials: (
      state,
      action: PayloadAction<{ token: string; coachId: string; name?: string }>
    ) => {
      state.token = action.payload.token;
      state.coachId = action.payload.coachId;
      if (action.payload.name) {
        state.name = action.payload.name;
      }
    },
    setCoachName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    setCoachClients: (state, action: PayloadAction<CoachClient[]>) => {
      state.clients = action.payload;
    },
    logoutCoach: (state) => {
      state.coachId = null;
      state.name = null;
      state.token = null;
      state.clients = [];
      state.notifications = [];
      state.schedule = null;
      state.scheduleLoading = false;
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
  logoutCoach,
  addNotification,
  markAllNotificationsRead,
  setSchedule,
  clearSchedule,
  setScheduleLoading,
} = coachSlice.actions;

export default coachSlice.reducer;
