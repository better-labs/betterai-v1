"use client"

import type { ReactNode } from "react"
import { PrivyProvider } from "@privy-io/react-auth"
import { useEffect, useState } from "react"

type PrivyClientProviderProps = {
	children: ReactNode
}

export function PrivyClientProvider({ children }: PrivyClientProviderProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	// Don't render PrivyProvider during SSR or before hydration
	if (!mounted) {
		return <>{children}</>
	}

	const appId = process.env.PRIVY_PUBLIC_APP_ID

	// Check if appId exists
	if (!appId) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"PRIVY_PUBLIC_APP_ID is not set; rendering without PrivyProvider."
			)
		}
		return <>{children}</>
	}

	console.log("Privy app ID:", appId)

	return (
		<PrivyProvider 
			appId={appId}
			config={{
				appearance: {
					theme: 'light',
					accentColor: '#3B82F6',
					logo: '/betterai-logo-vertical.png'
				},
				// Keep login simple while we debug network issues
				loginMethods: ['email','google']
			}}
		>
			{children}
		</PrivyProvider>
	)
}


