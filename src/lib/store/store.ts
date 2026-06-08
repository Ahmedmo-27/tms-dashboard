import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "@reduxjs/toolkit";
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from "./features/authSlice";
import coachReducer from "./features/coachSlice";

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'coach']
}

const rootReducer = combineReducers({
  auth: authReducer,
  coach: coachReducer,
});

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
