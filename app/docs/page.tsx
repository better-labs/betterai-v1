'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/docs/auth-guard'

export default function DocsPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/docs/overview/what-is-betterai')
  }, [router])
  
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse h-8 w-32 bg-muted rounded" />
      </div>
    </AuthGuard>
  )
}