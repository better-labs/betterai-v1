"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { usePrivy } from "@privy-io/react-auth"

export function AnalyticsIdentify() {
  const { ready, user, authenticated } = usePrivy()

  useEffect(() => {
    if (!ready) return

    if (authenticated && user) {
      const candidateId =
        (user as any).id ||
        (user as any)?.email?.address ||
        (user as any)?.wallet?.address ||
        posthog.get_distinct_id()

      const anonId = posthog.get_distinct_id()
      if (anonId && candidateId && anonId !== candidateId) {
        // Merge anonymous session with identified user per PostHog docs
        posthog.alias(candidateId)
      }

      posthog.identify(candidateId, {
        email: (user as any)?.email?.address ?? undefined,
        wallet: (user as any)?.wallet?.address ?? undefined,
        name:
          (user as any)?.google?.name ||
          (user as any)?.email?.name ||
          undefined,
      })

      // Now that the user is identified, record a pageview
      posthog.capture("$pageview")
    } else {
      // Clear identity on logout
      posthog.reset()
    }
  }, [ready, authenticated, user])

  return null
}


