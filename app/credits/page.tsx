import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export const metadata = {
	title: "Credits | BetterAI",
	description: "Request more credits for your BetterAI account.",
}

export default function CreditsPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				<Card>
					<CardHeader>
						<CardTitle>Credits</CardTitle>
						<CardDescription>Request additional credits or contact support. This is a mockup for now.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium mb-1">Your Email</label>
								<Input placeholder="you@example.com" disabled />
							</div>
							<div>
								<label className="block text-sm font-medium mb-1">Requested Credits</label>
								<Input type="number" min={0} placeholder="100" disabled />
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">Reason</label>
							<Textarea placeholder="Tell us how you'll use the credits (mocked)" rows={4} disabled />
						</div>
					</CardContent>
					<CardFooter className="flex items-center justify-between">
						<Button disabled>Submit Request (Mock)</Button>
						<Link href="/" className="text-sm text-muted-foreground hover:underline">Back to Home</Link>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}


