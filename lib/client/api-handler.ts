// Reusable API response handler with rate limiting support and TanStack Query integration
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  isRateLimitError, 
  extractRateLimitInfo, 
  getRateLimitMessage,
  isNearRateLimit 
} from './rate-limit-utils';

export interface ApiHandlerOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showRateLimitToast?: boolean;
  onRateLimit?: (resetTime: Date) => void;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

// Enhanced fetch wrapper with rate limiting handling
export const apiRequest = async (
  url: string,
  options: RequestInit = {},
  handlerOptions: ApiHandlerOptions = {}
): Promise<any> => {
  const {
    showSuccessToast = false,
    successMessage,
    showRateLimitToast = true,
    onRateLimit,
    onSuccess,
    onError
  } = handlerOptions;

  try {
    const response = await fetch(url, options);
    
    // Handle rate limiting
    if (isRateLimitError(response)) {
      const rateLimitInfo = extractRateLimitInfo(response);
      const errorData: any = await response.json().catch(() => ({}));
      
      const message = getRateLimitMessage(url, rateLimitInfo?.resetTime || new Date());
      
      if (showRateLimitToast) {
        toast.error(message, {
          duration: 8000, // Longer duration for rate limit messages
        });
      }
      
      if (onRateLimit && rateLimitInfo) {
        onRateLimit(rateLimitInfo.resetTime);
      }
      
      throw new Error(message);
    }
    
    // Handle other errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${response.status}`;
      
      if (onError) {
        onError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle success
    const data = await response.json();
    
    // Check for rate limit warnings (when remaining is low)
    const rateLimitInfo = extractRateLimitInfo(response);
    if (rateLimitInfo && isNearRateLimit(rateLimitInfo.remaining)) {
      toast.warning(
        `${rateLimitInfo.remaining} request${rateLimitInfo.remaining !== 1 ? 's' : ''} remaining this hour`,
        { duration: 4000 }
      );
    }
    
    if (showSuccessToast) {
      toast.success(successMessage || 'Request completed successfully');
    }
    
    if (onSuccess) {
      onSuccess(data);
    }
    
    return data;
    
  } catch (error) {
    // Re-throw rate limit errors as-is
    if (error instanceof Error && error.message.includes('rate limit')) {
      throw error;
    }
    
    // Handle network/other errors
    const errorMessage = error instanceof Error ? error.message : 'Request failed';
    
    if (onError) {
      onError(errorMessage);
    } else if (!showRateLimitToast) { // Don't double-toast
      toast.error(errorMessage);
    }
    
    throw error;
  }
};

// Convenience methods for common HTTP verbs
export const apiGet = (url: string, options: ApiHandlerOptions = {}) => 
  apiRequest(url, { method: 'GET' }, options);

export const apiPost = (url: string, body: any, options: ApiHandlerOptions = {}) =>
  apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, options);

export const apiPut = (url: string, body: any, options: ApiHandlerOptions = {}) =>
  apiRequest(url, {
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, options);

export const apiDelete = (url: string, options: ApiHandlerOptions = {}) =>
  apiRequest(url, { method: 'DELETE' }, options);

// TanStack Query hooks for common API patterns
export interface UseApiQueryOptions extends ApiHandlerOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number;
}

export function useApiQuery<T = any>(
  queryKey: string[],
  url: string,
  options: UseApiQueryOptions = {}
) {
  const { enabled = true, staleTime, gcTime, refetchInterval, ...handlerOptions } = options;
  
  return useQuery({
    queryKey,
    queryFn: () => apiGet(url, handlerOptions),
    enabled,
    staleTime,
    gcTime,
    refetchInterval,
  });
}

export interface UseApiMutationOptions extends Omit<ApiHandlerOptions, 'onSuccess' | 'onError'> {
  onSuccess?: (data: any, variables: any) => void;
  onError?: (error: Error, variables: any) => void;
}

export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions = {}
) {
  const { onSuccess, onError, ...handlerOptions } = options;
  
  return useMutation({
    mutationFn,
    onSuccess,
    onError,
  });
}

// Convenience hooks for common HTTP methods
export function useApiPost<TData = any, TVariables = any>(
  options: UseApiMutationOptions = {}
) {
  const { onSuccess, onError, ...handlerOptions } = options;
  return useApiMutation<TData, { url: string; body: TVariables }>(
    ({ url, body }) => apiPost(url, body, handlerOptions),
    { onSuccess, onError }
  );
}

export function useApiPut<TData = any, TVariables = any>(
  options: UseApiMutationOptions = {}
) {
  const { onSuccess, onError, ...handlerOptions } = options;
  return useApiMutation<TData, { url: string; body: TVariables }>(
    ({ url, body }) => apiPut(url, body, handlerOptions),
    { onSuccess, onError }
  );
}

export function useApiDelete<TData = any>(
  options: UseApiMutationOptions = {}
) {
  const { onSuccess, onError, ...handlerOptions } = options;
  return useApiMutation<TData, { url: string }>(
    ({ url }) => apiDelete(url, handlerOptions),
    { onSuccess, onError }
  );
}