"use client"

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useState } from "react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize PostHog on the client only
    const initPostHog = async () => {
      try {
        // Only initialize if we have a key and we're on the client
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
          posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host:
              process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
            capture_exceptions: true,
            debug: false, // Disable debug to reduce console noise
            loaded: () => {
              setIsInitialized(true);
            },
            // Selective feature disabling for development
            capture_pageview: true,
            capture_pageleave: true,
            enable_recording_console_log: false,
            session_recording: {
              enabled: false
            },
            autocapture: {
              web_vitals: false, // Disable Web Vitals 
              css_selector_allowlist: [], // Minimal autocapture
              url_allowlist: []
            },
            // Disable specific external script loading instead of all
            disable_surveys: true,
            disable_external_dependency_loading: false, // Allow core functionality
            advanced_disable_decide: process.env.NODE_ENV === "development", // Disable feature flag fetching in dev
            persistence: process.env.NODE_ENV === "development" ? "memory" : "localStorage" // Use memory storage in dev
          });
        } else {
          // If no key, just set as initialized to render children
          setIsInitialized(true);
        }
      } catch (err) {
        console.warn('PostHog initialization failed:', err);
        // Still render children even if PostHog fails
        setIsInitialized(true);
      }
    };

    initPostHog();
  }, []);

  // Don't render the PHProvider until PostHog is initialized or we're sure it won't be
  if (!isInitialized) {
    return <>{children}</>;
  }

  // Only use PHProvider if PostHog is actually initialized
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && posthog.__loaded) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }

  // Fallback: just render children without PostHog
  return <>{children}</>;
}
