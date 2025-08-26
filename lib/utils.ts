import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Polyline decoding utility for Google Maps
export function decodePolyline(encoded: string): [number, number][] {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates = [];
  let shift = 0,
    result = 0;
  let byte,
    lat_change,
    lng_change;

  while (index < encoded.length) {
    byte = null;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat_change = (result & 1) ? ~(result >> 1) : (result >> 1);

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng_change = (result & 1) ? ~(result >> 1) : (result >> 1);

    lat += lat_change;
    lng += lng_change;

    coordinates.push([lng / 1e5, lat / 1e5]);
  }
  return coordinates;
}
