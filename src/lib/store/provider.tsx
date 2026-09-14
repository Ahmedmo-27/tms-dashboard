"use client";

import { Provider } from "react-redux";
import { makeStore } from "./store";
import { AuthHydrator } from "@/components/auth-hydrator";

export const store = makeStore();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator />
      {children}
    </Provider>
  );
}
