"use server";

import { tms } from "@/lib/tms-api";
import { deleteToken, setToken } from "../cookie";
export const login = async ({
  phoneNumber,
  password,
}: {
  phoneNumber: string;
  password: string;
}) => {
  try {
    console.log('Attempting login with:', { phoneNumber, hasPassword: !!password });
    const response = await tms.post("/auth/login", {
      phoneNumber,
      password,
    });
    console.log('Login response received:', response.status);
    const resData = response.data;
    await setToken(resData.data.token);
    return resData.data.user;
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      type: error.constructor.name,
      context: error.context || 'No context',
      stack: error.stack
    });
    throw error
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
