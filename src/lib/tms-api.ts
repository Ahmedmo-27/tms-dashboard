import axios from "axios";
import { getToken, deleteToken } from "./cookie";
import { ApiError, UnauthorizedError } from "@/core/api-error";

const API_URL = process.env.NEXT_PUBLIC_TMS_API_URL as string;

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

let handlingUnauthorized = false;

tms.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = ApiError.handle(error);
    if (apiError instanceof UnauthorizedError && !handlingUnauthorized) {
      handlingUnauthorized = true;
      try {
        if (typeof window === "undefined") {
          await deleteToken();
        } else {
          // Clear client session markers; HttpOnly cookie cleared via logout route when possible
          try {
            localStorage.removeItem("persist:root");
          } catch {
            /* ignore */
          }
          if (!window.location.pathname.startsWith("/login")) {
            window.location.assign("/login");
          }
        }
      } finally {
        handlingUnauthorized = false;
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
