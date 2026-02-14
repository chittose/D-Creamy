"use client"

import { useState, useEffect, useCallback } from "react"

interface OfflineState {
    isOnline: boolean
    isOffline: boolean
    wasOffline: boolean
}

interface QueuedAction {
    id: string
    type: "create" | "update" | "delete"
    table: string
    data: Record<string, unknown>
    timestamp: number
}

const QUEUE_KEY = "dcreamy_offline_queue"

export function useOffline() {
    const [state, setState] = useState<OfflineState>({
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
        isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
        wasOffline: false,
    })

    const [queueLength, setQueueLength] = useState(0)

    // Initialize queue length from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem(QUEUE_KEY)
            setQueueLength(stored ? JSON.parse(stored).length : 0)
        }
    }, [])

    useEffect(() => {
        const handleOnline = () => {
            setState((prev) => ({
                isOnline: true,
                isOffline: false,
                wasOffline: prev.isOffline,
            }))
        }

        const handleOffline = () => {
            setState({
                isOnline: false,
                isOffline: true,
                wasOffline: false,
            })
        }

        window.addEventListener("online", handleOnline)
        window.addEventListener("offline", handleOffline)

        return () => {
            window.removeEventListener("online", handleOnline)
            window.removeEventListener("offline", handleOffline)
        }
    }, [])

    // Queue management
    const getQueue = useCallback((): QueuedAction[] => {
        if (typeof window === "undefined") return []
        const stored = localStorage.getItem(QUEUE_KEY)
        return stored ? JSON.parse(stored) : []
    }, [])

    const addToQueue = useCallback((action: Omit<QueuedAction, "id" | "timestamp">) => {
        const queue = getQueue()
        const newAction: QueuedAction = {
            ...action,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        }
        queue.push(newAction)
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
        setQueueLength(queue.length)
        return newAction.id
    }, [getQueue])

    const removeFromQueue = useCallback((id: string) => {
        const queue = getQueue().filter((a) => a.id !== id)
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
        setQueueLength(queue.length)
    }, [getQueue])

    const clearQueue = useCallback(() => {
        localStorage.removeItem(QUEUE_KEY)
        setQueueLength(0)
    }, [])

    return {
        ...state,
        getQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        queueLength,
    }
}

