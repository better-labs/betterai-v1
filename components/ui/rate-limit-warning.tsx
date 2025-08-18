'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { formatTimeUntilReset } from '@/lib/client/rate-limit-utils';

interface RateLimitWarningProps {
  remaining: number;
  resetTime: Date;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function RateLimitWarning({ 
  remaining, 
  resetTime, 
  className,
  variant = 'default' 
}: RateLimitWarningProps) {
  const timeUntilReset = formatTimeUntilReset(resetTime);
  const isBlocked = remaining === 0;
  
  return (
    <Alert 
      variant={isBlocked ? 'destructive' : variant}
      className={className}
    >
      {isBlocked ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <AlertDescription>
        {isBlocked ? (
          <>Rate limit exceeded. Try again in {timeUntilReset}.</>
        ) : (
          <>
            {remaining} request{remaining !== 1 ? 's' : ''} remaining. 
            Resets in {timeUntilReset}.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

// Compact inline version for buttons/forms
interface RateLimitBadgeProps {
  remaining: number;
  resetTime: Date;
  className?: string;
}

export function RateLimitBadge({ remaining, resetTime, className }: RateLimitBadgeProps) {
  if (remaining > 3) return null; // Only show when low
  
  const timeUntilReset = formatTimeUntilReset(resetTime);
  const isBlocked = remaining === 0;
  
  return (
    <span 
      className={`inline-flex items-center gap-1 text-xs ${
        isBlocked 
          ? 'text-red-600 dark:text-red-400' 
          : 'text-yellow-600 dark:text-yellow-400'
      } ${className}`}
    >
      <Clock className="h-3 w-3" />
      {isBlocked ? (
        `Blocked for ${timeUntilReset}`
      ) : (
        `${remaining} left`
      )}
    </span>
  );
}