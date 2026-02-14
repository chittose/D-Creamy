"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type TableName = "transactions" | "products" | "profiles" | "warung"

interface UseRealtimeOptions<T> {
    table: TableName
    filter?: string
    onInsert?: (payload: T) => void
    onUpdate?: (payload: T) => void
    onDelete?: (payload: { old: T }) => void
    enabled?: boolean
}

export function useRealtime<T extends Record<string, unknown>>({
    table,
    filter,
    onInsert,
    onUpdate,
    onDelete,
    enabled = true,
}: UseRealtimeOptions<T>) {
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    // Store callbacks in refs to prevent re-subscription on every render.
    // Without this, inline arrow functions in callers cause the channel
    // to unsubscribe and resubscribe in an infinite loop.
    const onInsertRef = useRef(onInsert)
    const onUpdateRef = useRef(onUpdate)
    const onDeleteRef = useRef(onDelete)

    // Keep refs up to date
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete

    useEffect(() => {
        if (!enabled) return

        const supabase = getSupabaseClient()
        let channel: RealtimeChannel | null = null

        const setupChannel = () => {
            channel = supabase
                .channel(`realtime:${table}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table,
                        filter,
                    },
                    (payload: RealtimePostgresChangesPayload<T>) => {
                        switch (payload.eventType) {
                            case "INSERT":
                                onInsertRef.current?.(payload.new as T)
                                break
                            case "UPDATE":
                                onUpdateRef.current?.(payload.new as T)
                                break
                            case "DELETE":
                                onDeleteRef.current?.({ old: payload.old as T })
                                break
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        setIsConnected(true)
                        setError(null)
                    } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
                        setIsConnected(false)
                    }
                })
        }

        setupChannel()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [table, filter, enabled])

    return { isConnected, error }
}

// Hook for syncing local state with realtime updates
export function useRealtimeList<T extends { id: string }>(
    table: TableName,
    initialData: T[] = [],
    filter?: string
) {
    const [data, setData] = useState<T[]>(initialData)

    const handleInsert = useCallback((newItem: T) => {
        setData((prev) => [newItem, ...prev])
    }, [])

    const handleUpdate = useCallback((updatedItem: T) => {
        setData((prev) =>
            prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
        )
    }, [])

    const handleDelete = useCallback(({ old }: { old: T }) => {
        setData((prev) => prev.filter((item) => item.id !== old.id))
    }, [])

    const { isConnected } = useRealtime<T>({
        table,
        filter,
        onInsert: handleInsert,
        onUpdate: handleUpdate,
        onDelete: handleDelete,
    })

    return { data, setData, isConnected }
}
