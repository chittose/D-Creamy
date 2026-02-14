"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { Product, InsertProduct } from "@/lib/supabase/types"
import { useRealtimeList } from "./use-realtime"

interface UseProductsOptions {
    warungId: string
}

export function useProducts({ warungId }: UseProductsOptions) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const hasFetched = useRef(false)

    const { data: products, setData: setProducts, isConnected } = useRealtimeList<Product>(
        "products",
        [],
        `warung_id=eq.${warungId}`
    )

    // Initial fetch
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true)
            const supabase = getSupabaseClient()
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("warung_id", warungId)
                .eq("is_active", true)
                .order("name")

            if (error) throw error
            setProducts(data || [])
        } catch (err) {
            setError(err as Error)
        } finally {
            setLoading(false)
        }
    }, [warungId, setProducts])

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true
            fetchProducts()
        }
    }, [fetchProducts])

    // Create product
    const createProduct = useCallback(
        async (data: Omit<InsertProduct, "id" | "created_at" | "updated_at" | "warung_id">) => {
            try {
                const supabase = getSupabaseClient()
                const { data: created, error } = await supabase
                    .from("products")
                    .insert({ ...data, warung_id: warungId } as never)
                    .select()
                    .single()

                if (error) throw error
                setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
                return created
            } catch (err) {
                setError(err as Error)
                throw err
            }
        },
        [warungId, setProducts]
    )

    // Update product
    const updateProduct = useCallback(
        async (id: string, updates: Partial<Product>) => {
            try {
                const supabase = getSupabaseClient()
                const { data: updated, error } = await supabase
                    .from("products")
                    .update({ ...updates, updated_at: new Date().toISOString() } as never)
                    .eq("id", id)
                    .select()
                    .single()

                if (error) throw error
                setProducts((prev) =>
                    prev.map((p) => (p.id === id ? updated : p))
                )
                return updated
            } catch (err) {
                setError(err as Error)
                throw err
            }
        },
        [setProducts]
    )

    // Delete product (soft delete by setting is_active = false)
    const deleteProduct = useCallback(
        async (id: string) => {
            try {
                const supabase = getSupabaseClient()
                const { error } = await supabase
                    .from("products")
                    .update({ is_active: false } as never)
                    .eq("id", id)

                if (error) throw error
                setProducts((prev) => prev.filter((p) => p.id !== id))
            } catch (err) {
                setError(err as Error)
                throw err
            }
        },
        [setProducts]
    )

    // Update stock
    const updateStock = useCallback(
        async (id: string, delta: number) => {
            const product = products.find((p) => p.id === id)
            if (!product) return

            const newStock = Math.max(0, product.stock + delta)
            return updateProduct(id, { stock: newStock })
        },
        [products, updateProduct]
    )

    // Get low stock products
    const lowStockProducts = products.filter((p) => p.stock <= 10)

    return {
        products,
        loading,
        error,
        isConnected,
        lowStockProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        updateStock,
        refresh: fetchProducts,
    }
}
