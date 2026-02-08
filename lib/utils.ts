import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function headers(): Record<string, string> {
  return {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "API_KEY": process.env.VITE_BASE_API_KEY!,
    "VERSION": "2025-01"
  }
}