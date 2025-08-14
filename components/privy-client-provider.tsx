"use client"

import type { ReactNode } from "react"
import { PrivyProvider } from "@privy-io/react-auth"

type PrivyClientProviderProps = {
	children: ReactNode
}

export function PrivyClientProvider({ children }: PrivyClientProviderProps) {
	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

	if (!appId) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"NEXT_PUBLIC_PRIVY_APP_ID is not set; rendering without PrivyProvider."
			)
		}
		return <>{children}</>
	}

	return (
		<PrivyProvider appId={appId}>
			{children}
		</PrivyProvider>
	)
}


