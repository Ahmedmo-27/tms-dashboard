"use server";

import { tms } from "@/lib/tms-api";
import { deleteToken, setToken } from "../cookie";

interface LoginResponsePayload {
  token: string;
  userId: string;
  role: string;
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
    console.log('Attempting login with:', { phoneNumber, hasPassword: !!password });
    const response = await tms.post("/auth/login", {
      phoneNumber,
      password,
    });
    console.log('Login response received:', response.status);
    const loginData = response.data?.data as LoginResponsePayload;

    if (!loginData?.token) {
      throw new Error("Invalid login response");
    }

    await setToken(loginData.token);
    return loginData;
  } catch (error: unknown) {
    const loginError = error instanceof Error ? error : new Error("Login failed");

    console.error('Login error details:', {
      message: loginError.message,
      type: loginError.constructor.name,
      stack: loginError.stack,
    });
    throw loginError
  }
};

export const logout = async () => {
  try {
    const response = await tms.get("/auth/logout");
    await deleteToken();
    return response.data.data;
  } catch (error) {
    console.log(error)
    throw error;
  }
};
