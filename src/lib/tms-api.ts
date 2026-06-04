import axios from "axios";
import { getToken } from "./cookie";
import { ApiError, UnauthorizedError } from "@/core/api-error";
import { deleteToken } from "./cookie";

const API_URL = process.env.NEXT_PUBLIC_TMS_API_URL as string;

console.log("TMS API Configuration:", {
  API_URL,
  NODE_ENV: process.env.NODE_ENV,
  isServer: typeof window === "undefined",
});

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_TMS_API_URL environment variable is not set");
}

export const tms = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

// ✅ RESPONSE INTERCEPTOR
// RESPONSE INTERCEPTOR
tms.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = ApiError.handle(error);
    if (apiError instanceof UnauthorizedError) {
      console.log("Server Logout");
    }
    return Promise.reject(apiError);
  }
);

// ✅ REQUEST INTERCEPTOR
tms.interceptors.request.use(
  async (config) => {
    try {
      console.log("Request interceptor called:", {
        url: config.url,
        method: config.method,
        isServer: typeof window === "undefined",
      });

      // Always try to get token (handles server-side auth)
      const token = await getToken();
      console.log("Token retrieved:", {
        hasToken: !!token,
        tokenLength: token?.length,
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      console.error("Failed to get token:", error);
      return config; // still return config to allow request to go through
    }
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);
