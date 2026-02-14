"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"

interface Transaction {
    id: string
    type: "income" | "expense"
    amount: number
    paymentMethod?: string
    product?: string
    category: string
    note?: string
    createdAt: Date
    author?: string
}

import { EmptyState } from "@/components/ui/empty-state"
import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecentTransactionsProps {
    transactions: Transaction[]
    className?: string
    onDelete?: (id: string) => void
    onAddTransaction?: () => void
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function RecentTransactions({ transactions, className, onDelete, onAddTransaction }: RecentTransactionsProps) {
    if (transactions.length === 0) {
        return (
            <EmptyState
                title="Belum Ada Transaksi"
                description="Hari ini belum ada pemasukan atau pengeluaran. Yuk catat transaksi pertamamu!"
                action={onAddTransaction ? {
                    label: "Tambah Transaksi",
                    onClick: onAddTransaction
                } : undefined}
                className="mt-6"
            />
        )
    }

    return (
        <Card className={cn("glass", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {transactions.length} hari ini
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {transactions.map((tx) => (
                    <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                        <div className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                            tx.type === "income" ? "bg-income-light" : "bg-expense-light"
                        )}>
                            <span className="text-lg">
                                {tx.type === "income" ? "💰" : "💸"}
                            </span>
                        </div>



                        <div className="flex-1 min-w-0 cursor-pointer">
                            <div className="flex items-center gap-2">
                                <p className="font-medium truncate">
                                    {tx.product || tx.category}
                                </p>
                                {tx.type === "income" && tx.paymentMethod && (
                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] uppercase tracking-wide bg-background">
                                        {tx.paymentMethod === "qris" ? "QRIS" : "Cash"}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                                {tx.note || formatDistanceToNow(tx.createdAt, {
                                    addSuffix: true,
                                    locale: id
                                })}
                                {tx.author && (
                                    <span className="ml-2 inline-flex items-center text-xs text-primary/80">
                                        • {tx.author}
                                    </span>
                                )}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className={cn(
                                "font-semibold tabular-nums",
                                tx.type === "income" ? "text-income" : "text-expense"
                            )}>
                                {tx.type === "income" ? "+" : "-"}{formatRupiah(tx.amount)}
                            </span>

                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => onDelete(tx.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card >
    )
}
