"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    getMsUntilReset,
    formatTimeUntilReset,
    getBusinessDayStart,
    getBusinessDayEnd,
    getBusinessDayLabel
} from "@/lib/business-day"

interface UseDailyResetOptions {
    /** Callback when reset happens */
    onReset?: () => void
    /** Whether to auto-refresh on reset, default true */
    autoRefresh?: boolean
}

interface DailyResetState {
    /** Current business day label (YYYY-MM-DD) */
    businessDay: string
    /** Time remaining until next reset */
    timeUntilReset: string
    /** Milliseconds until next reset */
    msUntilReset: number
    /** Start of current business day (for queries) */
    dayStart: Date
    /** End of current business day (for queries) */
    dayEnd: Date
    /** Force refresh data */
    refresh: () => void
}

/**
 * Hook for daily reset at 21:00 WIB
 * Automatically refreshes data when the business day changes
 */
export function useDailyReset({
    onReset,
    autoRefresh = true,
}: UseDailyResetOptions = {}): DailyResetState {
    const [businessDay, setBusinessDay] = useState(getBusinessDayLabel)
    const [timeUntilReset, setTimeUntilReset] = useState(formatTimeUntilReset)
    const [msUntilReset, setMsUntilReset] = useState(getMsUntilReset)
    const [dayStart, setDayStart] = useState(getBusinessDayStart)
    const [dayEnd, setDayEnd] = useState(getBusinessDayEnd)

    const previousBusinessDay = useRef(businessDay)

    // Force refresh all data
    const refresh = useCallback(() => {
        setDayStart(getBusinessDayStart())
        setDayEnd(getBusinessDayEnd())
        setBusinessDay(getBusinessDayLabel())
        onReset?.()
    }, [onReset])

    // Update countdown every minute
    useEffect(() => {
        const updateCountdown = () => {
            setTimeUntilReset(formatTimeUntilReset())
            setMsUntilReset(getMsUntilReset())

            // Check if business day changed
            const newBusinessDay = getBusinessDayLabel()
            if (newBusinessDay !== previousBusinessDay.current) {
                previousBusinessDay.current = newBusinessDay
                setBusinessDay(newBusinessDay)
                setDayStart(getBusinessDayStart())
                setDayEnd(getBusinessDayEnd())

                if (autoRefresh) {
                    refresh()
                }
            }
        }

        // Update immediately
        updateCountdown()

        // Update every minute
        const interval = setInterval(updateCountdown, 60000)

        // Also schedule exact reset time
        const msToReset = getMsUntilReset()
        const resetTimeout = setTimeout(() => {
            updateCountdown()
            if (autoRefresh) {
                refresh()
            }
        }, msToReset + 1000) // +1s buffer

        return () => {
            clearInterval(interval)
            clearTimeout(resetTimeout)
        }
    }, [autoRefresh, refresh])

    return {
        businessDay,
        timeUntilReset,
        msUntilReset,
        dayStart,
        dayEnd,
        refresh,
    }
}
