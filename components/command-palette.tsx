"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  MapPin,
  Truck,
  Leaf,
  BarChart3
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem>
              <MapPin className="mr-2 h-4 w-4" />
              <span>Map Workspace</span>
            </CommandItem>
            <CommandItem>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Quantum Analytics</span>
            </CommandItem>
            <CommandItem>
              <Truck className="mr-2 h-4 w-4" />
              <span>Fleet Command</span>
            </CommandItem>
             <CommandItem>
              <Leaf className="mr-2 h-4 w-4" />
              <span>Sustainability Dashboard</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem>
              <Calculator className="mr-2 h-4 w-4" />
              <span>Run Optimization</span>
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
             <CommandItem>
              <MapPin className="mr-2 h-4 w-4" />
              <span>Add Stop</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
