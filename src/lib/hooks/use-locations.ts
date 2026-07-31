"use client";

import { useEffect, useState } from "react";
import { getLocations, type Location } from "@/lib/data/locations";

type UseLocationsResult = {
  locations: Location[];
  isLoading: boolean;
  error: boolean;
};

let sharedLocations: Location[] | null = null;
let sharedPromise: Promise<Location[]> | null = null;
let sharedListeners = new Set<() => void>();

function notifyListeners() {
  sharedListeners.forEach((listener) => listener());
}

function loadSharedLocations(): Promise<Location[]> {
  if (sharedLocations) {
    return Promise.resolve(sharedLocations);
  }

  if (!sharedPromise) {
    sharedPromise = getLocations()
      .then((locations) => {
        sharedLocations = locations;
        notifyListeners();
        return locations;
      })
      .catch((error) => {
        sharedPromise = null;
        throw error;
      });
  }

  return sharedPromise;
}

export function useLocations(enabled = true): UseLocationsResult {
  const [locations, setLocations] = useState<Location[]>(sharedLocations ?? []);
  const [isLoading, setIsLoading] = useState(enabled && !sharedLocations);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const sync = () => {
      if (sharedLocations) {
        setLocations(sharedLocations);
        setIsLoading(false);
      }
    };

    sharedListeners.add(sync);
    sync();

    if (sharedLocations) {
      return () => {
        sharedListeners.delete(sync);
      };
    }

    loadSharedLocations()
      .then((fetched) => {
        setLocations(fetched);
        setError(false);
      })
      .catch(() => {
        setError(true);
        setLocations([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      sharedListeners.delete(sync);
    };
  }, [enabled]);

  return { locations, isLoading, error };
}
