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

	// Only log in development for debugging
	if (process.env.NODE_ENV !== "production") {
		console.log("Privy app ID:", appId)
	}

	return (
		<PrivyProvider
			appId={appId}
			config={{
				appearance: {
					theme: 'light',
					accentColor: '#3B82F6',
					logo: '/betterai-logo-vertical.png'
				},
				// Keep login simple and disable embedded wallets for all environments
				loginMethods: ['email','google'],
				embeddedWallets: {
					createOnLogin: 'off'
				},
				// Completely disable WalletConnect to prevent double initialization
				walletConnect: {
					projectId: null
				},
				externalWallets: {
					walletConnect: {
						enabled: false
					}
				}
			}}
		>
			{children}
		</PrivyProvider>
	)
}


