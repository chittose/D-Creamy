"use client"

import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuickActionProps {
    onSaleClick?: () => void
    onExpenseClick?: () => void
    className?: string
}

export function QuickAction({ onSaleClick, onExpenseClick, className }: QuickActionProps) {
    return (
        <div className={cn("flex gap-3", className)}>
            <Button
                size="lg"
                onClick={onSaleClick}
                className="flex-1 h-14 gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
            >
                <ShoppingBag className="h-5 w-5" />
                <span>Input Penjualan</span>
            </Button>

            <Button
                size="lg"
                variant="outline"
                onClick={onExpenseClick}
                className="h-14 px-4 border-2"
            >
                <span>+ Pengeluaran</span>
            </Button>
        </div>
    )
}
