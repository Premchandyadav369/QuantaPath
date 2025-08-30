"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface AutocompleteInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
}

export function AutocompleteInput({
  onPlaceSelect,
  ...props
}: AutocompleteInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(
    null
  )

  React.useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error("Google Maps JavaScript API with Places library is not loaded.")
      return
    }

    if (inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          fields: ["address_components", "geometry", "icon", "name"],
        }
      )

      autocompleteRef.current.addListener("place_changed", () => {
        if (autocompleteRef.current) {
          const place = autocompleteRef.current.getPlace()
          if (place.geometry) {
            onPlaceSelect(place)
          }
        }
      })
    }
  }, [onPlaceSelect])

  return <Input ref={inputRef} {...props} />
}
