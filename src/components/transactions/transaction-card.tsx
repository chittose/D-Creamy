"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ChevronRight, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Transaction {
    id: string
    type: "income" | "expense"
    amount: number
    product?: string | null
    category: string
    note?: string | null
    createdAt: Date
}

interface TransactionCardProps {
    transaction: Transaction
    onEdit?: (tx: Transaction) => void
    onDelete?: (tx: Transaction) => void
    onClick?: (tx: Transaction) => void
    showActions?: boolean
}

function formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function TransactionCard({
    transaction,
    onEdit,
    onDelete,
    onClick,
    showActions = false,
}: TransactionCardProps) {
    const tx = transaction

    return (
        <Card
            className={cn(
                "card-hover cursor-pointer transition-all",
                onClick && "active:scale-[0.98]"
            )}
            onClick={() => onClick?.(tx)}
        >
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div
                        className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                            tx.type === "income" ? "bg-income-light" : "bg-expense-light"
                        )}
                    >
                        <span className="text-lg">{tx.type === "income" ? "💰" : "💸"}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                            {tx.product || tx.note || tx.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                                {tx.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                                {format(tx.createdAt, "HH:mm", { locale: id })}
                            </span>
                        </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <span
                            className={cn(
                                "font-semibold tabular-nums",
                                tx.type === "income" ? "text-income" : "text-expense"
                            )}
                        >
                            {tx.type === "income" ? "+" : "-"}
                            {formatRupiah(tx.amount)}
                        </span>

                        {showActions ? (
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEdit?.(tx)
                                    }}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete?.(tx)
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
