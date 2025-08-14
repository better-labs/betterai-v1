import { Loader2 } from "lucide-react"

type LoadingCardProps = {
  message?: string
}

export function LoadingCard({ message = "Loading…" }: LoadingCardProps) {
  return (
    <div className="border rounded-lg p-12 text-center bg-card">
      <div className="flex items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="text-2xl font-semibold text-muted-foreground">{message}</div>
      </div>
    </div>
  )
}


