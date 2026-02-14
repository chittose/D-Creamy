"use client"

import { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

interface HeaderProps {
    title: string
    subtitle?: string
    showBack?: boolean
    children?: ReactNode
    className?: string
}

export function Header({
    title,
    subtitle,
    showBack = false,
    children,
    className
}: HeaderProps) {
    const router = useRouter()

    return (
        <header className={cn(
            "sticky top-0 z-40 flex items-center gap-3 px-4 h-14 md:h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border",
            className
        )}>
            {showBack ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="shrink-0 -ml-2"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            ) : (
                <MobileSidebar />
            )}

            <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-lg md:text-xl truncate">{title}</h1>
                {subtitle && (
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <ThemeToggle />
                {children}
            </div>
        </header>
    )
}
