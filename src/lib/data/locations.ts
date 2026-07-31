import { cache } from "react";
import { tms } from "@/lib/tms-api";
import { withRetry } from "@/lib/utils/retry-request";

export type Location = {
  _id: string;
  branchName: string;
  location: string;
  locationUrl: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

let clientCache: { data: Location[]; at: number } | null = null;
let clientInflight: Promise<Location[]> | null = null;

async function fetchLocationsFromApi(): Promise<Location[]> {
  const response = await withRetry(() => tms.get("/admin/locations"));
  return response.data.data as Location[];
}

const getLocationsServer = cache(fetchLocationsFromApi);

async function getLocationsClient(): Promise<Location[]> {
  const now = Date.now();

  if (clientCache && now - clientCache.at < CACHE_TTL_MS) {
    return clientCache.data;
  }

  if (clientInflight) {
    return clientInflight;
  }

  clientInflight = fetchLocationsFromApi()
    .then((data) => {
      clientCache = { data, at: Date.now() };
      return data;
    })
    .finally(() => {
      clientInflight = null;
    });

  return clientInflight;
}

export const getLocations = async (): Promise<Location[]> => {
  if (typeof window === "undefined") {
    return getLocationsServer();
  }

  return getLocationsClient();
};

/** Clear client-side cache (e.g. after creating a new branch). */
export function invalidateLocationsCache(): void {
  clientCache = null;
}
