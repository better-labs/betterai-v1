import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a volume number to display as $##k or $##m format
 * Examples: 34410 -> "$34k", 1996731 -> "$2m", 110017 -> "$110k"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}m`
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}k`
  } else {
    return `$${volume.toFixed(0)}`
  }
}
