import axios from "axios";
import { getToken } from "./cookie";
import { ApiError, UnauthorizedError } from "@/core/api-error";

const API_URL =
  process.env.NEXT_PUBLIC_TMS_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

if (!API_URL && typeof window === "undefined") {
  console.warn("NEXT_PUBLIC_TMS_API_URL environment variable is not set");
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

tms.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = ApiError.handle(error);
    if (apiError instanceof UnauthorizedError) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("persist:root");
        } catch {
          /* ignore */
        }
      }
    }
    return Promise.reject(apiError);
  }
);

tms.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch {
      return config;
    }
  },
  (error) => Promise.reject(error)
);
