import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MailNotificationItem {
  id: string;
  _id?: string;
  from: string;
  subject: string;
  snippet?: string;
  date: string;
  isRead: boolean;
  recipientUser?: string | null;
}

export function mapEmailToNotificationItem(e: any): MailNotificationItem {
  const id = (e._id || e.id || "").toString();
  let snippet = e.snippet;
  if (!snippet && e.text) {
    snippet = e.text.replace(/\s+/g, " ").trim().slice(0, 120);
  }
  return {
    id,
    _id: id,
    from: e.from || "Unknown",
    subject: e.subject || "(No Subject)",
    snippet: snippet || "",
    date: e.date ? (typeof e.date === "string" ? e.date : new Date(e.date).toISOString()) : new Date().toISOString(),
    isRead: Boolean(e.isRead),
    recipientUser: e.recipientUser ? (e.recipientUser._id || e.recipientUser).toString() : null,
  };
}

interface MailState {
  unreadCount: number;
  notifications: MailNotificationItem[];
}

const initialState: MailState = {
  unreadCount: 0,
  notifications: [],
};

const mailSlice = createSlice({
  name: "mail",
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    incrementUnreadCount: (state, action: PayloadAction<number | undefined>) => {
      const amount = action.payload ?? 1;
      state.unreadCount += amount;
    },
    decrementUnreadCount: (state, action: PayloadAction<number | undefined>) => {
      const amount = action.payload ?? 1;
      state.unreadCount = Math.max(0, state.unreadCount - amount);
    },
    addMailNotification: (state, action: PayloadAction<MailNotificationItem>) => {
      const targetId = action.payload.id || action.payload._id;
      // Check if notification already exists
      const existsIndex = state.notifications.findIndex((n) => (n.id || n._id) === targetId);
      if (existsIndex >= 0) {
        state.notifications[existsIndex] = action.payload;
      } else {
        state.notifications.unshift(action.payload);
        // Keep at most 20 recent notifications in memory
        if (state.notifications.length > 20) {
          state.notifications.pop();
        }
      }
    },
    setMailNotifications: (state, action: PayloadAction<MailNotificationItem[]>) => {
      state.notifications = action.payload.slice(0, 20);
    },
    markMailNotificationRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload || n._id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markMailNotificationUnread: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find((n) => n.id === action.payload || n._id === action.payload);
      if (notif && notif.isRead) {
        notif.isRead = false;
        state.unreadCount += 1;
      }
    },
    markAllMailNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    resetMailState: () => initialState,
  },
});

export const {
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  addMailNotification,
  setMailNotifications,
  markMailNotificationRead,
  markMailNotificationUnread,
  markAllMailNotificationsRead,
  resetMailState,
} = mailSlice.actions;

export default mailSlice.reducer;
