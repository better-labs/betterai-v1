"use client"

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Initialize PostHog on the client only
    try {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      });
    } catch (_err) {
      // No-op: avoid crashing the app if PostHog init fails in development
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
