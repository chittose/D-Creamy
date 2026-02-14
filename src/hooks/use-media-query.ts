"use client"

import { useState, useEffect } from "react"

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl"

const breakpoints: Record<Breakpoint, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
}

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)
        setMatches(media.matches)

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
        media.addEventListener("change", listener)

        return () => media.removeEventListener("change", listener)
    }, [query])

    return matches
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
    return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`)
}

export function useIsMobile(): boolean {
    return !useBreakpoint("md")
}

export function useIsDesktop(): boolean {
    return useBreakpoint("md")
}
