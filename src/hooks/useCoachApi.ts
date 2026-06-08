"use client";

import { useMemo } from "react";
import axios, { AxiosInstance } from "axios";
import { useAppSelector } from "@/lib/hooks";

const API_URL = process.env.NEXT_PUBLIC_TMS_API_URL as string;

export function useCoachApi(): AxiosInstance {
  const token = useAppSelector((state) => state.coach.token);

  const instance = useMemo(() => {
    const api = axios.create({
      baseURL: API_URL,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return api;
  }, [token]);

  return instance;
}
