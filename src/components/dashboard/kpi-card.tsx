"use client"

import { ReactNode } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
    title: string
    value: string
    subtitle?: string
    trend?: string
    trendDirection?: "up" | "down"
    icon?: ReactNode
    variant?: "income" | "expense" | "neutral"
    className?: string
}

export function KPICard({
    title,
    value,
    subtitle,
    trend,
    trendDirection,
    icon,
    variant = "neutral",
    className
}: KPICardProps) {
    return (
        <Card className={cn(
            "glass card-hover overflow-hidden border-none shadow-none",
            className
        )}>
            <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-1">{title}</p>
                        <p className={cn(
                            "text-2xl md:text-3xl font-bold tabular-nums truncate",
                            variant === "income" && "text-income",
                            variant === "expense" && "text-expense"
                        )}>
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 mt-2 text-sm font-medium",
                                trendDirection === "up" ? "text-income" : "text-expense"
                            )}>
                                {trendDirection === "up" ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : (
                                    <TrendingDown className="h-4 w-4" />
                                )}
                                <span>{trend}</span>
                            </div>
                        )}
                    </div>

                    {icon && (
                        <div className={cn(
                            "flex items-center justify-center shrink-0 w-12 h-12 rounded-xl",
                            variant === "income" && "bg-income-light text-income",
                            variant === "expense" && "bg-expense-light text-expense",
                            variant === "neutral" && "bg-muted text-muted-foreground"
                        )}>
                            {icon}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
