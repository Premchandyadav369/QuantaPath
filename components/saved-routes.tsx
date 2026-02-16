"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, Download } from 'lucide-react'
import type { Session } from '@supabase/supabase-js'
import type { DeliveryStop, OptimizationRequest, RouteResult } from "@/lib/types"

interface SavedRoute {
  id: string
  name: string
  created_at: string
  stops: DeliveryStop[]
  routes: RouteResult[]
  selected_route: RouteResult | null
  quantum_params: any
  classical_params: any
}

interface SavedRoutesProps {
  session: Session | null
  onLoadRoute: (route: SavedRoute) => void
}

export function SavedRoutes({ session, onLoadRoute }: SavedRoutesProps) {
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoutes = useCallback(async () => {
    if (!session) {
      setSavedRoutes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setSavedRoutes(data || [])
    } catch (err: any) {
      setError(err.message)
      console.error("Error fetching routes:", err)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchRoutes()

    const channel = supabase.channel('custom-all-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'routes' },
        (payload) => {
          fetchRoutes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRoutes])

  const deleteRoute = async (id: string) => {
    try {
      const { error } = await supabase.from('routes').delete().eq('id', id)
      if (error) throw error
      setSavedRoutes(savedRoutes.filter(r => r.id !== id))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const exportRoute = (route: SavedRoute) => {
    const dataStr = JSON.stringify(route, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `quantapath-route-${route.name.replace(/\s+/g, '_')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to see your saved routes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Routes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && savedRoutes.length === 0 && (
          <p className="text-muted-foreground">You haven't saved any routes yet.</p>
        )}
        <div className="space-y-4">
          {savedRoutes.map((route) => (
            <div key={route.id} className="p-3 rounded-lg border hover:bg-muted/50 flex justify-between items-center">
              <div>
                <p className="font-medium">{route.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(route.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportRoute(route)}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onLoadRoute(route)}>Load</Button>
                <Button variant="destructive" size="sm" onClick={() => deleteRoute(route.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
