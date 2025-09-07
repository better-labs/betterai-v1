"use client"

import { useEffect } from "react"
import posthog from "posthog-js"
import { usePrivy } from "@privy-io/react-auth"
import { extractUserEmail, extractUsername, extractWalletAddress } from "@/lib/utils/user-data"

export function UserAnalyticsIdentify() {
  const { ready, user, authenticated } = usePrivy()

  useEffect(() => {
    if (!ready) return

    if (authenticated && user) {
      const candidateId =
        (user as any).id ||
        extractUserEmail(user) ||
        extractWalletAddress(user) ||
        posthog.get_distinct_id()

      const anonId = posthog.get_distinct_id()
      if (anonId && candidateId && anonId !== candidateId) {
        // Merge anonymous session with identified user per PostHog docs
        posthog.alias(candidateId)
      }

      posthog.identify(candidateId, {
        email: extractUserEmail(user) ?? undefined,
        wallet: extractWalletAddress(user) ?? undefined,
        name: extractUsername(user) ?? undefined,
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