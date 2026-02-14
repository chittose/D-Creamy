"use client"

import { useState, useEffect, useCallback } from "react"
import { AdaptiveShell, Header } from "@/components/layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Calendar, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"

interface Transaction {
    id: string
    type: "income" | "expense"
    amount: number
    product_id?: string
    product?: { name: string }
    category: string
    note?: string
    created_at: string
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

type TransactionType = "all" | "income" | "expense"

export default function RiwayatPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<TransactionType>("all")
    const [search, setSearch] = useState("")

    const { warung } = useAuth()
    const supabase = getUntypedSupabaseClient()

    const fetchTransactions = useCallback(async () => {
        if (!warung?.id) return

        setIsLoading(true)
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select(`
                    id,
                    type,
                    amount,
                    category,
                    note,
                    created_at,
                    product:products(name)
                `)
                .eq("warung_id", warung.id)
                .order("created_at", { ascending: false })
                .limit(100) // Limit for performance

            if (error) throw error

            setTransactions((data as any[]) as Transaction[] || [])
        } catch (err) {
            console.error("History fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [warung?.id, supabase])

    useEffect(() => {
        fetchTransactions()
    }, [fetchTransactions])

    const filteredTransactions = transactions.filter((tx) => {
        if (filter !== "all" && tx.type !== filter) return false
        if (search) {
            const searchLower = search.toLowerCase()
            const productName = tx.product?.name || ""
            return (
                productName.toLowerCase().includes(searchLower) ||
                tx.category.toLowerCase().includes(searchLower) ||
                (tx.note && tx.note.toLowerCase().includes(searchLower))
            )
        }
        return true
    })

    // Group by date
    const groupedByDate = filteredTransactions.reduce((acc, tx) => {
        const dateKey = format(new Date(tx.created_at), "yyyy-MM-dd")
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(tx)
        return acc
    }, {} as Record<string, Transaction[]>)

    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Riwayat Transaksi" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Riwayat Transaksi" subtitle="Semua catatan keuangan" />

            <div className="p-4 md:p-6 space-y-4">
                {/* Search & Filter */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari transaksi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={filter} onValueChange={(v) => setFilter(v as TransactionType)}>
                    <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">Semua</TabsTrigger>
                        <TabsTrigger value="income" className="flex-1">Pemasukan</TabsTrigger>
                        <TabsTrigger value="expense" className="flex-1">Pengeluaran</TabsTrigger>
                    </TabsList>

                    <TabsContent value={filter} className="mt-4 space-y-6">
                        {Object.entries(groupedByDate).map(([dateKey, transactions]) => (
                            <div key={dateKey}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {format(new Date(dateKey), "EEEE, d MMMM yyyy", { locale: id })}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <Card key={tx.id} className="card-hover">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                                                        tx.type === "income" ? "bg-income-light" : "bg-expense-light"
                                                    )}>
                                                        <span className="text-lg">
                                                            {tx.type === "income" ? "💰" : "💸"}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate">
                                                            {tx.product?.name || tx.note || tx.category}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {tx.category}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">
                                                                {format(new Date(tx.created_at), "HH:mm")}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className={cn(
                                                        "font-semibold tabular-nums shrink-0",
                                                        tx.type === "income" ? "text-income" : "text-expense"
                                                    )}>
                                                        {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredTransactions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <span className="text-3xl">🔍</span>
                                </div>
                                <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AdaptiveShell>
    )
}
