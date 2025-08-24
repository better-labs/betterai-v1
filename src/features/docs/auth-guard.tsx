'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/src/shared/ui/button'
import { FileText, Lock } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { ready, authenticated, login } = usePrivy()
  
  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse h-8 w-32 bg-muted rounded" />
      </div>
    )
  }
  
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Documentation Access</h1>
              <p className="text-muted-foreground">
                Please sign in to access the BetterAI documentation and user guides.
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
              <h2 className="font-semibold mb-2">What you'll find in our docs:</h2>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Getting started guide</li>
                <li>• How to use AI predictions effectively</li>
                <li>• Understanding prediction markets</li>
                <li>• Terms of service and privacy policy</li>
              </ul>
            </div>
            
            <Button onClick={login} size="lg" className="w-full">
              Sign In to Access Docs
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              New users get 100 free credits daily to try BetterAI
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}