"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Loader2 } from "lucide-react"

const publicRoutes = ["/login", "/register", "/forgot-password"]

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (isLoading) return

        const isPublic = publicRoutes.some(route => pathname.startsWith(route))

        // 1. Not Authenticated & Protected Route -> Login
        if (!user && !isPublic) {
            router.replace("/login")
        }
        // 2. Authenticated & Public Route -> Dashboard
        else if (user && isPublic) {
            router.replace("/")
        }
    }, [user, isLoading, pathname, router])

    // Check status
    const isPublic = publicRoutes.some(route => pathname.startsWith(route))

    // Render content immediately to prevent stuck loading screens.
    // Protection is handled by useEffect Redirects.
    return <>{children}</>
}
