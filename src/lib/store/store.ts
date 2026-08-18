import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import authReducer from "./features/authSlice";
import coachReducer from "./features/coachSlice";

const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: string) {
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    return Promise.resolve();
  },
});

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  coach: coachReducer,
});

type RootReducerState = ReturnType<typeof rootReducer>;

/** Never persist JWTs — coach.token stays memory-only; auth.user must not carry token. */
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "coach"],
  partialize: (state: RootReducerState) => {
    const user = state.auth.user as Record<string, unknown> | null;
    let safeUser = user;
    if (user && "token" in user) {
      const { token: _token, ...rest } = user;
      safeUser = rest;
    }
    return {
      auth: { user: safeUser },
      coach: {
        ...state.coach,
        token: null,
      },
    };
  },
};

export const makeStore = () => {
  return configureStore({
    reducer: persistReducer(persistConfig, rootReducer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
