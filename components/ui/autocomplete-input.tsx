"use client"

import * as React from "react"
import { PlacePicker } from "@googlemaps/extended-component-library/react"
import type { PlacePicker as PlacePickerWC } from "@googlemaps/extended-component-library/place_picker.js"

interface AutocompleteInputProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void
  className?: string
}

export function AutocompleteInput({ onPlaceSelect, className }: AutocompleteInputProps) {
  const pickerRef = React.useRef<PlacePickerWC>(null)

  React.useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return

    const handlePlaceChange = () => {
      onPlaceSelect(picker.value || null)
    }

    picker.addEventListener("gmp-placechange", handlePlaceChange)

    return () => {
      picker.removeEventListener("gmp-placechange", handlePlaceChange)
    }
  }, [onPlaceSelect])

  return (
    <PlacePicker
      ref={pickerRef}
      placeholder="Search for a town or address..."
      className={className}
    />
  )
}
