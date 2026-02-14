/**
 * Business Day Utilities
 * 
 * D'Creamy uses 21:00 WIB (UTC+7) as the daily cutoff time.
 * Transactions after 21:00 are counted towards the next business day.
 */

// Cutoff hour in WIB (21:00 = 9 PM)
export const DAILY_CUTOFF_HOUR = 21

// WIB timezone offset in hours
export const WIB_OFFSET = 7

/**
 * Get the current time in WIB timezone
 */
export function getWIBTime(): Date {
    const now = new Date()
    // Convert to WIB by adding the offset
    const utc = now.getTime() + now.getTimezoneOffset() * 60000
    return new Date(utc + WIB_OFFSET * 3600000)
}

/**
 * Get the current business day start time
 * Business day starts at 21:00 WIB previous day and ends at 21:00 WIB current day
 * 
 * Example:
 * - At 2026-02-05 08:00 WIB → Business day is 2026-02-04 (started 2026-02-04 21:00)
 * - At 2026-02-05 22:00 WIB → Business day is 2026-02-05 (started 2026-02-05 21:00)
 */
export function getBusinessDayStart(): Date {
    const wibNow = getWIBTime()
    const hour = wibNow.getHours()

    // Create a date at cutoff time
    const cutoff = new Date(wibNow)
    cutoff.setHours(DAILY_CUTOFF_HOUR, 0, 0, 0)

    // If current time is before cutoff, the business day started yesterday
    if (hour < DAILY_CUTOFF_HOUR) {
        cutoff.setDate(cutoff.getDate() - 1)
    }

    // Convert back to UTC for database queries
    const utcCutoff = new Date(cutoff.getTime() - WIB_OFFSET * 3600000)
    return utcCutoff
}

/**
 * Get the end of the current business day
 */
export function getBusinessDayEnd(): Date {
    const start = getBusinessDayStart()
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return end
}

/**
 * Get the business day date label (YYYY-MM-DD format)
 * This represents the "business date" which may differ from calendar date
 */
export function getBusinessDayLabel(): string {
    const wibNow = getWIBTime()
    const hour = wibNow.getHours()

    // If before cutoff, use current calendar date
    // If after cutoff, use next calendar date as the business day label
    const businessDate = new Date(wibNow)
    if (hour >= DAILY_CUTOFF_HOUR) {
        businessDate.setDate(businessDate.getDate() + 1)
    }

    return businessDate.toISOString().split('T')[0]
}

/**
 * Get milliseconds until next daily reset (9 PM WIB)
 */
export function getMsUntilReset(): number {
    const wibNow = getWIBTime()
    const nextReset = new Date(wibNow)

    nextReset.setHours(DAILY_CUTOFF_HOUR, 0, 0, 0)

    // If we're past today's cutoff, next reset is tomorrow
    if (wibNow >= nextReset) {
        nextReset.setDate(nextReset.getDate() + 1)
    }

    return nextReset.getTime() - wibNow.getTime()
}

/**
 * Format time remaining until reset in human readable format
 */
export function formatTimeUntilReset(): string {
    const ms = getMsUntilReset()
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)

    if (hours === 0) {
        return `${minutes} menit lagi`
    }
    return `${hours} jam ${minutes} menit lagi`
}

/**
 * Check if a given ISO date string falls within today's business day
 */
export function isInCurrentBusinessDay(isoDateString: string): boolean {
    const date = new Date(isoDateString)
    const start = getBusinessDayStart()
    const end = getBusinessDayEnd()

    return date >= start && date < end
}

/**
 * Get business day range for a specific date (e.g., for historical reports)
 */
export function getBusinessDayRange(date: Date): { start: Date; end: Date } {
    const wibDate = new Date(date.getTime() + WIB_OFFSET * 3600000 - date.getTimezoneOffset() * 60000)

    const start = new Date(wibDate)
    start.setHours(DAILY_CUTOFF_HOUR, 0, 0, 0)
    start.setDate(start.getDate() - 1)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    // Convert back to UTC
    const utcStart = new Date(start.getTime() - WIB_OFFSET * 3600000)
    const utcEnd = new Date(end.getTime() - WIB_OFFSET * 3600000)

    return { start: utcStart, end: utcEnd }
}
