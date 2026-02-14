"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { AdaptiveShell, Header } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
    Trash2,
    CalendarDays
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { useAuth } from "@/lib/auth/auth-context"
import { getUntypedSupabaseClient } from "@/lib/supabase/client"
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, subWeeks, format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from "date-fns"
import { id } from "date-fns/locale"

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

function formatCompact(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}jt`
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}rb`
    }
    return amount.toString()
}

type Period = "today" | "7days" | "30days" | "custom"

function toLocalDateString(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

export default function LaporanPage() {
    const [period, setPeriod] = useState<Period>("7days")
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [customStart, setCustomStart] = useState(toLocalDateString(subDays(new Date(), 7)))
    const [customEnd, setCustomEnd] = useState(toLocalDateString(new Date()))

    const { warung, isLoading: authLoading } = useAuth()
    const supabase = getUntypedSupabaseClient()

    const fetchTransactions = useCallback(async () => {
        if (!warung?.id) return

        setIsLoading(true)
        try {
            const now = new Date()
            let startDate: Date
            let endDate: Date = endOfDay(now)

            if (period === "today") {
                startDate = startOfDay(now)
            } else if (period === "7days") {
                startDate = startOfDay(subDays(now, 6))
            } else if (period === "30days") {
                startDate = startOfDay(subDays(now, 29))
            } else {
                // custom
                startDate = startOfDay(new Date(customStart))
                endDate = endOfDay(new Date(customEnd))
            }

            const { data, error } = await supabase
                .from("transactions")
                .select(`
                    id, type, amount, category, created_at,
                    product:products(name)
                `)
                .eq("warung_id", warung.id)
                .gte("created_at", startDate.toISOString())
                .lte("created_at", endDate.toISOString())
                .order("created_at", { ascending: true })

            if (error) throw error
            setTransactions(data || [])
        } catch (err) {
            console.error("Reports fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [warung?.id, period, customStart, customEnd, supabase])

    useEffect(() => {
        if (warung?.id) {
            fetchTransactions()
        } else if (!authLoading) {
            setIsLoading(false)
        }
    }, [fetchTransactions, warung, authLoading])

    // Process Data
    const processedData = useMemo(() => {
        if (!transactions.length) return {
            summary: { income: 0, expense: 0, profit: 0, margin: 0 },
            chartData: [],
            topProducts: [],
            categoryData: []
        }

        const today = new Date()
        let filteredTx = transactions

        // Filter based on selected period view if needed, but currently we show trend
        // Let's calculate totals for the VIEWABLE range

        const totalIncome = filteredTx
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0)

        const totalExpense = filteredTx
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0)

        const totalProfit = totalIncome - totalExpense
        const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100).toFixed(1) : "0"

        // Prepare Chart Data based on period
        let chartData: any[] = []
        const now = new Date()

        if (period === 'today') {
            // Group by hour for today
            const hours = Array.from({ length: 24 }, (_, i) => i)
            chartData = hours.map(hour => {
                const hourTx = filteredTx.filter(t => {
                    const d = parseISO(t.created_at)
                    return isSameDay(d, now) && d.getHours() === hour
                })
                const inc = hourTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                const exp = hourTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return { day: `${String(hour).padStart(2, '0')}:00`, income: inc, expense: exp }
            }).filter((_, i) => i >= 6 && i <= 23) // Only show 06:00 - 23:00
        } else if (period === '7days') {
            const days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date()
                d.setDate(d.getDate() - (6 - i))
                return d
            })
            chartData = days.map(day => {
                const dayTx = filteredTx.filter(t => isSameDay(parseISO(t.created_at), day))
                const inc = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                const exp = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return { day: format(day, 'EEE dd/MM', { locale: id }), income: inc, expense: exp }
            })
        } else if (period === '30days') {
            // Group by week for 30 days
            const days = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i))
            chartData = days.map(day => {
                const dayTx = filteredTx.filter(t => isSameDay(parseISO(t.created_at), day))
                const inc = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                const exp = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return { day: format(day, 'dd/MM'), income: inc, expense: exp }
            })
        } else {
            // Custom range
            const start = startOfDay(new Date(customStart))
            const end = endOfDay(new Date(customEnd))
            const totalDays = differenceInDays(end, start) + 1
            const days = eachDayOfInterval({ start, end })
            chartData = days.map(day => {
                const dayTx = filteredTx.filter(t => isSameDay(parseISO(t.created_at), day))
                const inc = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
                const exp = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
                return { day: format(day, totalDays > 14 ? 'dd/MM' : 'EEE dd/MM', { locale: id }), income: inc, expense: exp }
            })
        }

        // Top Products
        const productSales: Record<string, { name: string, sales: number, revenue: number }> = {}
        filteredTx.filter(t => t.type === 'income' && t.product).forEach(t => {
            const name = t.product.name
            if (!productSales[name]) productSales[name] = { name, sales: 0, revenue: 0 }
            productSales[name].sales += 1 // Assuming qty 1 for simplified manual view, or need quantity field from DB
            productSales[name].revenue += t.amount
        })
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p, i) => ({ ...p, rank: i + 1 }))

        // Categories
        const catMap: Record<string, number> = {}
        filteredTx.filter(t => t.type === 'income').forEach(t => {
            const cat = t.category || "Lainnya"
            if (!catMap[cat]) catMap[cat] = 0
            catMap[cat] += t.amount
        })
        const COLORS = ["#8B4513", "#9370DB", "#228B22", "#DC143C", "#F59E0B", "#3B82F6"]
        const categoryData = Object.entries(catMap)
            .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
            .sort((a, b) => b.value - a.value)

        return {
            summary: { income: totalIncome, expense: totalExpense, profit: totalProfit, margin: profitMargin },
            chartData,
            topProducts,
            categoryData
        }

    }, [transactions, period, customStart, customEnd])


    if (isLoading) {
        return (
            <AdaptiveShell>
                <Header title="Laporan" />
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AdaptiveShell>
        )
    }

    return (
        <AdaptiveShell>
            <Header title="Laporan" subtitle="Analisis keuangan warung">
                <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                </Button>
            </Header>

            <div className="p-4 md:p-6 space-y-6">
                {/* Period Tabs */}
                <div className="flex flex-wrap items-end gap-4">
                    <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
                        <TabsList>
                            <TabsTrigger value="today">Hari Ini</TabsTrigger>
                            <TabsTrigger value="7days">7 Hari</TabsTrigger>
                            <TabsTrigger value="30days">30 Hari</TabsTrigger>
                            <TabsTrigger value="custom" className="gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Custom
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {period === "custom" && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <span className="text-sm text-muted-foreground">s/d</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-xs">Total Pendapatan</span>
                            </div>
                            <p className="text-xl font-bold text-income tabular-nums">
                                {formatRupiah(processedData.summary.income)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <TrendingDown className="h-4 w-4" />
                                <span className="text-xs">Total Pengeluaran</span>
                            </div>
                            <p className="text-xl font-bold text-expense tabular-nums">
                                {formatRupiah(processedData.summary.expense)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs">Profit Bersih</span>
                            </div>
                            <p className={cn(
                                "text-xl font-bold tabular-nums",
                                processedData.summary.profit >= 0 ? "text-income" : "text-expense"
                            )}>
                                {formatRupiah(processedData.summary.profit)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                <ShoppingCart className="h-4 w-4" />
                                <span className="text-xs">Margin Profit</span>
                            </div>
                            <p className="text-xl font-bold tabular-nums">
                                {processedData.summary.margin}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income vs Expense Chart */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Pemasukan vs Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={processedData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                        <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCompact} stroke="var(--muted-foreground)" />
                                        <Tooltip
                                            formatter={(value) => formatRupiah(Number(value) || 0)}
                                            contentStyle={{
                                                backgroundColor: "var(--card)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                        <Bar dataKey="income" name="Pemasukan" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expense" name="Pengeluaran" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Breakdown Kategori (Income)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={processedData.categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {processedData.categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatRupiah(Number(value) || 0)}
                                            contentStyle={{
                                                backgroundColor: "var(--card)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {processedData.categoryData.map((cat) => (
                                    <div key={cat.name} className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-xs text-muted-foreground">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History Section */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Riwayat Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Belum ada data transaksi pada periode ini</p>
                            ) : (
                                <div className="rounded-md border">
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full caption-bottom text-sm">
                                            <thead className="[&_tr]:border-b">
                                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tanggal</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Keterangan</th>
                                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kategori</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Jumlah</th>
                                                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="[&_tr:last-child]:border-0">
                                                {transactions.slice().reverse().map((t) => (
                                                    <tr key={t.id} className="border-b transition-colors hover:bg-muted/50">
                                                        <td className="p-4 align-middle">
                                                            {format(parseISO(t.created_at), "dd MMM yyyy, HH:mm", { locale: id })}
                                                        </td>
                                                        <td className="p-4 align-middle font-medium">
                                                            {t.product?.name || "Transaksi Manual"}
                                                        </td>
                                                        <td className="p-4 align-middle">
                                                            <span className={cn(
                                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                                                t.type === 'income'
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                            )}>
                                                                {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                                                            </span>
                                                        </td>
                                                        <td className={cn(
                                                            "p-4 align-middle text-right font-medium",
                                                            t.type === 'income' ? "text-income" : "text-expense"
                                                        )}>
                                                            {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                                                        </td>
                                                        <td className="p-4 align-middle text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={async () => {
                                                                    if (!confirm("Yakin ingin menghapus transaksi ini? Data tidak bisa dikembalikan.")) return

                                                                    try {
                                                                        const { error } = await supabase
                                                                            .from('transactions')
                                                                            .delete()
                                                                            .eq('id', t.id)

                                                                        if (error) throw error

                                                                        // Optimistic update or refetch
                                                                        setTransactions(prev => prev.filter(item => item.id !== t.id))
                                                                    } catch (err) {
                                                                        console.error("Delete error:", err)
                                                                        alert("Gagal menghapus transaksi")
                                                                    }
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdaptiveShell>
    )
}
