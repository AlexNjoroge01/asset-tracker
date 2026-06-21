import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import type { GpsAccuracyLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getAccuracyLevel(accuracy: number | null): GpsAccuracyLevel {
  if (accuracy === null) return "low";
  if (accuracy < 20) return "high";
  if (accuracy <= 100) return "medium";
  return "low";
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    laptop: "#38BDF8",
    phone: "#4ADE80",
    router: "#FB923C",
    tablet: "#A78BFA",
    other: "#94A3B8",
  };
  return map[category] ?? "#94A3B8";
}
