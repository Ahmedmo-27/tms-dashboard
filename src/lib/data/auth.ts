"use server";

import { tms } from "@/lib/tms-api";
import { deleteToken, setToken } from "../cookie";
import { isCoachRole } from "@/lib/config/roles";

interface LoginResponsePayload {
  token?: string;
  userId: string;
  role: string;
  name: string;
  [key: string]: unknown;
}

export const login = async ({
  phoneNumber,
  password,
}: {
  phoneNumber: string;
  password: string;
}): Promise<LoginResponsePayload> => {
  try {
    const response = await tms.post("/auth/login", {
      phoneNumber,
      password,
    });
    const loginData = response.data?.data as LoginResponsePayload;

    if (!loginData?.token) {
      throw new Error("Invalid login response");
    }

    await setToken(loginData.token);

    // Staff: never send JWT to the browser (HttpOnly cookie is enough).
    // Coach: return token for in-memory Bearer until API HttpOnly redesign.
    if (isCoachRole(loginData.role)) {
      return loginData;
    }

    const { token: _token, ...safeUser } = loginData;
    return safeUser;
  } catch (error: unknown) {
    const loginError = error instanceof Error ? error : new Error("Login failed");
    console.error("Login error:", loginError.message);
    throw loginError;
  }
};

export const logout = async () => {
  try {
    const response = await tms.get("/auth/logout");
    await deleteToken();
    return response.data.data;
  } catch (error) {
    await deleteToken();
    throw error;
  }
};

export async function getAuthenticatedUser(): Promise<{
  role?: string;
} | null> {
  try {
    const response = await tms.get("/auth/verifyToken");
    return response.data?.data?.user ?? response.data?.user ?? null;
  } catch {
    return null;
  }
}
