// Client-side utilities for handling rate limit responses

export interface RateLimitError {
  error: string;
  remaining: number;
  resetAt: string;
}

export interface RateLimitInfo {
  remaining: number;
  resetTime: Date;
  retryAfterSeconds: number;
}

// Extract rate limit info from response
export const extractRateLimitInfo = (response: Response): RateLimitInfo | null => {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  const retryAfter = response.headers.get('Retry-After');

  if (!remaining || !reset || !retryAfter) return null;

  return {
    remaining: parseInt(remaining),
    resetTime: new Date(parseInt(reset)),
    retryAfterSeconds: parseInt(retryAfter),
  };
};

// Check if response is a rate limit error
export const isRateLimitError = (response: Response): boolean => {
  return response.status === 429;
};

// Get user-friendly rate limit messages
export const getRateLimitMessage = (endpoint: string, resetTime: Date): string => {
  const now = new Date();
  const minutesUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 1000 / 60);
  
  const endpointMessages = {
    predict: `You've used all your AI predictions this hour. ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''} until reset.`,
    user: 'Too many profile updates. Please wait before trying again.',
    markets: 'Too many market operations. Please slow down.',
    events: 'Too many event operations. Please slow down.',
  };

  // Extract endpoint name from URL or use default
  const endpointKey = Object.keys(endpointMessages).find(key => 
    endpoint.includes(key)
  ) || 'default';

  return endpointMessages[endpointKey as keyof typeof endpointMessages] || 
    `Rate limit exceeded. Try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`;
};

// Format time until reset for display
export const formatTimeUntilReset = (resetTime: Date): string => {
  const now = new Date();
  const diff = resetTime.getTime() - now.getTime();
  
  if (diff <= 0) return 'now';
  
  const minutes = Math.ceil(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

// Check if user is close to rate limit (for warnings)
export const isNearRateLimit = (remaining: number, threshold = 3): boolean => {
  return remaining <= threshold && remaining > 0;
};