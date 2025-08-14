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

	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

	// Check if appId exists
	if (!appId) {
		if (process.env.NODE_ENV !== "production") {
			console.warn(
				"NEXT_PUBLIC_PRIVY_APP_ID is not set; rendering without PrivyProvider."
			)
		}
		return <>{children}</>
	}

	// Get the client ID from environment variables
	const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID

	// Build the provider props
	const providerProps: any = {
		appId: appId
	}

	// Only add clientId if it's set in environment variables
	if (clientId) {
		providerProps.clientId = clientId
	}

	console.log("Privy app ID:", appId)
	console.log("Privy client ID:", clientId)

	return (
		<PrivyProvider 
			{...providerProps}
			config={{
				appearance: {
					theme: 'light',
					accentColor: '#3B82F6',
					logo: '/betterai-logo-vertical.png'
				},
				// Keep login simple while we debug network issues
				loginMethods: ['email'],
				
				// Add error handling for auth failures
				onError: (error: any) => {
					console.warn('Privy authentication error:', error);
				}
			}}
		>
			{children}
		</PrivyProvider>
	)
}


