"use client"

import { Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDailyReset } from "@/hooks/use-daily-reset"
import { cn } from "@/lib/utils"

interface DailyResetBannerProps {
    /** Callback when reset happens or manual refresh is triggered */
    onRefresh?: () => void
    /** Show compact version for mobile */
    compact?: boolean
    className?: string
}

/**
 * Banner showing daily reset countdown
 * Resets at 21:00 WIB every day
 */
export function DailyResetBanner({
    onRefresh,
    compact = false,
    className,
}: DailyResetBannerProps) {
    const { businessDay, timeUntilReset, msUntilReset, refresh } = useDailyReset({
        onReset: onRefresh,
    })

    const handleRefresh = () => {
        refresh()
        onRefresh?.()
    }

    // Format business day for display
    const formatBusinessDay = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        })
    }

    // Warning when less than 30 minutes until reset
    const isNearReset = msUntilReset < 30 * 60 * 1000

    if (compact) {
        return (
            <div
                className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                    isNearReset
                        ? "bg-alert-light text-alert-dark"
                        : "bg-muted text-muted-foreground",
                    className
                )}
            >
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Reset: {timeUntilReset}</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleRefresh}
                >
                    <RefreshCw className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return (
        <div
            className={cn(
                "flex items-center justify-between p-4 rounded-xl border",
                isNearReset
                    ? "bg-alert-light border-alert/30"
                    : "bg-muted/50 border-border",
                className
            )}
        >
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Badge variant={isNearReset ? "destructive" : "secondary"}>
                        {formatBusinessDay(businessDay)}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                        {isNearReset ? "⚠️ " : ""}Reset data harian dalam{" "}
                        <span className={cn("font-medium", isNearReset && "text-alert-dark")}>
                            {timeUntilReset}
                        </span>
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Data direset setiap jam 21:00 WIB
                </p>
            </div>

            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
            </Button>
        </div>
    )
}
