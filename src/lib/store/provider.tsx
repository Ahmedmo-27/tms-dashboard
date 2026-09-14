"use client";

import { useMemo } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { AuthHydrator } from "@/components/auth-hydrator";

export const store = makeStore();

export function Providers({ children }: { children: React.ReactNode }) {
  const persistor = useMemo(() => persistStore(store), []);
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthHydrator />
        {children}
      </PersistGate>
    </Provider>
  );
}
