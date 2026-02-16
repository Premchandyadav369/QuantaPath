import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const lat1Rad = (lat1 * Math.PI) / 180
  const lat2Rad = (lat2 * Math.PI) / 180

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}

export type Direction = "forward" | "left" | "right" | "backward" | "sharp-left" | "sharp-right" | "u-turn" | "straight";

export const getDirection = (currentBearing: number, previousBearing: number): Direction => {
  if (previousBearing === -1) return "forward" // First step

  let angleDiff = currentBearing - previousBearing
  if (angleDiff < -180) angleDiff += 360
  if (angleDiff > 180) angleDiff -= 360

  if (angleDiff >= -22.5 && angleDiff <= 22.5) return "forward"
  if (angleDiff > 22.5 && angleDiff <= 67.5) return "sharp-right"
  if (angleDiff > 67.5 && angleDiff <= 112.5) return "right"
  if (angleDiff > 112.5 && angleDiff <= 157.5) return "backward" // Or U-turn
  if (angleDiff < -22.5 && angleDiff >= -67.5) return "sharp-left"
  if (angleDiff < -67.5 && angleDiff >= -112.5) return "left"
  if (angleDiff < -112.5 && angleDiff >= -157.5) return "backward" // Or U-turn
  return "u-turn"
}
