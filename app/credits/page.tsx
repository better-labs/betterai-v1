'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/hooks/use-user"
import { useQuery } from "@tanstack/react-query"
import { CreditBalance } from "@/lib/services/credit-manager"
import { CreditCard, Calendar, TrendingUp, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function CreditsPage() {
	const { user } = useUser()

	// Fetch user credits
	const { data: creditsData, isLoading } = useQuery({
		queryKey: ['user-credits', user?.id],
		queryFn: async (): Promise<{ credits: CreditBalance }> => {
			const response = await fetch('/api/user/credits')
			if (!response.ok) {
				throw new Error('Failed to fetch credits')
			}
			return response.json()
		},
		enabled: !!user?.id,
		refetchInterval: 30000, // Refetch every 30 seconds
	})

	const credits = creditsData?.credits

	return (
		<main className="container mx-auto px-4 py-8">
			<section className="py-16 mb-24">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<h1 className="mb-6">Credits</h1>
						<p className="text-lg text-muted-foreground">
							Manage your BetterAI prediction credits and usage history.
						</p>
					</div>

					{/* Current Credits Balance */}
					<Card className="mb-8">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CreditCard className="h-5 w-5" />
								Current Balance
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="text-center py-8">
									<div className="animate-pulse">Loading credits...</div>
								</div>
							) : credits ? (
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<div>
											<div className="text-3xl font-bold">{credits.credits}</div>
											<div className="text-sm text-muted-foreground">Available Credits</div>
										</div>
										<div className="text-right">
											{credits.credits < 10 && (
												<Badge variant="destructive" className="mb-2">
													<AlertTriangle className="h-3 w-3 mr-1" />
													Low Credits
												</Badge>
											)}
											<div className="text-sm text-muted-foreground">
												Next reset: {formatDistanceToNow(new Date(credits.creditsLastReset.getTime() + 24 * 60 * 60 * 1000), { addSuffix: true })}
											</div>
										</div>
									</div>

									<Separator />

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="flex items-center gap-3">
											<TrendingUp className="h-4 w-4 text-green-600" />
											<div>
												<div className="font-semibold">{credits.totalCreditsEarned}</div>
												<div className="text-xs text-muted-foreground">Total Earned</div>
											</div>
										</div>
										<div className="flex items-center gap-3">
											<CreditCard className="h-4 w-4 text-red-600" />
											<div>
												<div className="font-semibold">{credits.totalCreditsSpent}</div>
												<div className="text-xs text-muted-foreground">Total Spent</div>
											</div>
										</div>
									</div>
								</div>
							) : (
								<div className="text-center py-8 text-muted-foreground">
									Unable to load credit balance
								</div>
							)}
						</CardContent>
					</Card>

					{/* Credit Information */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Calendar className="h-5 w-5" />
									Daily Reset
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Your credits reset daily to a minimum of 100 credits. Any credits above 100 are preserved.
								</p>
								<div className="text-sm">
									<strong>Last reset:</strong>{' '}
									{credits?.creditsLastReset ? (
										formatDistanceToNow(credits.creditsLastReset, { addSuffix: true })
									) : (
										'Never'
									)}
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Usage</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm text-muted-foreground">
									Each AI model selection costs 1 credit. Credits are used when generating predictions.
								</p>
								<div className="text-sm">
									<strong>Cost per prediction:</strong> 1 credit
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Add Credits Section */}
					{credits && credits.credits < 10 && (
						<Card className="border-orange-200 bg-orange-50/50">
							<CardHeader>
								<CardTitle className="text-orange-800">Low Credit Warning</CardTitle>
								<CardDescription className="text-orange-700">
									You're running low on credits. Consider adding more credits to continue generating predictions.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button className="w-full">
									Add Credits (Coming Soon)
								</Button>
							</CardContent>
						</Card>
					)}
				</div>
			</section>
		</main>
	)
}


