"use client";
import * as React from "react";

export function useHydrationMismatchCatcher() {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return {
    isHydrated,
    debugProps: (props: any) => {
      if (typeof window === 'undefined') {
        console.log('Server Props:', props);
      } else if (isHydrated) {
        console.log('Client Props:', props);
      }
    }
  };
}