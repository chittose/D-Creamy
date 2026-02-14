"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdaptiveShell, Header, FAB } from "@/components/layout"
import { KPICard, RecentTransactions, QuickAction } from "@/components/dashboard"
import { DailyResetBanner } from "@/components/common"
import { TransactionFormNew } from "@/components/transactions"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { Plus, Wallet, Receipt, TrendingUp } from "lucide-react"
import { getBusinessDayStart } from "@/lib/business-day"

// Define types locally or import from a shared types file
interface Transaction {
    id: string
    type: "income" | "expense"
    payment_method?: string
    amount: number
    product_id?: string
    product?: { name: string }
    category: string
    note?: string
    created_at: string
    profile?: { full_name: string | null }
}

interface DashboardClientProps {
    initialTransactions: Transaction[]
    user: any
    warung: any
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export default function DashboardClient({
    initialTransactions,
    user,
    warung
}: DashboardClientProps) {
    const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
    const [showTransactionForm, setShowTransactionForm] = useState(false)
    const router = useRouter()
    const supabase = getUntypedSupabaseClient()

    // Re-fetch function needed for updates (add/delete transaction)
    const refreshData = async () => {
        if (!warung?.id) return

        try {
            const startDate = getBusinessDayStart()
            const { data, error } = await supabase
                .from("transactions")
                .select(`
          id,
          type,
          payment_method,
          amount,
          category,
          note,
          created_at,
          product:products(name),
          profile:profiles!created_by(full_name)
        `)
                .eq("warung_id", warung.id)
                .gte("created_at", startDate.toISOString())
                .order("created_at", { ascending: false })

            if (error) throw error
            setTransactions((data as any[]) as Transaction[] || [])
            router.refresh() // Refresh server components too
        } catch (err) {
            console.error("Dashboard refresh error:", err)
        }
    }

    // Calculate KPIs based on current state
    const todayIncome = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

    const todayExpense = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

    const todayProfit = todayIncome - todayExpense

    const recentTransactionsFormatted = transactions.slice(0, 5).map(t => ({
        id: t.id,
        type: t.type as "income" | "expense",
        paymentMethod: t.payment_method,
        amount: t.amount,
        product: t.product?.name || t.note || t.category,
        category: t.category,
        createdAt: new Date(t.created_at),
        author: t.profile?.full_name || "User"
    }))

    const hour = new Date().getHours()
    let greeting = "Selamat Datang"
    if (hour < 11) greeting = "Selamat Pagi"
    else if (hour < 15) greeting = "Selamat Siang"
    else if (hour < 18) greeting = "Selamat Sore"
    else greeting = "Selamat Malam"

    return (
        <AdaptiveShell>
            <Header title="Dashboard" />

            <div className="p-4 md:p-6 space-y-6 pb-24 animate-slide-up">
                {/* Greeting Section */}
                <div className="flex flex-col space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">{greeting}, {user?.user_metadata?.full_name || "Owner"} 👋</h2>
                    <p className="text-muted-foreground">
                        Berikut adalah ringkasan performa bisnis hari ini.
                    </p>
                </div>

                <DailyResetBanner />

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                        title="Pemasukan Hari Ini"
                        value={formatRupiah(todayIncome)}
                        icon={<Wallet className="h-6 w-6" />}
                        variant="income"
                    />
                    <KPICard
                        title="Pengeluaran Hari Ini"
                        value={formatRupiah(todayExpense)}
                        icon={<Receipt className="h-6 w-6" />}
                        variant="expense"
                    />
                    <KPICard
                        title="Keuntungan Bersih"
                        value={formatRupiah(todayProfit)}
                        icon={<TrendingUp className="h-6 w-6" />}
                        variant={todayProfit >= 0 ? "income" : "expense"}
                    />
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-semibold mb-3">Aksi Cepat</h2>
                    <QuickAction
                        onSaleClick={() => router.push("/transaksi")}
                        onExpenseClick={() => setShowTransactionForm(true)}
                    />
                </div>

                {/* Recent Transactions */}
                <RecentTransactions
                    transactions={recentTransactionsFormatted}
                    onAddTransaction={() => setShowTransactionForm(true)}
                    onDelete={async (id) => {
                        if (!confirm("Hapus transaksi ini?")) return
                        try {
                            const { error } = await supabase.from('transactions').delete().eq('id', id)
                            if (error) throw error
                            refreshData()
                        } catch (err) {
                            console.error("Delete error:", err)
                            alert("Gagal menghapus transaksi")
                        }
                    }}
                />
            </div>

            <FAB
                icon={<Plus className="h-6 w-6" />}
                onClick={() => setShowTransactionForm(true)}
            />

            {warung && user && (
                <TransactionFormNew
                    open={showTransactionForm}
                    onClose={() => setShowTransactionForm(false)}
                    onSuccess={refreshData}
                    warungId={warung.id}
                    userId={user.id}
                />
            )}
        </AdaptiveShell>
    )
}
