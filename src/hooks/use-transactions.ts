"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Transaction, InsertTransaction } from "@/lib/supabase/types"
import { useOffline } from "./use-offline"
import { useRealtimeList } from "./use-realtime"

interface UseTransactionsOptions {
    warungId: string
    userId: string
    limit?: number
}

export function useTransactions({ warungId, userId, limit = 50 }: UseTransactionsOptions) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const { isOffline, addToQueue, getQueue, removeFromQueue } = useOffline()
    const hasFetched = useRef(false)

    const { data: transactions, setData: setTransactions, isConnected } = useRealtimeList<Transaction>(
        "transactions",
        [],
        `warung_id=eq.${warungId}`
    )

    // Initial fetch
    const fetchTransactions = useCallback(async () => {
        if (isOffline) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const supabase = getSupabaseClient()
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("warung_id", warungId)
                .order("created_at", { ascending: false })
                .limit(limit)

            if (error) throw error
            setTransactions(data || [])
        } catch (err) {
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [warungId, limit, isOffline, setTransactions])

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true
            fetchTransactions()
        }
    }, [fetchTransactions])

    // Create transaction
    const createTransaction = useCallback(
        async (data: Omit<InsertTransaction, "id" | "created_at" | "warung_id" | "created_by">) => {
            const transaction: InsertTransaction = {
                ...data,
                warung_id: warungId,
                created_by: userId,
            }

            if (isOffline) {
                // Queue for later sync
                addToQueue({
                    type: "create",
                    table: "transactions",
                    data: transaction as Record<string, unknown>,
                })
                // Optimistic update with temp ID
                const tempTransaction: Transaction = {
                    ...transaction,
                    id: `temp-${Date.now()}`,
                    created_at: new Date().toISOString(),
                } as Transaction
                setTransactions((prev) => [tempTransaction, ...prev])
                return tempTransaction
            }

            try {
                const supabase = getSupabaseClient()
                const { data: created, error } = await supabase
                    .from("transactions")
                    .insert(transaction as never)
                    .select()
                    .single()

                if (error) throw error
                // Realtime will handle the update, but we can optimistically add
                setTransactions((prev) => [created, ...prev])
                return created
            } catch (err) {
                setError(err as Error)
                throw err
            }
        },
        [warungId, isOffline, addToQueue, setTransactions]
    )

    // Delete transaction
    const deleteTransaction = useCallback(
        async (id: string) => {
            if (isOffline) {
                addToQueue({
                    type: "delete",
                    table: "transactions",
                    data: { id },
                })
                setTransactions((prev) => prev.filter((t) => t.id !== id))
                return
            }

            try {
                const supabase = getSupabaseClient()
                const { error } = await supabase
                    .from("transactions")
                    .delete()
                    .eq("id", id)

                if (error) throw error
                setTransactions((prev) => prev.filter((t) => t.id !== id))
            } catch (err) {
                setError(err as Error)
                throw err
            }
        },
        [isOffline, addToQueue, setTransactions]
    )

    // Sync queued actions when back online
    const syncQueue = useCallback(async () => {
        const queue = getQueue()
        if (queue.length === 0) return

        const supabase = getSupabaseClient()

        for (const action of queue) {
            try {
                if (action.table === "transactions") {
                    if (action.type === "create") {
                        await supabase.from("transactions").insert(action.data as never)
                    } else if (action.type === "delete") {
                        await supabase.from("transactions").delete().eq("id", action.data.id as string)
                    }
                }
                removeFromQueue(action.id)
            } catch (err) {
                console.error("Failed to sync action:", action, err)
            }
        }

        // Refresh data after sync
        await fetchTransactions()
    }, [getQueue, removeFromQueue, fetchTransactions])

    return {
        transactions,
        loading,
        error,
        isConnected,
        isOffline,
        createTransaction,
        deleteTransaction,
        syncQueue,
        refresh: fetchTransactions,
    }
}

